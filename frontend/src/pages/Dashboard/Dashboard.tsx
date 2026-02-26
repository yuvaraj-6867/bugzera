import React, { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import BLoader from '../../components/BLoader'

const hdrs = () => ({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  passed:  'bg-green-100 text-green-800',
  failed:  'bg-red-100 text-red-800',
}

const MetricCard = ({ label, value, sub, color = 'text-[#0F172A] dark:text-gray-100', icon }: any) => (
  <div className="card flex flex-col gap-1">
    <div className="flex justify-between items-center mb-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {icon && <span className="text-2xl">{icon}</span>}
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

const DEFAULT_WIDGET_ORDER = ['pass_rate', 'test_cases', 'open_tickets', 'resolution_rate', 'exec_time', 'automation', 'projects', 'members']

const Dashboard = () => {
  const { t } = useLanguage()
  const [loading, setLoading]       = useState(true)
  const [metrics, setMetrics]       = useState<any>(null)
  const [activity, setActivity]     = useState<any>(null)
  const [trends, setTrends]         = useState<any[]>([])
  const [activeTab, setActiveTab]   = useState('overview')
  const [dragWidget, setDragWidget] = useState<string | null>(null)
  const [dragOver, setDragOver]     = useState<string | null>(null)
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dashboardWidgetOrder')
      return saved ? JSON.parse(saved) : DEFAULT_WIDGET_ORDER
    } catch { return DEFAULT_WIDGET_ORDER }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, aRes, tRes] = await Promise.all([
        fetch('/api/v1/dashboard/metrics', { headers: hdrs() }),
        fetch('/api/v1/dashboard/user_activity', { headers: hdrs() }),
        fetch('/api/v1/dashboard/trends', { headers: hdrs() }),
      ])
      if (mRes.ok) setMetrics(await mRes.json())
      if (aRes.ok) setActivity(await aRes.json())
      if (tRes.ok) setTrends((await tRes.json()).activity_timeline || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleWidgetDrop = (targetKey: string) => {
    if (!dragWidget || dragWidget === targetKey) { setDragWidget(null); setDragOver(null); return }
    const order = [...widgetOrder]
    const from = order.indexOf(dragWidget)
    const to = order.indexOf(targetKey)
    if (from < 0 || to < 0) { setDragWidget(null); setDragOver(null); return }
    order.splice(from, 1)
    order.splice(to, 0, dragWidget)
    setWidgetOrder(order)
    setDragWidget(null)
    setDragOver(null)
    localStorage.setItem('dashboardWidgetOrder', JSON.stringify(order))
    fetch('/api/v1/analytics/update_dashboard', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...hdrs() },
      body: JSON.stringify({ widget_order: order })
    }).catch(() => {})
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: 'User Activity' },
    { key: 'trends',   label: 'Trends' },
  ]

  const tm = metrics?.test_metrics || {}
  const tk = metrics?.ticket_metrics || {}

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-transparent p-8">
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

      {loading ? <BLoader /> : (
        <>
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {/* KPI Cards — draggable to reorder */}
              {(() => {
                const widgetMap: Record<string, React.ReactNode> = {
                  pass_rate:       <MetricCard label="Test Pass Rate" icon="✅" value={`${tm.pass_rate ?? 0}%`} sub={`${tm.total_runs_this_month ?? 0} runs this month`} color={tm.pass_rate >= 70 ? 'text-green-600' : 'text-red-600'} />,
                  test_cases:      <MetricCard label="Total Test Cases" icon="📋" value={tm.total_test_cases ?? 0} sub={`${tm.active_test_cases ?? 0} active`} />,
                  open_tickets:    <MetricCard label="Open Tickets" icon="🐛" value={tk.open_tickets ?? 0} sub={`${tk.total_tickets ?? 0} total`} color={tk.open_tickets > 10 ? 'text-red-600' : 'text-[#0F172A] dark:text-gray-100'} />,
                  resolution_rate: <MetricCard label="Resolution Rate" icon="🎯" value={`${tk.resolution_rate ?? 0}%`} sub={`${tk.closed_tickets ?? 0} resolved`} color={tk.resolution_rate >= 70 ? 'text-green-600' : 'text-orange-600'} />,
                  exec_time:       <MetricCard label="Avg Execution Time" icon="⏱" value={`${tm.avg_execution_time ?? 0}s`} sub="per test run" />,
                  automation:      <MetricCard label="Automation Coverage" icon="🤖" value={`${metrics?.automation_metrics?.automation_coverage ?? 0}%`} sub="automated" />,
                  projects:        <MetricCard label="Projects" icon="📁" value={metrics?.projects_count ?? 0} sub="total projects" />,
                  members:         <MetricCard label="Team Members" icon="👥" value={metrics?.users_count ?? 0} sub="users" />,
                }
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {widgetOrder.filter(k => k in widgetMap).map(key => (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => setDragWidget(key)}
                        onDragOver={e => { e.preventDefault(); setDragOver(key) }}
                        onDrop={() => handleWidgetDrop(key)}
                        onDragEnd={() => { setDragWidget(null); setDragOver(null) }}
                        className={`cursor-grab active:cursor-grabbing transition-all ${
                          dragWidget === key ? 'opacity-40 scale-95' : ''
                        } ${dragOver === key && dragWidget !== key ? 'ring-2 ring-accent-neon ring-offset-2 rounded-xl' : ''}`}
                        title="Drag to reorder"
                      >
                        {widgetMap[key]}
                      </div>
                    ))}
                  </div>
                )
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Sprint */}
                {metrics?.active_sprint ? (
                  <div className="card">
                    <h3 className="text-lg font-bold mb-3 text-[#0F172A] dark:text-gray-100">
                      🏃 Active Sprint
                    </h3>
                    <p className="font-semibold text-accent-neon mb-1">{metrics.active_sprint.name}</p>
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>{metrics.active_sprint.done_tickets}/{metrics.active_sprint.total_tickets} tickets done</span>
                      <span>{metrics.active_sprint.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full bg-accent-neon transition-all"
                        style={{ width: `${metrics.active_sprint.completion_percentage}%` }} />
                    </div>
                    {metrics.active_sprint.end_date && (
                      <p className="text-xs text-gray-400 mt-2">
                        Ends: {new Date(metrics.active_sprint.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="card flex items-center justify-center text-gray-400 text-sm">
                    No active sprint
                  </div>
                )}

                {/* Upcoming Events */}
                <div className="card">
                  <h3 className="text-lg font-bold mb-3 text-[#0F172A] dark:text-gray-100">
                    📅 Upcoming Events
                  </h3>
                  {metrics?.upcoming_events?.length > 0 ? (
                    <ul className="space-y-2">
                      {metrics.upcoming_events.map((e: any) => (
                        <li key={e.id} className="flex gap-2 items-start text-sm">
                          <span className="text-accent-neon mt-0.5">•</span>
                          <div>
                            <p className="font-medium text-[#0F172A] dark:text-gray-200">{e.title}</p>
                            <p className="text-xs text-gray-400">
                              {e.start_time ? new Date(e.start_time).toLocaleString() : '—'}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No upcoming events</p>
                  )}
                </div>

                {/* Recent Test Runs */}
                <div className="card">
                  <h3 className="text-lg font-bold mb-3 text-[#0F172A] dark:text-gray-100">
                    🔄 Recent Test Runs
                  </h3>
                  {metrics?.recent_test_runs?.length > 0 ? (
                    <ul className="space-y-2">
                      {metrics.recent_test_runs.map((r: any) => (
                        <li key={r.id} className="flex justify-between items-center text-sm">
                          <span className="text-[#0F172A] dark:text-gray-200 truncate max-w-[60%]">
                            {r.test_case_title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status] || 'bg-gray-100 text-gray-600'}`}>
                            {r.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No recent test runs</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── USER ACTIVITY ── */}
          {activeTab === 'activity' && activity && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <MetricCard label="Online Users" value={activity.onlineUsers ?? 0}
                  color="text-green-600" />
                <MetricCard label="Active Today" value={activity.todayActive ?? 0}
                  color="text-blue-600" />
                <MetricCard label="Active This Week" value={activity.weekActive ?? 0} />
              </div>

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
