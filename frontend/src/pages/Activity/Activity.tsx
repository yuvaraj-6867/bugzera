import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { T } from '../../components/AutoTranslate'

interface ActivityItem {
  id: string
  user: string
  action: string
  item: string
  type: string
  time: string
  timestamp: number
}

const Activity = () => {
  const { t } = useLanguage()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const headers = {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }

  const timeAgo = (dateStr: string) => {
    const now = new Date().getTime()
    const date = new Date(dateStr).getTime()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
    const months = Math.floor(days / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  }

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    const allActivities: ActivityItem[] = []

    try {
      // Fetch tickets
      const ticketsRes = await fetch('http://localhost:3000/api/v1/tickets', { headers })
      if (ticketsRes.ok) {
        const data = await ticketsRes.json()
        const tickets = data.tickets || data || []
        tickets.forEach((t: any) => {
          allActivities.push({
            id: `ticket-${t.id}`,
            user: t.created_by || 'Unknown',
            action: t.updated_at !== t.created_at ? 'updated ticket' : 'created ticket',
            item: `${t.title}`,
            type: 'ticket',
            time: timeAgo(t.updated_at || t.created_at),
            timestamp: new Date(t.updated_at || t.created_at).getTime()
          })
        })
      }

      // Fetch test cases
      const tcRes = await fetch('http://localhost:3000/api/v1/test_cases', { headers })
      if (tcRes.ok) {
        const data = await tcRes.json()
        const testCases = data.test_cases || data || []
        testCases.forEach((tc: any) => {
          allActivities.push({
            id: `tc-${tc.id}`,
            user: tc.created_by || 'Unknown',
            action: tc.updated_at !== tc.created_at ? 'updated test case' : 'created test case',
            item: `${tc.title}`,
            type: 'test-case',
            time: timeAgo(tc.updated_at || tc.created_at),
            timestamp: new Date(tc.updated_at || tc.created_at).getTime()
          })
        })
      }

      // Fetch documents
      const docsRes = await fetch('http://localhost:3000/api/v1/documents', { headers })
      if (docsRes.ok) {
        const data = await docsRes.json()
        const docs = data.documents || data || []
        docs.forEach((d: any) => {
          allActivities.push({
            id: `doc-${d.id}`,
            user: d.uploaded_by || 'Unknown',
            action: 'uploaded document',
            item: `${d.title}`,
            type: 'document',
            time: timeAgo(d.updated_at || d.created_at),
            timestamp: new Date(d.updated_at || d.created_at).getTime()
          })
        })
      }

      // Fetch sprints
      const sprintsRes = await fetch('http://localhost:3000/api/v1/sprints', { headers })
      if (sprintsRes.ok) {
        const data = await sprintsRes.json()
        const sprints = data.sprints || data || []
        sprints.forEach((s: any) => {
          allActivities.push({
            id: `sprint-${s.id}`,
            user: 'System',
            action: s.status === 'active' ? 'started sprint' : 'created sprint',
            item: `${s.name}`,
            type: 'sprint',
            time: timeAgo(s.updated_at || s.created_at),
            timestamp: new Date(s.updated_at || s.created_at).getTime()
          })
        })
      }

      // Sort by most recent
      allActivities.sort((a, b) => b.timestamp - a.timestamp)
      setActivities(allActivities)
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ticket': return 'bg-red-100 text-red-700'
      case 'test-case': return 'bg-blue-100 text-blue-700'
      case 'document': return 'bg-green-100 text-green-700'
      case 'sprint': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ticket': return 'Ticket'
      case 'test-case': return 'Test Case'
      case 'document': return 'Document'
      case 'sprint': return 'Sprint'
      default: return type
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter)

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-2">{t('activity.title')}</h1>
        <p className="text-[#64748B]">{t('activity.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        {[
          { value: 'all', label: 'All' },
          { value: 'ticket', label: 'Tickets' },
          { value: 'test-case', label: 'Test Cases' },
          { value: 'document', label: 'Documents' },
          { value: 'sprint', label: 'Sprints' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.value
                ? 'bg-accent-neon text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Stream */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading activities...</div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No activities found</div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map(activity => (
            <div key={activity.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                {getInitials(activity.user)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#0F172A]">
                  <span className="font-semibold">{activity.user}</span>
                  {' '}<span className="text-gray-500"><T>{activity.action}</T></span>
                  {' '}<span className="font-medium text-accent-neon"><T>{activity.item}</T></span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getTypeColor(activity.type)}`}>
                {getTypeLabel(activity.type)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Activity
