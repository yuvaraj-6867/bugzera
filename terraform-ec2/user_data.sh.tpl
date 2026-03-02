#!/bin/bash
# BugZera EC2 bootstrap — runs once on first boot
set -euo pipefail
exec >> /var/log/bugzera-setup.log 2>&1
echo "=== BugZera setup started: $(date) ==="

# ── Values injected by Terraform ──────────────────────────────────────────────
BACKEND_IMAGE="${backend_image}"
FRONTEND_IMAGE="${frontend_image}"
AWS_REGION_VAL="${aws_region}"
S3_BUCKET="${s3_bucket}"
FRONTEND_URL="${frontend_url}"
SECRET_KEY_BASE="${secret_key_base}"
GOOGLE_CLIENT_ID="${google_client_id}"
GOOGLE_CLIENT_SECRET="${google_client_secret}"

# ── 2 GB Swap — essential on 1 GB RAM instances ───────────────────────────────
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
  echo "Swap: 2 GB created"
fi

# ── Install Docker ────────────────────────────────────────────────────────────
dnf install -y docker git aws-cli
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Docker Compose v2
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
echo "Docker Compose installed: $(docker compose version)"

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p /opt/bugzera/{db,uploads,nginx}

# ── ECR Login ─────────────────────────────────────────────────────────────────
if [ -n "$BACKEND_IMAGE" ]; then
  ECR_REGISTRY=$(echo "$BACKEND_IMAGE" | cut -d'/' -f1)
  aws ecr get-login-password --region "$AWS_REGION_VAL" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"
  echo "ECR login: OK"
fi

# ── .env file ─────────────────────────────────────────────────────────────────
# Note: single-quote heredoc — bash won't expand $vars inside
# We've already set bash vars above from Terraform-provided values.
cat > /opt/bugzera/.env <<ENVEOF
RAILS_ENV=production
RAILS_LOG_TO_STDOUT=true
RAILS_SERVE_STATIC_FILES=true
TZ=Asia/Kolkata
DB_ADAPTER=sqlite3
SECRET_KEY_BASE=$SECRET_KEY_BASE
REDIS_URL=redis://redis:6379/1
FRONTEND_URL=$FRONTEND_URL
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=$FRONTEND_URL/api/v1/google_calendar/callback
AWS_REGION=$AWS_REGION_VAL
S3_BUCKET=$S3_BUCKET
ENVEOF

# ── nginx config — proxies /api to Rails, serves React SPA ───────────────────
# Note: nginx vars ($host, $remote_addr) are inside single-quote heredoc
# so bash does NOT expand them — nginx gets them as literals.
cat > /opt/bugzera/nginx/default.conf <<'NGINXEOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 50m;

    # API → Rails backend
    location /api/ {
        proxy_pass         http://backend:3000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # React SPA — all other routes
    location / {
        root       /usr/share/nginx/html;
        try_files  $uri $uri/ /index.html;
        expires    1h;
        add_header Cache-Control "public";
    }

    # Health check (used by monitoring)
    location /healthz {
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }
}
NGINXEOF

# ── docker-compose.yml ────────────────────────────────────────────────────────
# Double-quote heredoc — bash WILL expand $BACKEND_IMAGE, $FRONTEND_IMAGE
cat > /opt/bugzera/docker-compose.yml <<DCEOF
version: "3.9"

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    command: redis-server --save 60 1 --loglevel warning

  backend:
    image: $BACKEND_IMAGE
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./db:/app/db            # SQLite persistence
      - ./uploads:/app/public/uploads
    ports:
      - "127.0.0.1:3000:3000"  # bound to localhost only (nginx proxies)
    command: >
      sh -c "bundle exec rails db:migrate &&
             bundle exec rails server -b 0.0.0.0 -p 3000"
    depends_on:
      - redis
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/v1/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 90s

  sidekiq:
    image: $BACKEND_IMAGE
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./db:/app/db
      - ./uploads:/app/public/uploads
    command: bundle exec sidekiq
    depends_on:
      - redis

  frontend:
    image: $FRONTEND_IMAGE
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/bugzera.conf:ro
    depends_on:
      - backend

volumes:
  redis_data:
DCEOF

# ── Fix permissions ───────────────────────────────────────────────────────────
chown -R ec2-user:ec2-user /opt/bugzera

# ── Pull images & start (only if images are pre-configured) ──────────────────
cd /opt/bugzera

if [ -n "$BACKEND_IMAGE" ] && [ -n "$FRONTEND_IMAGE" ]; then
  docker compose pull
  docker compose up -d
  echo "=== BugZera started! Visit: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) ==="
else
  echo "=== Images not set. After pushing to ECR, run on this server: ==="
  echo "===   cd /opt/bugzera && docker compose pull && docker compose up -d ==="
fi

echo "=== Setup finished: $(date) ==="
