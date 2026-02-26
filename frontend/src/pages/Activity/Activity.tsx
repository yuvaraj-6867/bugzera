import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import BLoader from '../../components/BLoader'

const Activity = () => {
  const { t } = useLanguage()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1 })
  const [loadingMore, setLoadingMore] = useState(false)
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  const typeColors: Record<string, string> = {
    Ticket: 'bg-red-100 text-red-700',
    TestCase: 'bg-blue-100 text-blue-700',
    TestRun: 'bg-indigo-100 text-indigo-700',
    Document: 'bg-green-100 text-green-700',
    Sprint: 'bg-purple-100 text-purple-700',
    Project: 'bg-orange-100 text-orange-700',
    Article: 'bg-teal-100 text-teal-700',
    Comment: 'bg-pink-100 text-pink-700',
  }

  const typeIcons: Record<string, string> = {
    Ticket: '🐛', TestCase: '🧪', TestRun: '▶️',
    Document: '📄', Sprint: '🏃', Project: '📁',
    Article: '📖', Comment: '💬',
  }

  const fetchActivities = useCallback(async (pageNum = 1, append = false) => {
    pageNum === 1 ? setLoading(true) : setLoadingMore(true)
    try {
      const params = new URLSearchParams({ page: String(pageNum), per_page: '30' })
      if (filter !== 'all') params.set('action_type', filter)
      const res = await fetch(`/api/v1/activities?${params}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const items = data.activities || []
        setActivities(prev => append ? [...prev, ...items] : items)
        setMeta(data.meta || { total: items.length, pages: 1 })
        return
      }
    } catch (err) {
      console.error('Activities API error, falling back:', err)
    }

    // Fallback: aggregate from existing endpoints (when activities table is empty)
    const all: any[] = []
    try {
      const [tRes, tcRes, docsRes] = await Promise.all([
        fetch('/api/v1/tickets', { headers }),
        fetch('/api/v1/test_cases', { headers }),
        fetch('/api/v1/documents', { headers }),
      ])
      if (tRes.ok) {
        const { tickets = [] } = await tRes.json()
        tickets.forEach((t: any) => all.push({ id: `ticket-${t.id}`, trackable_type: 'Ticket', action: t.updated_at !== t.created_at ? 'updated' : 'created', owner_name: t.created_by || 'Unknown', owner_initials: (t.created_by || '?')[0].toUpperCase(), trackable_name: t.title, created_at: t.updated_at || t.created_at }))
      }
      if (tcRes.ok) {
        const { test_cases = [] } = await tcRes.json()
        test_cases.forEach((tc: any) => all.push({ id: `tc-${tc.id}`, trackable_type: 'TestCase', action: tc.updated_at !== tc.created_at ? 'updated' : 'created', owner_name: tc.created_by || 'Unknown', owner_initials: (tc.created_by || '?')[0].toUpperCase(), trackable_name: tc.title, created_at: tc.updated_at || tc.created_at }))
      }
      if (docsRes.ok) {
        const { documents = [] } = await docsRes.json()
        documents.forEach((d: any) => all.push({ id: `doc-${d.id}`, trackable_type: 'Document', action: 'uploaded', owner_name: d.uploaded_by || 'Unknown', owner_initials: (d.uploaded_by || '?')[0].toUpperCase(), trackable_name: d.title, created_at: d.updated_at || d.created_at }))
      }
    } catch (_) {}
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setActivities(all)
    setMeta({ total: all.length, pages: 1 })
    setLoading(false)
  }, [filter])

  useEffect(() => {
    setPage(1)
    fetchActivities(1, false)
  }, [fetchActivities])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchActivities(next, true)
  }

  const displayActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.trackable_type === filter || a.action?.includes(filter))

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-transparent p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] dark:text-gray-100 mb-2">{t('activity.title')}</h1>
          <p className="text-[#64748B] dark:text-gray-400">{t('activity.subtitle')}</p>
        </div>
        <a href="/api/v1/activities/export"
          className="btn btn-outline text-sm"
          target="_blank" rel="noopener noreferrer">
          ↓ Export CSV
        </a>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'Ticket', label: '🐛 Tickets' },
          { value: 'TestCase', label: '🧪 Test Cases' },
          { value: 'TestRun', label: '▶️ Test Runs' },
          { value: 'Document', label: '📄 Documents' },
          { value: 'Sprint', label: '🏃 Sprints' },
          { value: 'Project', label: '📁 Projects' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.value ? 'bg-accent-neon text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Stream */}
      {loading ? (
        <BLoader />
      ) : displayActivities.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>No activities found</p>
          <p className="text-sm mt-1">Activities will appear here as your team uses BugZera</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayActivities.map((activity: any) => (
              <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-neon to-accent-electric flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {activity.owner_initials || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#0F172A] dark:text-gray-100">
                    <span className="font-semibold">{activity.owner_name || 'Unknown'}</span>
                    <span className="text-gray-500 dark:text-gray-400 mx-1">{activity.action}</span>
                    {activity.trackable_type && (
                      <span className="text-gray-400 dark:text-gray-500 mr-1 text-xs">
                        {typeIcons[activity.trackable_type] || '•'}
                      </span>
                    )}
                    <span className="font-medium text-accent-neon">{activity.trackable_name || 'item'}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(activity.created_at)}</p>
                </div>
                {activity.trackable_type && (
                  <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${typeColors[activity.trackable_type] || 'bg-gray-100 text-gray-600'}`}>
                    {activity.trackable_type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Load More */}
          {page < meta.pages && (
            <div className="text-center mt-6">
              <button onClick={loadMore} disabled={loadingMore}
                className="btn btn-outline disabled:opacity-50">
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Activity
