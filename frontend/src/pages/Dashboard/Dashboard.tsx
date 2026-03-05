import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { Skeleton } from '../../components/Skeleton'


const hdrs = () => ({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })

const Dashboard = () => {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<any>(null)
  const [trends, setTrends]     = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('activity')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, tRes] = await Promise.all([
        fetch('/api/v1/dashboard/user_activity', { headers: hdrs() }),
        fetch('/api/v1/dashboard/trends', { headers: hdrs() }),
      ])
      if (aRes.ok) setActivity(await aRes.json())
      if (tRes.ok) setTrends((await tRes.json()).activity_timeline || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const tabs = [
    { key: 'activity', label: 'User Activity' },
    { key: 'trends',   label: 'Trends' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-transparent p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] dark:text-gray-100 mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-[#64748B] dark:text-gray-400">{t('dashboard.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={fetchData}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({length: 4}).map((_,i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-gray-700 text-accent-neon shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── USER ACTIVITY ── */}
          {activeTab === 'activity' && activity && (
            <>
              <div className="card">
                <h3 className="text-lg font-bold mb-4 text-[#0F172A] dark:text-gray-100">Team Activity</h3>
                <div className="space-y-3">
                  {(activity.users || []).map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent-neon flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {u.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm text-[#0F172A] dark:text-gray-200">{u.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            u.status === 'online' ? 'bg-green-100 text-green-700' :
                            u.status === 'away'   ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{u.status}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{u.activity}</p>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mt-1">
                          <div className="h-1 bg-accent-neon rounded-full" style={{ width: `${u.progress}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{u.active_time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── TRENDS ── */}
          {activeTab === 'trends' && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4 text-[#0F172A] dark:text-gray-100">Activity (Last 7 days)</h3>
              {trends.length === 0 ? (
                <p className="text-gray-400 text-sm">No trend data yet</p>
              ) : (
                <div className="space-y-3">
                  {trends.map((d: any, i: number) => {
                    const max = Math.max(...trends.map(t => t.total || 0), 1)
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-10 text-right">{d.date}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="h-4 bg-accent-neon rounded-full transition-all"
                            style={{ width: `${Math.round((d.total / max) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-16">
                          {d.testCases}TC / {d.tickets}T / {d.testRuns}R
                        </span>
                      </div>
                    )
                  })}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-neon inline-block" /> Total</span>
                    <span>TC = Test Cases · T = Tickets · R = Runs</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
