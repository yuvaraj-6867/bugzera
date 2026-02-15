import { Link, useLocation, useNavigate } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.clear()

    // Redirect to login page
    navigate('/login')

    // Show confirmation
    alert('✅ Logged out successfully!')
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = user.role || 'member'

  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/projects', label: 'Projects' },
    { path: '/documents', label: 'Documents', roles: ['manager', 'admin'] },
    { path: '/users', label: 'Users', roles: ['admin'] },
    { path: '/analytics', label: 'Analytics', roles: ['admin'] },
    { path: '/activity', label: 'Activity Feed' },
    { path: '/integrations', label: 'Integrations', roles: ['manager', 'admin'] },
    { path: '/knowledge-base', label: 'Knowledge Base', roles: ['manager', 'admin'] },
    { path: '/settings', label: 'Settings' },
  ]

  const navItems = allNavItems.filter(item => !item.roles || item.roles.includes(userRole))

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-0 h-screen overflow-y-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold bg-gradient-to-r from-primary-900 to-accent-neon bg-clip-text text-transparent">
          BugZera
        </h1>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-accent-neon/10 to-accent-electric/5 text-accent-neon font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-8 left-4 right-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
