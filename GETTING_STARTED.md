# Getting Started with BugZera

## ✅ What's Been Built

### Phase 0: Foundation (COMPLETED)

#### Backend (Ruby on Rails 7.1 API)
- ✅ Rails API-only application initialized
- ✅ PostgreSQL database configured
- ✅ CORS configured for frontend communication
- ✅ Environment variables setup (.env files)
- ✅ Essential gems installed:
  - devise & devise-jwt (authentication)
  - active_model_serializers (JSON responses)
  - pundit (authorization)
  - sidekiq (background jobs)
  - kaminari (pagination)
  - rack-cors (CORS)

#### Frontend (React + TypeScript + Vite)
- ✅ Vite project with React 18 + TypeScript
- ✅ TailwindCSS with custom BugZera design system
- ✅ React Router for navigation
- ✅ Axios for API calls
- ✅ Zustand for state management
- ✅ React Query for server state
- ✅ Custom fonts: Syne, JetBrains Mono, Instrument Sans
- ✅ Design tokens from HTML mockup implemented

#### Project Structure
```
bugzera/
├── backend/                          # Rails API
│   ├── app/
│   ├── config/
│   │   ├── database.yml             # PostgreSQL config
│   │   └── initializers/cors.rb    # CORS settings
│   ├── Gemfile                      # Ruby dependencies
│   ├── .env.example                 # Environment template
│   └── .env                         # Environment variables
├── frontend/                         # React App
│   ├── src/
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind config
│   ├── package.json
│   ├── .env.example
│   └── .env
├── docs/                             # Documentation
│   ├── BugZera_Consolidated_SRS.md # Full requirements
│   └── IMPLEMENTATION_PLAN.md       # 16-week plan
├── .gitignore
└── README.md
```

## 🚀 Running the Application

### Prerequisites Check

```bash
# Check Ruby version (should be 3.4.4+)
ruby --version

# Check Node.js version (should be 20+)
node --version

# Check PostgreSQL (should be installed)
psql --version
```

### 1. Start Backend (Rails API)

```bash
# Navigate to backend
cd backend

# Create database
rails db:create

# Run migrations (once you create them)
rails db:migrate

# Seed database (optional)
rails db:seed

# Start Rails server
rails server -p 3000
```

Backend will be running at: **http://localhost:3000**

### 2. Start Frontend (React App)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Start development server
npm run dev
```

Frontend will be running at: **http://localhost:5173**

### 3. Verify Setup

- Open browser to http://localhost:5173
- You should see the BugZera welcome screen
- Check browser console for any errors

## 📋 Next Steps

### Immediate Tasks (Week 3-4)

1. **Create Database Migrations**
   - Users table
   - Projects table
   - Test cases table
   - Tickets table

2. **Implement Authentication**
   - Devise setup
   - JWT token generation
   - Login/Register endpoints
   - Auth context in frontend

3. **Build Layout Components**
   - Sidebar navigation (from HTML mockup)
   - Header with user menu
   - Main layout wrapper

4. **Create API Endpoints**
   - User management
   - Project CRUD
   - Authentication endpoints

## 🎨 Design System

The frontend uses a custom design system based on the HTML mockup:

### Colors
- **Primary**: Dark blues (#0A0E27 to #556396)
- **Accent**: Electric (#00F0FF), Neon (#7B61FF), Coral (#FF6B9D), Lime (#B4FF39)
- **Status**: Success (#00E676), Warning (#FFB800), Error (#FF3B30), Info (#00B4D8)

### Typography
- **Headings**: Syne (bold, extrabold)
- **Body**: Instrument Sans
- **Code**: JetBrains Mono

### Components Available
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-danger`
- Forms: `.form-input`, `.form-select`, `.form-textarea`, `.form-label`
- Cards: `.card`
- Badges: `.badge-*` (success, error, warning, info, neutral)
- Modals: `.modal-*` classes

## 🔧 Development Commands

### Backend
```bash
# Run tests
bundle exec rspec

# Code linting
bundle exec rubocop

# Database console
rails dbconsole

# Rails console
rails console
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
```

## 📊 Current Status

- ✅ Project structure setup
- ✅ Backend Rails API initialized
- ✅ Frontend React app initialized  
- ✅ TailwindCSS design system configured
- ✅ Environment configuration complete
- ⏳ Database migrations (pending)
- ⏳ Authentication implementation (pending)
- ⏳ UI components (pending)
- ⏳ API endpoints (pending)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Frontend Not Loading
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

- [Full SRS Document](./BugZera_Consolidated_SRS.md) - Complete requirements specification
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - 16-week development roadmap
- [README](./README.md) - Project overview and setup

## 🎯 Phase 1 Goals (Next 2 Weeks)

1. User authentication (register, login, logout)
2. User profile management
3. Basic dashboard
4. Projects list and creation
5. Navigation layout with sidebar

## 💡 Tips

- Use the HTML mockups as reference for UI implementation
- Follow the design system classes for consistency
- API endpoints should follow REST conventions
- Use React Query for all server state
- Keep components small and reusable

---

**Ready to build!** 🚀 All foundation work is complete. Time to implement features!
