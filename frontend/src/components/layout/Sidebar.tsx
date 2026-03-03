import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.clear()
    navigate('/login')
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = user.role || 'member'

  // SRS Section 3.2 Permission Matrix
  // No roles array = visible to ALL roles
  const allNavItems = [
    { path: '/projects',      labelKey: 'sidebar.projects' },
    { path: '/users',         labelKey: 'sidebar.users',      roles: ['admin', 'manager', 'developer', 'viewer'] },
    { path: '/analytics',     labelKey: 'sidebar.analytics',  roles: ['admin', 'manager', 'member', 'developer', 'viewer'] },
    { path: '/activity',      labelKey: 'sidebar.activity' },
    { path: '/integrations',  labelKey: 'sidebar.integrations',   roles: ['manager', 'admin'] },
    { path: '/labels',        labelKey: 'sidebar.labels',          roles: ['manager', 'admin'] },
    { path: '/knowledge-base',labelKey: 'sidebar.knowledgeBase',  roles: ['manager', 'admin'] },
    { path: '/settings',      labelKey: 'sidebar.settings',       roles: ['member', 'manager', 'admin'] },
  ]

  const navItems = allNavItems.filter(item => !item.roles || item.roles.includes(userRole))

  const roleBadgeColor: Record<string, string> = {
    admin:     'bg-red-100 text-red-700',
    manager:   'bg-blue-100 text-blue-700',
    member:    'bg-green-100 text-green-700',
    developer: 'bg-purple-100 text-purple-700',
    viewer:    'bg-gray-100 text-gray-600',
  }

  return (
    <aside className={`
      w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
      fixed left-0 top-0 h-screen overflow-y-auto p-4 z-40
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      {/* Mobile close button */}
      <button
        className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={onClose}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mb-6 pr-8 md:pr-0">
        <h1 className="text-3xl font-heading font-extrabold bg-gradient-to-r from-primary-900 to-accent-neon bg-clip-text text-transparent">
          BugZera
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${roleBadgeColor[userRole] || roleBadgeColor['member']}`}>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </span>
          {userRole === 'viewer' && (
            <span className="text-xs text-gray-400 italic">Read-only</span>
          )}
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
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

      {/* Logout */}
      <div className="absolute bottom-4 left-4 right-4 border-t border-gray-100 dark:border-gray-800 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
