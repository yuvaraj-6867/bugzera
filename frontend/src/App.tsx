import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MainLayout from './components/layout/MainLayout'
import PrivateRoute from './components/auth/PrivateRoute'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Projects from './pages/Projects/Projects'
import ProjectDetails from './pages/Projects/ProjectDetails'
import Users from './pages/Users/Users'
import Settings from './pages/Settings/Settings'
import Analytics from './pages/Analytics/Analytics'
import Activity from './pages/Activity/Activity'
import Integrations from './pages/Integrations/Integrations'
import KnowledgeBase from './pages/KnowledgeBase/KnowledgeBase'
import Tickets from './pages/Tickets/Tickets'
import Sprints from './pages/Sprints/Sprints'
import TestCases from './pages/TestCases/TestCases'
import TestPlans from './pages/TestPlans/TestPlans'
import Automation from './pages/Automation/Automation'
import Environments from './pages/Environments/Environments'
import TestData from './pages/TestData/TestData'
import TestRuns from './pages/TestRuns/TestRuns'
import CalendarEvents from './pages/Calendar/Calendar'
import Documents from './pages/Documents/Documents'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

const queryClient = new QueryClient()

const RoleRoute = ({ roles }: { roles: string[] }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

function App() {
  return (
    <ThemeProvider>
    <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<MainLayout />}>
              {/* All roles */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/sprints" element={<Sprints />} />
              <Route path="/test-cases" element={<TestCases />} />
              <Route path="/test-plans" element={<TestPlans />} />
              <Route path="/test-runs" element={<TestRuns />} />
              <Route path="/calendar" element={<CalendarEvents />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/activity" element={<Activity />} />

              {/* Manager + Admin */}
              <Route element={<RoleRoute roles={['manager', 'admin']} />}>
                <Route path="/documents" element={<Documents />} />
                <Route path="/environments" element={<Environments />} />
                <Route path="/test-data" element={<TestData />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
              </Route>

              {/* Admin only */}
              <Route element={<RoleRoute roles={['admin']} />}>
                <Route path="/automation" element={<Automation />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/users" element={<Users />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
    </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
