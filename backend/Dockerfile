FROM ruby:3.3.4

WORKDIR /app

COPY Gemfile ./
COPY Gemfile.lock* ./
RUN bundle install

COPY . .

EXPOSE 3001

CMD ["rails", "server", "-b", "0.0.0.0", "-p", "3001"]