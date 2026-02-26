import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const Integrations = () => {
  const { t } = useLanguage()
  const { isAdminOrManager } = usePermissions()
  const [activeSection, setActiveSection] = useState<'integrations' | 'webhooks'>('integrations')
  const [showModal, setShowModal] = useState(false)
  const [integrations, setIntegrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loadingWebhooks, setLoadingWebhooks] = useState(false)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<any>(null)
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: [] as string[], active: true })
  const [testingWebhook, setTestingWebhook] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<Record<number, string>>({})

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true)
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      const res = await fetch('/api/v1/integrations', { headers })
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data.integrations || [])
      }
    } catch (err) {
      console.error('Integrations fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchWebhooks = useCallback(async () => {
    setLoadingWebhooks(true)
    const res = await fetch('/api/v1/webhooks', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
    if (res.ok) { const d = await res.json(); setWebhooks(d.webhooks || []) }
    setLoadingWebhooks(false)
  }, [])

  useEffect(() => {
    if (isAdminOrManager) { fetchIntegrations() } else { setLoading(false) }
  }, [fetchIntegrations, isAdminOrManager])

  useEffect(() => {
    if (activeSection === 'webhooks' && isAdminOrManager) fetchWebhooks()
  }, [activeSection, fetchWebhooks, isAdminOrManager])

  const handleSaveWebhook = async () => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    const method = editingWebhook ? 'PUT' : 'POST'
    const url = editingWebhook ? `/api/v1/webhooks/${editingWebhook.id}` : '/api/v1/webhooks'
    const res = await fetch(url, { method, headers, body: JSON.stringify({ webhook: webhookForm }) })
    if (res.ok) { setShowWebhookModal(false); setEditingWebhook(null); setWebhookForm({ name: '', url: '', events: [], active: true }); fetchWebhooks() }
  }

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm('Delete this webhook?')) return
    await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
    fetchWebhooks()
  }

  const handleTestWebhook = async (id: number) => {
    setTestingWebhook(id)
    const res = await fetch(`/api/v1/webhooks/${id}/test_delivery`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
    const d = await res.json()
    setTestResult(prev => ({ ...prev, [id]: d.success ? `✓ HTTP ${d.http_status}` : `✗ ${d.error || 'Failed'}` }))
    setTestingWebhook(null)
  }

  const WEBHOOK_EVENTS = ['ticket.created', 'ticket.updated', 'ticket.deleted', 'test_case.created', 'test_case.updated', 'test_run.passed', 'test_run.failed', 'sprint.started', 'sprint.completed']

  const typeIcon: Record<string, string> = {
    github: '🐙', gitlab: '🦊', bitbucket: '🪣', jira: '🔵',
    slack: '💬', jenkins: '🤖', circleci: '⚙️', travis: '🚦',
    teams: '💼', custom: '🔧',
  }

  const statusColor = (status: string) => {
    if (status === 'active')   return 'bg-green-100 text-green-800'
    if (status === 'inactive') return 'bg-gray-100 text-gray-600'
    if (status === 'error')    return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-600'
  }

  if (!isAdminOrManager) return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Integrations are available to Manager and Admin roles only.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">{t('integrations.title')}</h1>
          <p className="text-[#64748B]">{t('integrations.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { if (activeSection === 'integrations') setShowModal(true); else { setEditingWebhook(null); setWebhookForm({ name: '', url: '', events: [], active: true }); setShowWebhookModal(true) } }}>
          {activeSection === 'integrations' ? '+ Add Integration' : '+ Add Webhook'}
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveSection('integrations')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'integrations' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          🔌 Integrations
        </button>
        <button onClick={() => setActiveSection('webhooks')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'webhooks' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          🪝 Webhooks
        </button>
      </div>

      {activeSection === 'webhooks' ? (
        loadingWebhooks ? <BLoader /> :
        webhooks.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-3">🪝</div>
            <p className="text-gray-400 text-lg mb-2">No webhooks configured yet.</p>
            <p className="text-gray-400 text-sm">Webhooks notify external services when events occur in BugZera.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map(wh => (
              <div key={wh.id} className="card flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{wh.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${wh.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {wh.active ? 'Active' : 'Inactive'}
                    </span>
                    {testResult[wh.id] && (
                      <span className={`text-xs font-medium ${testResult[wh.id].startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{testResult[wh.id]}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono truncate">{wh.url}</p>
                  {wh.events && wh.events.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {wh.events.map((ev: string) => (
                        <span key={ev} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{ev}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleTestWebhook(wh.id)} disabled={testingWebhook === wh.id} className="btn btn-outline text-xs py-1 px-2 disabled:opacity-40">
                    {testingWebhook === wh.id ? 'Testing...' : 'Test'}
                  </button>
                  <button onClick={() => { setEditingWebhook(wh); setWebhookForm({ name: wh.name, url: wh.url, events: wh.events || [], active: wh.active }); setShowWebhookModal(true) }} className="btn btn-outline text-xs py-1 px-2">Edit</button>
                  <button onClick={() => handleDeleteWebhook(wh.id)} className="text-red-500 hover:text-red-700 text-xs px-2">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : loading ? (
        <BLoader />
      ) : integrations.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No integrations configured yet.</p>
          <p className="text-gray-400 text-sm">Click "+ Add Integration" to connect your first tool.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map(integration => (
            <div key={integration.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="text-5xl">{typeIcon[integration.integration_type] || '🔧'}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-[#0F172A]">{integration.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{integration.description}</p>
                  <p className="text-xs text-gray-400 mb-4 capitalize">
                    Type: {integration.integration_type?.replace(/_/g, ' ')}
                  </p>
                  <button className={`btn ${integration.status === 'active' ? 'btn-outline' : 'btn-primary'}`}>
                    {integration.status === 'active' ? 'Configure' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Webhook Create/Edit Modal */}
      {showWebhookModal && (
        <div className="modal-backdrop" onClick={() => setShowWebhookModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</h2>
              <button onClick={() => setShowWebhookModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="form-label">Name *</label>
                <input type="text" value={webhookForm.name} onChange={e => setWebhookForm(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="My Webhook" />
              </div>
              <div>
                <label className="form-label">URL *</label>
                <input type="url" value={webhookForm.url} onChange={e => setWebhookForm(p => ({ ...p, url: e.target.value }))} className="form-input" placeholder="https://example.com/webhook" />
              </div>
              <div>
                <label className="form-label">Events</label>
                <div className="space-y-1.5 mt-1 max-h-40 overflow-y-auto">
                  {WEBHOOK_EVENTS.map(ev => (
                    <label key={ev} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={webhookForm.events.includes(ev)}
                        onChange={e => setWebhookForm(p => ({ ...p, events: e.target.checked ? [...p.events, ev] : p.events.filter(x => x !== ev) }))}
                        className="w-4 h-4" />
                      <span className="text-sm text-gray-700">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={webhookForm.active} onChange={e => setWebhookForm(p => ({ ...p, active: e.target.checked }))} className="w-4 h-4" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowWebhookModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveWebhook} disabled={!webhookForm.name || !webhookForm.url}>
                {editingWebhook ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Integration</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="form-label">Integration Name *</label>
                  <input type="text" className="form-input" placeholder="My GitHub Integration" required />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" placeholder="Describe this integration..." rows={2}></textarea>
                </div>

                {/* Integration Type & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Integration Type *</label>
                    <select className="form-select" required>
                      <option value="github">GitHub</option>
                      <option value="gitlab">GitLab</option>
                      <option value="bitbucket">Bitbucket</option>
                      <option value="jira">Jira</option>
                      <option value="slack">Slack</option>
                      <option value="jenkins">Jenkins</option>
                      <option value="circleci">CircleCI</option>
                      <option value="travis">Travis CI</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select className="form-select">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>

                {/* Authentication */}
                <div>
                  <label className="form-label">Authentication Type *</label>
                  <select className="form-select" required>
                    <option value="api_key">API Key</option>
                    <option value="oauth">OAuth 2.0</option>
                    <option value="basic">Basic Auth</option>
                    <option value="token">Bearer Token</option>
                  </select>
                </div>

                {/* Credentials */}
                <div>
                  <label className="form-label">API Key / Token *</label>
                  <input type="password" className="form-input" placeholder="Enter API key or token" required />
                  <p className="text-xs text-gray-500 mt-1">Will be encrypted and stored securely</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Username (if Basic Auth)</label>
                    <input type="text" className="form-input" placeholder="Username" />
                  </div>
                  <div>
                    <label className="form-label">Password (if Basic Auth)</label>
                    <input type="password" className="form-input" placeholder="Password" />
                  </div>
                </div>

                {/* Configuration */}
                <div>
                  <label className="form-label">Base URL / API Endpoint</label>
                  <input type="url" className="form-input" placeholder="https://api.example.com" />
                </div>

                <div>
                  <label className="form-label">Webhook URL (Optional)</label>
                  <input type="url" className="form-input" placeholder="https://your-app.com/webhook" />
                  <p className="text-xs text-gray-500 mt-1">For receiving events from the integration</p>
                </div>

                <div>
                  <label className="form-label">Secret Token (for Webhook)</label>
                  <input type="password" className="form-input" placeholder="Webhook secret token" />
                </div>

                {/* Settings */}
                <div>
                  <label className="form-label">Configuration Settings (JSON)</label>
                  <textarea className="form-textarea font-mono" placeholder='{"repo": "owner/repo", "branch": "main"}' rows={4}></textarea>
                  <p className="text-xs text-gray-500 mt-1">Integration-specific configuration in JSON format</p>
                </div>

                {/* Event Types */}
                <div>
                  <label className="form-label">Event Types to Sync</label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="sync-issues" defaultChecked className="w-4 h-4" />
                      <label htmlFor="sync-issues" className="text-sm text-gray-700">Issues/Tickets</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="sync-commits" defaultChecked className="w-4 h-4" />
                      <label htmlFor="sync-commits" className="text-sm text-gray-700">Commits</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="sync-prs" className="w-4 h-4" />
                      <label htmlFor="sync-prs" className="text-sm text-gray-700">Pull Requests</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="sync-builds" className="w-4 h-4" />
                      <label htmlFor="sync-builds" className="text-sm text-gray-700">Builds/Deployments</label>
                    </div>
                  </div>
                </div>

                {/* Sync Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Auto-sync Interval (minutes)</label>
                    <input type="number" className="form-input" placeholder="15" defaultValue="15" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="enable-auto-sync" className="w-4 h-4" />
                    <label htmlFor="enable-auto-sync" className="text-sm text-gray-700">Enable Auto-sync</label>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary">Connect Integration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Integrations
