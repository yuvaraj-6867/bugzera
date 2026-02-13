FROM ruby:3.4.4-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    sqlite-dev \
    tzdata \
    nodejs \
    git \
    yaml-dev \
    linux-headers \
    libffi-dev \
    gcompat \
    imagemagick \
    ffmpeg

WORKDIR /app

# Install gems
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment 'false' && \
    bundle install -j4

# Copy application code
COPY . .

# Precompile assets (if any)
# RUN bundle exec rails assets:precompile

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3000"]