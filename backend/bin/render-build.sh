#!/usr/bin/env bash
set -o errexit

bundle install
bundle exec rails db:create DISABLE_DATABASE_ENVIRONMENT_CHECK=1
bundle exec rails db:migrate