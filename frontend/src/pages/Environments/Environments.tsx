import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const Environments = () => {
  const { t } = useLanguage()
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [showModal, setShowModal] = useState(false)
  const [configEnv, setConfigEnv] = useState<any | null>(null)
  const [environments, setEnvironments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [healthChecking, setHealthChecking] = useState<number | null>(null)
  const [healthResults, setHealthResults] = useState<Record<number, { status: string; message: string; http_code?: number }>>({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    environmentType: 'development',
    status: 'active',
    baseUrl: '',
    healthCheckUrl: '',
    databaseConnection: '',
    environmentVariables: '',
    apiKey: '',
    secretKey: '',
    targetDevices: '',
    browserMatrix: {
      chrome: true,
      firefox: true,
      safari: false,
      edge: false
    }
  })

  const fetchEnvironments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/environments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch environments')
      }

      const data = await response.json()
      setEnvironments(data.environments || [])
    } catch (error) {
      console.error('Error fetching environments:', error)
      setEnvironments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEnvironments()
  }, [fetchEnvironments])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this environment?')) return
    try {
      const res = await fetch(`/api/v1/environments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!res.ok) throw new Error('Failed to delete environment')
      setEnvironments(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Delete failed'}`)
    }
  }

  const handleHealthCheck = async (env: any) => {
    setHealthChecking(env.id)
    try {
      const res = await fetch(`/api/v1/environments/${env.id}/health_check`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      const data = await res.json()
      setHealthResults(prev => ({ ...prev, [env.id]: data }))
      // Update status in list
      setEnvironments(prev => prev.map(e => e.id === env.id ? { ...e, status: data.status } : e))
    } catch {
      setHealthResults(prev => ({ ...prev, [env.id]: { status: 'offline', message: 'Request failed' } }))
    } finally {
      setHealthChecking(null)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      const [category, field] = name.split('.')
      if (category === 'browserMatrix') {
        setFormData(prev => ({
          ...prev,
          browserMatrix: { ...prev.browserMatrix, [field]: checkbox.checked }
        }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/v1/environments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          environment: {
            name: formData.name,
            description: formData.description,
            environment_type: formData.environmentType,
            status: formData.status,
            base_url: formData.baseUrl,
            health_check_url: formData.healthCheckUrl,
            project_id: null,
            database_connection: formData.databaseConnection,
            environment_variables: formData.environmentVariables,
            api_key: formData.apiKey,
            secret_key: formData.secretKey,
            target_devices: formData.targetDevices,
            browser_matrix: formData.browserMatrix
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors ? JSON.stringify(error.errors) : 'Failed to create environment')
      }

      alert('✅ Environment created successfully and saved to database!')
      setFormData({
        name: '',
        description: '',
        environmentType: 'development',
        status: 'active',
        baseUrl: '',
        healthCheckUrl: '',
        databaseConnection: '',
        environmentVariables: '',
        apiKey: '',
        secretKey: '',
        targetDevices: '',
        browserMatrix: {
          chrome: true,
          firefox: true,
          safari: false,
          edge: false
        }
      })
      setShowModal(false)
      fetchEnvironments()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create environment'}`)
      console.error('Error creating environment:', error)
    }
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!configEnv) return
    try {
      const response = await fetch(`/api/v1/environments/${configEnv.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          environment: {
            name:                  configEnv.name,
            description:           configEnv.description,
            environment_type:      configEnv.environment_type,
            status:                configEnv.status,
            base_url:              configEnv.base_url,
            health_check_url:      configEnv.health_check_url,
            database_connection:   configEnv.database_connection,
            environment_variables: configEnv.environment_variables,
            api_key:               configEnv.api_key,
            target_devices:        configEnv.target_devices,
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors ? JSON.stringify(error.errors) : 'Failed to update environment')
      }

      setConfigEnv(null)
      fetchEnvironments()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to update environment'}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">{t('environments.title')}</h1>
          <p className="text-[#64748B]">{t('environments.subtitle')}</p>
        </div>
        {canCreate.environments && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Environment
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && <BLoader />}

      {/* Empty State */}
      {!loading && environments.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No environments yet. Create your first environment!</p>
        </div>
      )}

      {/* Environments Grid */}
      {!loading && environments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {environments.map(env => (
            <div key={env.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">{env.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{env.base_url || 'No URL'}</p>
                  <p className="text-xs text-gray-400 mt-1">{env.environment_type || 'Unknown Type'}</p>
                </div>
                <span className={`badge ${
                env.status === 'healthy' ? 'badge-success' :
                env.status === 'active' ? 'badge-success' :
                env.status === 'degraded' ? 'badge-warning' :
                env.status === 'offline' ? 'badge-error' : 'badge-warning'
              }`}>
                {env.status || 'Unknown'}
              </span>
              </div>
              {healthResults[env.id] && (
                <div className={`text-xs mb-3 px-2 py-1 rounded ${healthResults[env.id].status === 'healthy' ? 'bg-green-50 text-green-700' : healthResults[env.id].status === 'degraded' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                  {healthResults[env.id].status === 'healthy' ? '✓' : '✗'} {healthResults[env.id].message}
                  {healthResults[env.id].http_code && ` (HTTP ${healthResults[env.id].http_code})`}
                </div>
              )}
              <div className="flex gap-3 items-center">
                {canEdit.environments && (
                  <>
                    <button className="btn btn-outline flex-1" onClick={() => setConfigEnv(env)}>Configure</button>
                    <button
                      className="btn btn-outline flex-1 disabled:opacity-50"
                      onClick={() => handleHealthCheck(env)}
                      disabled={healthChecking === env.id}
                    >
                      {healthChecking === env.id ? 'Checking...' : 'Health Check'}
                    </button>
                  </>
                )}
                {canDelete.environments && (
                  <button title="Delete" onClick={() => handleDelete(env.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Test Environment</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div>
                  <label className="form-label">Environment Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="e.g., Staging" required />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Describe this environment..." rows={2}></textarea>
                </div>

                {/* Environment Type & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Environment Type *</label>
                    <select name="environmentType" value={formData.environmentType} onChange={handleChange} className="form-select" required>
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* URLs */}
                <div>
                  <label className="form-label">Base URL *</label>
                  <input type="url" name="baseUrl" value={formData.baseUrl} onChange={handleChange} className="form-input" placeholder="https://example.com" required />
                </div>
                <div>
                  <label className="form-label">Health Check URL</label>
                  <input type="url" name="healthCheckUrl" value={formData.healthCheckUrl} onChange={handleChange} className="form-input" placeholder="https://example.com/health" />
                </div>

                {/* Database Configuration */}
                <div>
                  <label className="form-label">Database Connection String</label>
                  <input type="text" name="databaseConnection" value={formData.databaseConnection} onChange={handleChange} className="form-input" placeholder="postgresql://user:pass@host:5432/db" />
                </div>

                {/* Environment Variables */}
                <div>
                  <label className="form-label">Environment Variables</label>
                  <textarea name="environmentVariables" value={formData.environmentVariables} onChange={handleChange} className="form-textarea" placeholder="KEY=value&#10;API_KEY=abc123&#10;DATABASE_URL=..." rows={4}></textarea>
                  <p className="text-xs text-gray-500 mt-1">One per line. Values will be encrypted.</p>
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">API Key/Token</label>
                    <input type="password" name="apiKey" value={formData.apiKey} onChange={handleChange} className="form-input" placeholder="Enter API key" />
                  </div>
                  <div>
                    <label className="form-label">Secret Key</label>
                    <input type="password" name="secretKey" value={formData.secretKey} onChange={handleChange} className="form-input" placeholder="Enter secret key" />
                  </div>
                </div>

                {/* Browser Matrix */}
                <div>
                  <label className="form-label">Supported Browsers</label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="chrome" name="browserMatrix.chrome" checked={formData.browserMatrix.chrome} onChange={handleChange} className="w-4 h-4" />
                      <label htmlFor="chrome" className="text-sm text-gray-700">Chrome</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="firefox" name="browserMatrix.firefox" checked={formData.browserMatrix.firefox} onChange={handleChange} className="w-4 h-4" />
                      <label htmlFor="firefox" className="text-sm text-gray-700">Firefox</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="safari" name="browserMatrix.safari" checked={formData.browserMatrix.safari} onChange={handleChange} className="w-4 h-4" />
                      <label htmlFor="safari" className="text-sm text-gray-700">Safari</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="edge" name="browserMatrix.edge" checked={formData.browserMatrix.edge} onChange={handleChange} className="w-4 h-4" />
                      <label htmlFor="edge" className="text-sm text-gray-700">Edge</label>
                    </div>
                  </div>
                </div>

                {/* Device Matrix */}
                <div>
                  <label className="form-label">Target Devices</label>
                  <input type="text" name="targetDevices" value={formData.targetDevices} onChange={handleChange} className="form-input" placeholder="Desktop, Mobile, Tablet" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Create Environment</button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Modal */}
      {configEnv && (
        <div className="modal-backdrop" onClick={() => setConfigEnv(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Configure: {configEnv.name}</h2>
              <button onClick={() => setConfigEnv(null)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleUpdate}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Environment Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={configEnv.name || ''}
                      onChange={e => setConfigEnv((prev: any) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={configEnv.status || 'active'}
                      onChange={e => setConfigEnv((prev: any) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Environment Type</label>
                  <select
                    className="form-select"
                    value={configEnv.environment_type || 'development'}
                    onChange={e => setConfigEnv((prev: any) => ({ ...prev, environment_type: e.target.value }))}
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={configEnv.description || ''}
                    onChange={e => setConfigEnv((prev: any) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this environment..."
                  />
                </div>

                <div>
                  <label className="form-label">Base URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    value={configEnv.base_url || ''}
                    onChange={e => setConfigEnv((prev: any) => ({ ...prev, base_url: e.target.value }))}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Health Check URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={configEnv.health_check_url || ''}
                    onChange={e => setConfigEnv((prev: any) => ({ ...prev, health_check_url: e.target.value }))}
                    placeholder="https://example.com/health"
                  />
                </div>

                <div>
                  <label className="form-label">Database Connection String</label>
                  <input
                    type="text"
                    className="form-input"
                    value={configEnv.database_connection || ''}
                    onChange={e => setConfigEnv((prev: any) => ({ ...prev, database_connection: e.target.value }))}
                    placeholder="postgresql://user:pass@host:5432/db"
                  />
                </div>

                <div>
                  <label className="form-label">Environment Variables</label>
                  <textarea
                    className="form-textarea font-mono"
                    rows={4}
                    value={configEnv.environment_variables || ''}
                    onChange={e => setConfigEnv((prev: any) => ({ ...prev, environment_variables: e.target.value }))}
                    placeholder="KEY=value&#10;API_KEY=abc123"
                  />
                  <p className="text-xs text-gray-500 mt-1">One per line. Values will be encrypted.</p>
                </div>

                <div>
                  <label className="form-label">API Key / Token</label>
                  <input
                    type="password"
                    className="form-input"
                    value={configEnv.api_key || ''}
                    onChange={e => setConfigEnv((prev: any) => ({ ...prev, api_key: e.target.value }))}
                    placeholder="Enter API key"
                  />
                </div>

                <div>
                  <label className="form-label">Target Devices</label>
                  <input
                    type="text"
                    className="form-input"
                    value={configEnv.target_devices || ''}
                    onChange={e => setConfigEnv((prev: any) => ({ ...prev, target_devices: e.target.value }))}
                    placeholder="Desktop, Mobile, Tablet"
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setConfigEnv(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleUpdate}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Environments
