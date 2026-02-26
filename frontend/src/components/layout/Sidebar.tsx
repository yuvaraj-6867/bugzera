import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

const NotificationBell = () => {
  const [count, setCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const token = localStorage.getItem('authToken')
  const hdrs = { Authorization: `Bearer ${token}` }

  const fetchCount = () => {
    fetch('/api/v1/notifications/unread_count', { headers: hdrs })
      .then(r => r.json()).then(d => setCount(d.count || 0)).catch(() => {})
  }

  const fetchNotifications = () => {
    fetch('/api/v1/notifications', { headers: hdrs })
      .then(r => r.json()).then(d => setNotifications(Array.isArray(d) ? d : [])).catch(() => {})
  }

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/v1/notifications/mark_all_read', { method: 'PATCH', headers: hdrs })
    setCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markRead = async (id: number) => {
    await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH', headers: hdrs })
    setCount(c => Math.max(0, c - 1))
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200"
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span>Notifications</span>
        {count > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full top-0 ml-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifications</span>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent-neon hover:text-accent-electric font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No notifications yet</div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="w-2 h-2 bg-accent-neon rounded-full flex-shrink-0 mt-1.5" />}
                  <div className={!n.read ? '' : 'ml-4'}>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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

  // SRS Section 3.2 Permission Matrix
  // No roles array = visible to ALL roles
  const allNavItems = [
    { path: '/projects',      labelKey: 'sidebar.projects' },
    { path: '/users',         labelKey: 'sidebar.users',      roles: ['admin', 'manager', 'developer', 'viewer'] },
    { path: '/analytics',     labelKey: 'sidebar.analytics',  roles: ['admin', 'manager', 'developer', 'viewer'] },
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
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 h-screen overflow-y-auto p-4">
      <div className="mb-6">
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

        {/* Notification Bell */}
        <NotificationBell />
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
