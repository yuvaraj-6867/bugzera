import { useState } from 'react'

const Integrations = () => {
  const [showModal, setShowModal] = useState(false)

  // TODO: Fetch from backend API
  const integrations: any[] = []

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Integrations</h1>
          <p className="text-[#64748B]">Connect with third-party tools and services</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Integration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map(integration => (
          <div key={integration.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{integration.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-[#0F172A]">{integration.name}</h3>
                  <span className={`badge ${integration.status === 'Connected' ? 'badge-success' : 'badge-neutral'}`}>
                    {integration.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                <button className={`btn ${integration.status === 'Connected' ? 'btn-outline' : 'btn-primary'}`}>
                  {integration.status === 'Connected' ? 'Configure' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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

                {/* Project Assignment */}
                <div>
                  <label className="form-label">Project</label>
                  <select className="form-select">
                    <option value="">All Projects</option>
                    <option value="1">Project Alpha</option>
                    <option value="2">Project Beta</option>
                    <option value="3">Project Gamma</option>
                  </select>
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
