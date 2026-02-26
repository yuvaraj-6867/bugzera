import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const hdrs = () => ({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })

const StatCard = ({ label, value, sub, color = 'text-[#0F172A] dark:text-gray-100' }: any) => (
  <div className="card">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className={`text-3xl font-bold mb-1 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
)

const BarChart = ({ data, labelKey, valueKey, color }: any) => {
  const max = Math.max(...data.map((d: any) => d[valueKey] || 0), 1)
  return (
    <div className="space-y-3">
      {data.map((d: any, i: number) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{d[labelKey]}</span>
            <span className="text-gray-500">{d[valueKey]}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${color} transition-all`}
              style={{ width: `${Math.round((d[valueKey] / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

const Analytics = () => {
  const { t } = useLanguage()
  const { canScheduleAnalytics } = usePermissions()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [trendDays, setTrendDays] = useState(30)

  const [overview, setOverview]         = useState<any>(null)
  const [trends, setTrends]             = useState<any[]>([])
  const [byProject, setByProject]       = useState<any[]>([])
  const [ticketBreakdown, setTicketBreakdown] = useState<any>(null)
  const [velocity, setVelocity]         = useState<any[]>([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ovRes, trRes, prRes, tbRes, vRes] = await Promise.all([
        fetch('/api/v1/analytics/overview', { headers: hdrs() }),
        fetch(`/api/v1/analytics/trends?days=${trendDays}`, { headers: hdrs() }),
        fetch('/api/v1/analytics/by_project', { headers: hdrs() }),
        fetch('/api/v1/analytics/ticket_breakdown', { headers: hdrs() }),
        fetch('/api/v1/analytics/sprint_velocity', { headers: hdrs() }),
      ])
      if (ovRes.ok) setOverview(await ovRes.json())
      if (trRes.ok) setTrends((await trRes.json()).trends || [])
      if (prRes.ok) setByProject((await prRes.json()).projects || [])
      if (tbRes.ok) setTicketBreakdown(await tbRes.json())
      if (vRes.ok)  setVelocity((await vRes.json()).velocity || [])
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [trendDays])

  useEffect(() => { fetchAll() }, [fetchAll])

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'trends', label: 'Trends' },
    { key: 'projects', label: 'By Project' },
    { key: 'tickets', label: 'Tickets' },
    { key: 'sprints', label: 'Sprint Velocity' },
  ]

  const ticketStatusItems = ticketBreakdown?.by_status
    ? Object.entries(ticketBreakdown.by_status).map(([k, v]) => ({ label: k.replace(/_/g, ' '), count: v as number }))
    : []
  const ticketSeverityItems = ticketBreakdown?.by_severity
    ? Object.entries(ticketBreakdown.by_severity).map(([k, v]) => ({ label: k, count: v as number }))
    : []

  const severityColors: Record<string, string> = {
    critical: 'bg-red-600', high: 'bg-orange-500', medium: 'bg-yellow-500',
    low: 'bg-green-500', informational: 'bg-blue-400'
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-transparent p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] dark:text-gray-100 mb-2">{t('analytics.title')}</h1>
          <p className="text-[#64748B] dark:text-gray-400">{t('analytics.subtitle')}</p>
        </div>
        {canScheduleAnalytics && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Report</button>
        )}
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
          {activeTab === 'overview' && overview && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Test Pass Rate" value={`${overview.test_execution?.pass_rate ?? 0}%`}
                  sub={`${overview.test_execution?.total_runs ?? 0} runs this month`}
                  color={overview.test_execution?.pass_rate >= 70 ? 'text-green-600' : 'text-red-600'} />
                <StatCard label="Fail Rate" value={`${overview.test_execution?.fail_rate ?? 0}%`}
                  sub="Last 30 days" color="text-red-600" />
                <StatCard label="Bug Resolution Rate" value={`${overview.ticket_summary?.resolution_rate ?? 0}%`}
                  sub={`${overview.ticket_summary?.closed_this_month ?? 0} closed this month`}
                  color={overview.ticket_summary?.resolution_rate >= 70 ? 'text-green-600' : 'text-orange-600'} />
                <StatCard label="Avg Execution Time" value={`${overview.test_execution?.avg_execution_time_seconds ?? 0}s`}
                  sub="per test run" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Test Cases" value={overview.test_cases_total ?? 0} sub="across all projects" />
                <StatCard label="Automation Coverage" value={`${overview.automation_coverage ?? 0}%`} sub="automated" />
                <StatCard label="Open Tickets" value={overview.ticket_summary?.open_tickets ?? 0}
                  sub="need attention" color={overview.ticket_summary?.open_tickets > 10 ? 'text-red-600' : 'text-[#0F172A] dark:text-gray-100'} />
                <StatCard label="Total Tickets" value={overview.ticket_summary?.total_tickets ?? 0} sub="all time" />
              </div>
            </>
          )}

          {/* ── TRENDS ── */}
          {activeTab === 'trends' && (
            <>
              <div className="flex gap-2 mb-6">
                {[7, 14, 30, 60].map(d => (
                  <button key={d} onClick={() => setTrendDays(d)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${trendDays === d ? 'bg-accent-neon text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {d}d
                  </button>
                ))}
              </div>
              {trends.length === 0 ? (
                <div className="card text-center py-12 text-gray-400">No trend data yet</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-bold mb-4 text-[#0F172A] dark:text-gray-100">Test Runs (Pass/Fail)</h3>
                    <div className="space-y-2">
                      {trends.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500 w-14 text-right text-xs">{d.date}</span>
                          <div className="flex-1 flex gap-1 h-5">
                            <div className="bg-green-400 rounded-sm transition-all"
                              style={{ width: `${d.passed + d.failed > 0 ? Math.round(d.passed / (d.passed + d.failed || 1) * 100) : 0}%`, minWidth: d.passed > 0 ? 4 : 0 }} />
                            <div className="bg-red-400 rounded-sm transition-all"
                              style={{ width: `${d.passed + d.failed > 0 ? Math.round(d.failed / (d.passed + d.failed || 1) * 100) : 0}%`, minWidth: d.failed > 0 ? 4 : 0 }} />
                          </div>
                          <span className="text-xs text-gray-400 w-16">{d.passed}✓ {d.failed}✗</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Passed</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Failed</span>
                    </div>
                  </div>
                  <div className="card">
                    <h3 className="text-lg font-bold mb-4 text-[#0F172A] dark:text-gray-100">Tickets & Test Cases Created</h3>
                    <BarChart data={trends} labelKey="date" valueKey="tickets" color="bg-orange-400" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── BY PROJECT ── */}
          {activeTab === 'projects' && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-[#0F172A] dark:text-gray-100">Project Performance</h3>
              {byProject.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No projects yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/30">
                      <tr>
                        {['Project', 'Test Runs', 'Pass Rate', 'Test Cases', 'Open Tickets'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {byProject.map(p => (
                        <tr key={p.project_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="px-4 py-3 text-sm font-semibold text-[#0F172A] dark:text-gray-100">{p.project_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.total_test_runs}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-bold ${p.pass_rate >= 70 ? 'text-green-600' : p.pass_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {p.pass_rate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.test_cases}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-bold ${p.open_tickets > 0 ? 'text-red-600' : 'text-green-600'}`}>{p.open_tickets}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TICKETS ── */}
          {activeTab === 'tickets' && ticketBreakdown && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-bold mb-4 text-[#0F172A] dark:text-gray-100">By Status</h3>
                {ticketStatusItems.length === 0
                  ? <p className="text-gray-400 text-center py-8">No tickets yet</p>
                  : <BarChart data={ticketStatusItems} labelKey="label" valueKey="count" color="bg-blue-500" />}
              </div>
              <div className="card">
                <h3 className="text-lg font-bold mb-4 text-[#0F172A] dark:text-gray-100">By Severity</h3>
                {ticketSeverityItems.length === 0
                  ? <p className="text-gray-400 text-center py-8">No tickets yet</p>
                  : (
                    <div className="space-y-3">
                      {ticketSeverityItems.map((d: any) => {
                        const max = Math.max(...ticketSeverityItems.map((x: any) => x.count), 1)
                        return (
                          <div key={d.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">{d.label}</span>
                              <span className="text-gray-500">{d.count}</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                              <div className={`h-2.5 rounded-full ${severityColors[d.label] || 'bg-gray-400'} transition-all`}
                                style={{ width: `${Math.round(d.count / max * 100)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
              </div>
              {ticketBreakdown.monthly?.length > 0 && (
                <div className="card lg:col-span-2">
                  <h3 className="text-lg font-bold mb-4 text-[#0F172A] dark:text-gray-100">Monthly Created vs Resolved</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Month</th>
                        <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">Created</th>
                        <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">Resolved</th>
                        <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">Net</th>
                      </tr></thead>
                      <tbody>
                        {ticketBreakdown.monthly.map((m: any, i: number) => (
                          <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                            <td className="px-4 py-2 font-medium text-[#0F172A] dark:text-gray-100">{m.month}</td>
                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{m.created}</td>
                            <td className="px-4 py-2 text-right text-green-600">{m.resolved}</td>
                            <td className={`px-4 py-2 text-right font-semibold ${m.created - m.resolved > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {m.created - m.resolved > 0 ? '+' : ''}{m.created - m.resolved}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SPRINT VELOCITY ── */}
          {activeTab === 'sprints' && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4 text-[#0F172A] dark:text-gray-100">Sprint Velocity</h3>
              {velocity.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No sprint data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/30">
                      <tr>
                        {['Sprint', 'Capacity', 'Target Velocity', 'Completion %', 'TC Added', 'Tickets Done'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {velocity.map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="px-4 py-3 font-medium text-[#0F172A] dark:text-gray-100">{s.sprint_name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.capacity || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.target_velocity || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div className={`h-2 rounded-full ${s.completion_percentage >= 80 ? 'bg-green-500' : s.completion_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                  style={{ width: `${s.completion_percentage}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{s.completion_percentage}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.test_cases_added}</td>
                          <td className="px-4 py-3 text-green-600 font-semibold">{s.tickets_resolved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* New Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-gray-100">Generate Report</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Report Name</label>
                <input type="text" className="form-input" placeholder="Enter report name" />
              </div>
              <div>
                <label className="form-label">Report Type</label>
                <select className="form-select">
                  <option>Test Execution Summary</option>
                  <option>Bug Analysis</option>
                  <option>Performance Metrics</option>
                  <option>Team Productivity</option>
                  <option>Sprint Velocity</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Time Period</label>
                  <select className="form-select">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Format</label>
                  <select className="form-select">
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">Cancel</button>
                <button className="flex-1 btn btn-primary">Generate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics
