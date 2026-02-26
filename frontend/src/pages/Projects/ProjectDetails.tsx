import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import TestCases from '../TestCases/TestCases'
import TestPlans from '../TestPlans/TestPlans'
import TestRuns from '../TestRuns/TestRuns'
import Tickets from '../Tickets/Tickets'
import Sprints from '../Sprints/Sprints'
import Documents from '../Documents/Documents'
import Calendar from '../Calendar/Calendar'
import Environments from '../Environments/Environments'
import Automation from '../Automation/Automation'
import TestData from '../TestData/TestData'
import BLoader from '../../components/BLoader'
import { usePermissions } from '../../hooks/usePermissions'

const hdrs = () => ({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })

const defaultForm = {
  name: '',
  description: '',
  status: 'active',
  repositoryUrl: '',
  defaultBranch: 'main',
  testTimeout: '300',
  retryFailedTests: '0',
  parallelExecution: 'sequential',
  emailNotifications: true,
  webhookUrl: ''
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = '', icon }: any) => (
  <div className="card flex items-start gap-4">
    {icon && <div className="text-3xl mt-1">{icon}</div>}
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-gray-600 mb-1">{label}</h3>
      <p className={`text-3xl font-bold ${color || 'text-[#0F172A]'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  </div>
)

// ─── Overview Tab (full project dashboard) ────────────────────────────────────
const OverviewTab = ({ project, projectId }: { project: any; projectId: string }) => {
  const [data, setData] = useState({
    testCases: [] as any[],
    tickets: [] as any[],
    sprints: [] as any[],
    testRuns: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tcRes, ticketsRes, sprintsRes, runsRes] = await Promise.all([
          fetch(`/api/v1/test_cases?project_id=${projectId}`, { headers: hdrs() }),
          fetch(`/api/v1/tickets?project_id=${projectId}`, { headers: hdrs() }),
          fetch(`/api/v1/sprints?project_id=${projectId}`, { headers: hdrs() }),
          fetch(`/api/v1/test_runs?project_id=${projectId}`, { headers: hdrs() }),
        ])
        setData({
          testCases: tcRes.ok ? (await tcRes.json()).test_cases || [] : [],
          tickets:   ticketsRes.ok ? (await ticketsRes.json()).tickets || [] : [],
          sprints:   sprintsRes.ok ? (await sprintsRes.json()).sprints || [] : [],
          testRuns:  runsRes.ok ? (await runsRes.json()).test_runs || [] : [],
        })
      } catch (err) {
        console.error('Overview fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [projectId])

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800', on_hold: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800', todo: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800', in_review: 'bg-purple-100 text-purple-800',
    qa_ready: 'bg-orange-100 text-orange-800', done: 'bg-green-100 text-green-800',
  }
  const severityColor: Record<string, string> = {
    critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800', low: 'bg-blue-100 text-blue-800',
  }

  if (loading) return <div className="flex justify-center py-12"><BLoader /></div>

  const openTickets = data.tickets.filter(t => ['todo','in_progress','in_review','qa_ready'].includes(t.status))
  const closedTickets = data.tickets.filter(t => t.status === 'done')
  const resolutionRate = data.tickets.length > 0
    ? Math.round((closedTickets.length / data.tickets.length) * 100) : 0

  const passedRuns = data.testRuns.filter(r => r.status === 'passed')
  const passRate = data.testRuns.length > 0
    ? Math.round((passedRuns.length / data.testRuns.length) * 100) : 0

  const activeSprint = data.sprints.find(s => s.status === 'active') || null
  const recentRuns = [...data.testRuns]
    .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
  const recentOpenTickets = [...openTickets]
    .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">

      {/* ── Stats Row 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🧪" label="Test Cases" value={data.testCases.length}
          sub={`${data.testCases.filter(t => t.status === 'active').length} active`} />
        <StatCard icon="▶️" label="Pass Rate" value={`${passRate}%`}
          sub={`${data.testRuns.length} total runs`}
          color={passRate >= 70 ? 'text-green-600' : passRate > 0 ? 'text-red-600' : 'text-[#0F172A]'} />
        <StatCard icon="🐛" label="Open Tickets" value={openTickets.length}
          sub={`${resolutionRate}% resolved`}
          color={openTickets.length > 10 ? 'text-red-600' : 'text-[#0F172A]'} />
        <StatCard icon="🏃" label="Sprints" value={data.sprints.length}
          sub={activeSprint ? `Active: ${activeSprint.name}` : 'No active sprint'} />
      </div>

      {/* ── Middle Row: Active Sprint + Recent Test Runs + Tickets Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Sprint */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#0F172A]">🏃 Active Sprint</h3>
            <button
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('tab', 'sprints')
                window.history.pushState({}, '', url)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="text-sm text-accent-neon hover:underline"
            >Manage</button>
          </div>
          {activeSprint ? (() => {
            const start = new Date(activeSprint.start_date).getTime()
            const end = new Date(activeSprint.end_date).getTime()
            const now = Date.now()
            const pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
            const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000))
            const doneTix = data.tickets.filter(t => t.status === 'done' && t.sprint_id === activeSprint.id).length
            const totalTix = data.tickets.filter(t => t.sprint_id === activeSprint.id).length
            return (
              <div>
                <p className="font-semibold text-[#0F172A] mb-2">{activeSprint.name}</p>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{doneTix}/{totalTix} tickets done</span>
                  <span>{daysLeft}d left</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full bg-gradient-to-r from-accent-neon to-accent-electric transition-all"
                    style={{ width: `${pct}%` }} />
                </div>
                <p className="text-right text-xs text-gray-400 mt-1">{pct}% elapsed</p>
              </div>
            )
          })() : (
            <p className="text-gray-400 text-sm text-center py-4">No active sprint</p>
          )}
        </div>

        {/* Recent Test Runs */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#0F172A]">▶️ Recent Test Runs</h3>
            <button
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('tab', 'test-runs')
                window.history.pushState({}, '', url)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="text-sm text-accent-neon hover:underline"
            >View all</button>
          </div>
          {recentRuns.length > 0 ? (
            <div className="space-y-2">
              {recentRuns.map((run: any) => (
                <div key={run.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 truncate flex-1 mr-2">{run.test_case_title || run.name || `Run #${run.id}`}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                    run.status === 'passed' ? 'bg-green-100 text-green-800' :
                    run.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{run.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No test runs yet</p>
          )}
        </div>

        {/* Ticket Summary */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#0F172A]">🐛 Ticket Summary</h3>
            <button
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('tab', 'tickets')
                window.history.pushState({}, '', url)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="text-sm text-accent-neon hover:underline"
            >View all</button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'To Do',      status: 'todo',        color: 'bg-blue-500' },
              { label: 'In Progress', status: 'in_progress', color: 'bg-yellow-500' },
              { label: 'In Review',  status: 'in_review',   color: 'bg-purple-500' },
              { label: 'Done',       status: 'done',        color: 'bg-green-500' },
            ].map(({ label, status, color }) => {
              const count = data.tickets.filter(t => t.status === status).length
              const pct = data.tickets.length > 0 ? Math.round((count / data.tickets.length) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-[#0F172A]">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Open Tickets ── */}
      {recentOpenTickets.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#0F172A]">Open Tickets</h3>
            <button
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set('tab', 'tickets')
                window.history.pushState({}, '', url)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="text-sm text-accent-neon hover:underline"
            >View all</button>
          </div>
          <div className="space-y-1">
            {recentOpenTickets.map((ticket: any) => (
              <div key={ticket.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-medium text-[#0F172A] text-sm truncate">{ticket.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ticket.assigned_user || 'Unassigned'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {ticket.severity && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColor[ticket.severity] || 'bg-gray-100 text-gray-800'}`}>
                      {ticket.severity}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                    {ticket.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Project Information ── */}
      <div className="card">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Project Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Project Name</p>
            <p className="text-[#0F172A] font-medium">{project.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              project.status === 'active' ? 'bg-green-100 text-green-800' :
              project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              project.status === 'archived' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>{project.status}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Created Date</p>
            <p className="text-[#0F172A] font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
          </div>
          <div className="col-span-2 md:col-span-3">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-[#0F172A] font-medium">{project.description || 'No description'}</p>
          </div>
        </div>
      </div>

      {/* ── Repository Settings ── */}
      <div className="card">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Repository Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <p className="text-sm text-gray-500 mb-1">Repository URL</p>
            <p className="text-[#0F172A] font-medium">
              {project.repository_url ? (
                <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {project.repository_url}
                </a>
              ) : (
                <span className="text-gray-400">Not configured</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Default Branch</p>
            <p className="text-[#0F172A] font-medium">
              {project.default_branch
                ? <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{project.default_branch}</span>
                : <span className="text-gray-400">Not set</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ── Test Configuration ── */}
      <div className="card">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Test Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Test Timeout</p>
            <p className="text-[#0F172A] font-medium">
              {project.test_timeout ? `${project.test_timeout} seconds` : <span className="text-gray-400">Default</span>}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Retry Failed Tests</p>
            <p className="text-[#0F172A] font-medium">
              {project.retry_failed_tests ? `${project.retry_failed_tests} times` : <span className="text-gray-400">No retry</span>}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Parallel Execution</p>
            <p className="text-[#0F172A] font-medium">
              {project.parallel_execution ? (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  project.parallel_execution === 'enabled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>{project.parallel_execution}</span>
              ) : (
                <span className="text-gray-400">Disabled</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="card">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Notifications</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Email Notifications</p>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              project.email_notifications ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>{project.email_notifications ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="text-sm text-gray-500 mb-1">Webhook URL</p>
            <p className="text-[#0F172A] font-medium">
              {project.webhook_url
                ? <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded break-all">{project.webhook_url}</span>
                : <span className="text-gray-400">Not configured</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Project Details Page ─────────────────────────────────────────────────────
const ProjectDetails = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const setActiveTab = (tab: string) => setSearchParams({ tab })
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { canEdit, canDelete } = usePermissions()

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState(defaultForm)

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/projects/${projectId}`, { headers: hdrs() })
      if (!response.ok) throw new Error('Failed to fetch project')
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchProject() }, [fetchProject])

  const openEdit = () => {
    setFormData({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'active',
      repositoryUrl: project.repository_url || '',
      defaultBranch: project.default_branch || 'main',
      testTimeout: String(project.test_timeout || 300),
      retryFailedTests: String(project.retry_failed_tests || 0),
      parallelExecution: project.parallel_execution || 'sequential',
      emailNotifications: project.email_notifications ?? true,
      webhookUrl: project.webhook_url || ''
    })
    setShowModal(true)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...hdrs() },
        body: JSON.stringify({
          project: {
            name: formData.name,
            description: formData.description,
            status: formData.status,
            repository_url: formData.repositoryUrl,
            default_branch: formData.defaultBranch,
            test_timeout: parseInt(formData.testTimeout),
            retry_failed_tests: parseInt(formData.retryFailedTests),
            parallel_execution: formData.parallelExecution,
            email_notifications: formData.emailNotifications,
            webhook_url: formData.webhookUrl
          }
        })
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to update project')
      }
      setShowModal(false)
      fetchProject()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Request failed'}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'DELETE', headers: hdrs()
      })
      if (!response.ok) throw new Error('Failed to delete project')
      navigate('/projects')
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to delete project'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <BLoader />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <p className="text-gray-500">Project not found</p>
      </div>
    )
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = user.role || 'member'

  const allTabs = [
    { id: 'overview',     label: 'Overview' },
    { id: 'test-cases',   label: 'Test Cases' },
    { id: 'test-plans',   label: 'Test Plans' },
    { id: 'test-runs',    label: 'Test Runs' },
    { id: 'tickets',      label: 'Tickets' },
    { id: 'sprints',      label: 'Sprints' },
    { id: 'documents',    label: 'Documents' },
    { id: 'calendar',     label: 'Calendar' },
    { id: 'environments', label: 'Environments', roles: ['manager', 'admin'] },
    { id: 'automation',   label: 'Automation',   roles: ['admin'] },
    { id: 'test-data',    label: 'Test Data',    roles: ['manager', 'admin'] },
  ]

  const tabs = allTabs.filter(tab => !tab.roles || tab.roles.includes(userRole))

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Link to="/projects" className="hover:text-accent-neon transition-colors">Projects</Link>
              <span>/</span>
              <span className="text-gray-600">{project.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-[#0F172A] mb-1">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              project.status === 'active' ? 'bg-green-100 text-green-800' :
              project.status === 'archived' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>{project.status}</span>
            {canEdit.projects && (
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300 bg-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            {canDelete.projects && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 bg-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-accent-neon text-accent-neon font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === 'overview'     && <OverviewTab project={project} projectId={projectId!} />}
        {activeTab === 'test-cases'   && <TestCases projectId={projectId} />}
        {activeTab === 'test-plans'   && <TestPlans />}
        {activeTab === 'test-runs'    && <TestRuns />}
        {activeTab === 'tickets'      && <Tickets projectId={projectId} />}
        {activeTab === 'sprints'      && <Sprints projectId={projectId} />}
        {activeTab === 'documents'    && <Documents />}
        {activeTab === 'calendar'     && <Calendar />}
        {activeTab === 'environments' && <Environments />}
        {activeTab === 'automation'   && <Automation />}
        {activeTab === 'test-data'    && <TestData />}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Project</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="form-label">Project Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Enter project name" required />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Describe your project..." rows={3}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Status *</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select" required>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Default Branch</label>
                    <input type="text" name="defaultBranch" value={formData.defaultBranch} onChange={handleChange} className="form-input" placeholder="main" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Repository URL</label>
                  <input type="url" name="repositoryUrl" value={formData.repositoryUrl} onChange={handleChange} className="form-input" placeholder="https://github.com/user/repo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Test Timeout (seconds)</label>
                    <input type="number" name="testTimeout" value={formData.testTimeout} onChange={handleChange} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Retry Failed Tests</label>
                    <input type="number" name="retryFailedTests" value={formData.retryFailedTests} onChange={handleChange} className="form-input" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Parallel Execution</label>
                  <select name="parallelExecution" value={formData.parallelExecution} onChange={handleChange} className="form-select">
                    <option value="sequential">Sequential</option>
                    <option value="parallel">Parallel</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="emailNotifications" name="emailNotifications" checked={formData.emailNotifications} onChange={handleChange} className="w-4 h-4" />
                  <label htmlFor="emailNotifications" className="text-sm text-gray-700">Enable Email Notifications</label>
                </div>
                <div>
                  <label className="form-label">Webhook URL</label>
                  <input type="url" name="webhookUrl" value={formData.webhookUrl} onChange={handleChange} className="form-input" placeholder="https://example.com/webhook" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetails
