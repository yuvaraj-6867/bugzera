import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.clear()
    navigate('/login')
    alert('Logged out successfully!')
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = user.role || 'member'

  const allNavItems = [
    { path: '/dashboard', labelKey: 'sidebar.dashboard' },
    { path: '/projects', labelKey: 'sidebar.projects' },
    { path: '/documents', labelKey: 'sidebar.documents', roles: ['manager', 'admin'] },
    { path: '/users', labelKey: 'sidebar.users', roles: ['admin'] },
    { path: '/analytics', labelKey: 'sidebar.analytics', roles: ['admin'] },
    { path: '/activity', labelKey: 'sidebar.activity' },
    { path: '/integrations', labelKey: 'sidebar.integrations', roles: ['manager', 'admin'] },
    { path: '/knowledge-base', labelKey: 'sidebar.knowledgeBase', roles: ['manager', 'admin'] },
    { path: '/settings', labelKey: 'sidebar.settings' },
  ]

  const navItems = allNavItems.filter(item => !item.roles || item.roles.includes(userRole))

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 h-screen overflow-y-auto p-4">
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
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-8 left-4 right-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
