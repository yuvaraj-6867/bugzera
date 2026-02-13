import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/users" element={<Users />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/sprints" element={<Sprints />} />
              <Route path="/test-cases" element={<TestCases />} />
              <Route path="/test-plans" element={<TestPlans />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/environments" element={<Environments />} />
              <Route path="/test-data" element={<TestData />} />
              <Route path="/test-runs" element={<TestRuns />} />
              <Route path="/calendar" element={<CalendarEvents />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
