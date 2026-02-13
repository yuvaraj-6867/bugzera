# BugZera - Complete Test Management Platform

[![Backend CI](https://github.com/yuvaraj106/bugzera/workflows/Backend%20CI%2FCD/badge.svg)](https://github.com/yuvaraj106/bugzera/actions)
[![Frontend CI](https://github.com/yuvaraj106/bugzera/workflows/Frontend%20CI%2FCD/badge.svg)](https://github.com/yuvaraj106/bugzera/actions)

> A comprehensive test management and bug tracking platform built with Rails & React

## 🚀 Features

- ✅ **Test Case Management** - Create, organize, and track test cases
- 🐛 **Bug Tracking** - Comprehensive ticket system
- 🤖 **Test Automation** - Playwright/Selenium integration
- 📊 **Analytics** - Real-time testing metrics and reports
- 🏃 **Sprint Management** - Agile sprint planning
- 🌍 **Multi-Environment** - Dev, Staging, Production support
- 📅 **Calendar** - Schedule test runs and events
- 👥 **User Management** - Role-based access control

## 🛠 Tech Stack

**Backend:**
- Ruby 3.4.4
- Rails 7.1.5
- PostgreSQL 15
- Redis 7
- Sidekiq (Background Jobs)

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- Tanstack Query

**DevOps:**
- Docker & Docker Compose
- GitHub Actions CI/CD
- Nginx (Production)

## 📦 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yuvaraj106/bugzera.git
cd bugzera
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Setup database:**
```bash
docker-compose exec backend rails db:create db:migrate db:seed
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Login: admin@bugzera.com / password123

## 🧪 Running Tests

**Backend Tests:**
```bash
docker-compose exec backend rspec
```

**Frontend Tests:**
```bash
docker-compose exec frontend npm test
```

## 📖 API Documentation

API docs available at: `http://localhost:3000/api-docs`

## 🔧 Development

### Backend Development
```bash
cd backend
bundle install
rails server
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## 🚀 Deployment

Automated deployment via GitHub Actions on push to `main` branch.

Manual deployment:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file

## 👨‍💻 Author

**Yuvaraj**
- GitHub: [@yuvaraj106](https://github.com/yuvaraj106)
- Email: yuvaraj@drylogics.com

## 🙏 Acknowledgments

- Rails community
- React team
- Docker team
