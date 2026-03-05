# BugZera — Deploy & AWS Operations Guide

## Table of Contents
- [Architecture](#architecture)
- [Deploy (Code Changes)](#deploy-code-changes)
- [AWS EC2 — Up & Down](#aws-ec2--up--down)
- [Docker Operations](#docker-operations)
- [Backend Manual Deploy](#backend-manual-deploy)
- [Database Operations](#database-operations)
- [Logs & Monitoring](#logs--monitoring)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
GitHub (master) → merge → GitHub (main)
                              ↓
                    GitHub Actions (deploy.yml)
                              ↓
                    SCP: frontend/dist → EC2
                              ↓
                    SSH: nginx reload
                              ↓
                    bugzera.shop ✅
```

**EC2 Server**: `13.127.213.186`
**Domain**: `bugzera.shop`
**SSH Key**: `~/.ssh/github_deploy`

---

## Deploy (Code Changes)

### Frontend Deploy (Automatic)

```bash
# 1. Code மாத்து, build பண்ணு
cd frontend
npx vite build

# 2. master-ல commit + push
cd ..
git add .
git commit -m "your message"
git push origin master

# 3. main-ல merge → auto deploy trigger ஆகும்
git checkout main
git merge master
git push origin main
git checkout master
```

GitHub Actions-ல green tick வந்தா deploy complete ✅
Check: https://github.com/yuvaraj-6867/bugzera/actions

---

### Backend Manual Deploy

GitHub Actions frontend மட்டும் deploy பண்ணும். Backend changes-க்கு manually பண்ணணும்:

```bash
# 1. Local-ல file copy பண்ணு EC2-க்கு
scp -i ~/.ssh/github_deploy backend/app/controllers/api/v1/your_file.rb \
  ec2-user@13.127.213.186:/tmp/

# 2. EC2-ல container-க்கு inside copy பண்ணு
ssh -i ~/.ssh/github_deploy ec2-user@13.127.213.186 "
  docker cp /tmp/your_file.rb bugzera-backend-1:/app/controllers/api/v1/
  docker restart bugzera-backend-1
"
```

---

## AWS EC2 — Up & Down

### EC2-ல SSH Login

```bash
ssh -i ~/.ssh/github_deploy ec2-user@13.127.213.186
```

---

### Production DOWN (App Stop)

```bash
# EC2-ல login ஆனா பிறகு:
cd /var/www/bugzera

# எல்லா containers-யும் stop
docker compose stop

# (or specific container மட்டும்)
docker stop bugzera-backend-1
docker stop bugzera-frontend-1
docker stop bugzera-redis-1
```

---

### Production UP (App Start)

```bash
# EC2-ல login ஆனா பிறகு:
cd /var/www/bugzera

# எல்லா containers-யும் start
docker compose up -d

# (or specific container மட்டும்)
docker start bugzera-backend-1
docker start bugzera-frontend-1
docker start bugzera-redis-1
```

---

### Full Restart (Recommended)

```bash
cd /var/www/bugzera
docker compose down
docker compose up -d
```

---

### EC2 Instance Stop/Start (AWS Console)

> ⚠️ Instance STOP பண்ணா — Docker data இருக்கும், ஆனா public IP மாறும்!

**AWS Console-ல:**
1. EC2 → Instances → bugzera instance select
2. Instance state → **Stop** (shutdown)
3. Instance state → **Start** (power on)

**AWS CLI-ல:**
```bash
# Stop
aws ec2 stop-instances --instance-ids i-xxxxxxxxxxxxxxxxx

# Start
aws ec2 start-instances --instance-ids i-xxxxxxxxxxxxxxxxx

# Status check
aws ec2 describe-instances --instance-ids i-xxxxxxxxxxxxxxxxx \
  --query 'Reservations[].Instances[].State.Name'
```

---

## Docker Operations

### Container Status Check

```bash
# எல்லா containers running-ஆ இருக்கா check
docker ps

# எல்லா containers (stopped-உம் சேர்த்து)
docker ps -a
```

Expected output:
```
CONTAINER ID   NAME                   STATUS
xxxxxxxxxxxx   bugzera-backend-1      Up 2 hours
xxxxxxxxxxxx   bugzera-frontend-1     Up 2 hours
xxxxxxxxxxxx   bugzera-redis-1        Up 2 hours
```

---

### Individual Container Restart

```bash
# Backend restart
docker restart bugzera-backend-1

# Frontend/Nginx restart
docker restart bugzera-frontend-1

# Redis restart
docker restart bugzera-redis-1
```

---

### Container-க்கு Inside போக

```bash
# Backend Rails console
docker exec -it bugzera-backend-1 bash
bundle exec rails console

# Frontend container
docker exec -it bugzera-frontend-1 sh
```

---

## Database Operations

### Rails DB Migrate (New Migration)

```bash
ssh -i ~/.ssh/github_deploy ec2-user@13.127.213.186 "
  docker exec bugzera-backend-1 bundle exec rails db:migrate
"
```

### Rails Console (Data check)

```bash
ssh -i ~/.ssh/github_deploy ec2-user@13.127.213.186 "
  docker exec -it bugzera-backend-1 bundle exec rails console
"
```

### SQLite Backup

```bash
# EC2-ல
docker exec bugzera-backend-1 cp /app/storage/production.sqlite3 /app/storage/backup_$(date +%Y%m%d).sqlite3

# Local-க்கு download
scp -i ~/.ssh/github_deploy \
  ec2-user@13.127.213.186:/var/www/bugzera/backend/storage/production.sqlite3 \
  ./backup_$(date +%Y%m%d).sqlite3
```

---

## Logs & Monitoring

### Live Logs பார்க்க

```bash
# Backend logs
docker logs -f bugzera-backend-1

# Frontend/Nginx logs
docker logs -f bugzera-frontend-1

# Redis logs
docker logs -f bugzera-redis-1

# எல்லாமே ஒரே நேரத்தில்
docker compose logs -f
```

### Error Logs மட்டும்

```bash
docker logs bugzera-backend-1 2>&1 | grep -i error | tail -50
```

---

## Troubleshooting

### Site Down ஆனா — Check Order

```bash
# Step 1: Containers running-ஆ?
docker ps

# Step 2: Nginx OK-வா?
docker exec bugzera-frontend-1 nginx -t

# Step 3: Backend responding-ஆ?
curl http://localhost:3000/api/v1/health

# Step 4: Logs பார்க்க
docker logs bugzera-backend-1 --tail 50
```

---

### Common Issues

| Problem | Fix |
|---------|-----|
| `502 Bad Gateway` | `docker restart bugzera-backend-1` |
| Site load ஆகல | `docker restart bugzera-frontend-1` |
| DB error வருது | `docker exec bugzera-backend-1 bundle exec rails db:migrate` |
| Memory full | `docker system prune -f` |
| All containers down | `cd /var/www/bugzera && docker compose up -d` |

---

### Disk Space Check

```bash
df -h          # Disk usage
docker system df   # Docker disk usage
docker system prune -f  # Unused images/containers clean
```

---

## Quick Reference

```bash
# SSH into EC2
ssh -i ~/.ssh/github_deploy ec2-user@13.127.213.186

# All up
cd /var/www/bugzera && docker compose up -d

# All down
cd /var/www/bugzera && docker compose down

# Status
docker ps

# Logs
docker logs -f bugzera-backend-1

# DB migrate
docker exec bugzera-backend-1 bundle exec rails db:migrate

# Deploy frontend (local-ல run பண்ணு)
cd frontend && npx vite build && cd .. && \
git add . && git commit -m "deploy" && \
git push origin master && \
git checkout main && git merge master && git push origin main && \
git checkout master
```
