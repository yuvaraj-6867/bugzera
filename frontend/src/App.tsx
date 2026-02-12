import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-[#FAFBFC]">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-6xl font-heading font-extrabold mb-4 bg-gradient-to-r from-primary-900 to-accent-neon bg-clip-text text-transparent">
                BugZera
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Test Management Platform
              </p>
              <p className="text-sm text-gray-500">
                Frontend and Backend are now running! 🚀
              </p>
            </div>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
