# BugZera - Test Management Platform

A comprehensive test management and bug tracking platform built with React + TypeScript frontend and Ruby on Rails backend.

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls
- Zustand for state management
- React Query for server state

### Backend
- Ruby on Rails 7.1 (API mode)
- PostgreSQL database
- Redis for caching and background jobs
- Sidekiq for background processing
- Devise + JWT for authentication
- Pundit for authorization
- Action Cable for WebSockets

## Features

- ✅ User authentication and authorization
- ✅ Project management
- ✅ Test case creation and management
- ✅ Test run execution and tracking
- ✅ Bug/ticket tracking
- ✅ Real-time updates via WebSocket
- ✅ Dashboard with analytics
- ✅ Document management
- ✅ Calendar and scheduling
- ✅ Team collaboration

## Prerequisites

- Ruby 3.4.4+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bugzera
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
bundle install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials

# Create and setup database
rails db:create
rails db:migrate
rails db:seed

# Start Rails server
rails server -p 3000
```

The backend API will be available at `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Development

### Running Tests

**Backend:**
```bash
cd backend
bundle exec rspec
```

**Frontend:**
```bash
cd frontend
npm run test
```

### Code Quality

**Backend:**
```bash
cd backend
bundle exec rubocop
```

**Frontend:**
```bash
cd frontend
npm run lint
```

## Project Structure

```
bugzera/
├── backend/              # Rails API
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   └── serializers/
│   ├── config/
│   ├── db/
│   └── spec/
├── frontend/             # React App
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── public/
├── docker/               # Docker configurations
└── docs/                 # Documentation
```

## API Documentation

API documentation is available at `/api-docs` when running the backend server.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

Copyright © 2026 BugZera. All rights reserved.
