import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MainLayout from './components/layout/MainLayout'
import PrivateRoute from './components/auth/PrivateRoute'
import Login from './pages/Auth/Login'
import ForgotPassword from './pages/Auth/ForgotPassword'
import Dashboard from './pages/Dashboard/Dashboard'
import Projects from './pages/Projects/Projects'
import ProjectDetails from './pages/Projects/ProjectDetails'
import Users from './pages/Users/Users'
import Settings from './pages/Settings/Settings'
import Analytics from './pages/Analytics/Analytics'
import Activity from './pages/Activity/Activity'
import Integrations from './pages/Integrations/Integrations'
import Labels from './pages/Labels/Labels'
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

// Restrict route to certain roles; redirect to /projects if not allowed
const RoleRoute = ({ roles }: { roles: string[] }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!roles.includes(user.role)) {
    return <Navigate to="/projects" replace />
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
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route element={<MainLayout />}>

              {/* Tabs 1–13: All roles — Dashboard, Projects, Test Cases, Test Plans, Test Runs,
                  Tickets, Sprints, Documents, Calendar, Activity, Users, Analytics */}
              <Route path="/dashboard"           element={<Dashboard />} />
              <Route path="/projects"            element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/test-cases"          element={<TestCases />} />
              <Route path="/test-plans"          element={<TestPlans />} />
              <Route path="/test-runs"           element={<TestRuns />} />
              <Route path="/tickets"             element={<Tickets />} />
              <Route path="/sprints"             element={<Sprints />} />
              <Route path="/documents"           element={<Documents />} />
              <Route path="/calendar"            element={<CalendarEvents />} />
              <Route path="/activity"            element={<Activity />} />
              <Route path="/users"               element={<Users />} />
              <Route path="/analytics"           element={<Analytics />} />

              {/* Tab 14: Admin + Manager + Member — Settings (Developer/Viewer: no access) */}
              <Route element={<RoleRoute roles={['admin', 'manager', 'member']} />}>
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Tabs 15–18: Manager + Admin — Integrations, Knowledge Base, Environments, Test Data */}
              <Route element={<RoleRoute roles={['manager', 'admin']} />}>
                <Route path="/integrations"   element={<Integrations />} />
                <Route path="/labels"         element={<Labels />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/environments"   element={<Environments />} />
                <Route path="/test-data"      element={<TestData />} />
              </Route>

              {/* Tab 19: Admin only — Automation */}
              <Route element={<RoleRoute roles={['admin']} />}>
                <Route path="/automation" element={<Automation />} />
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
