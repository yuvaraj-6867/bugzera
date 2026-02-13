import { useState } from 'react'

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'integrations' | 'security' | 'audit'>('general')

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Settings</h1>
        <p className="text-[#64748B]">Configure your BugZera workspace</p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-accent-neon text-accent-neon font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-accent-neon text-accent-neon font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'integrations'
                  ? 'border-accent-neon text-accent-neon font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-accent-neon text-accent-neon font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'audit'
                  ? 'border-accent-neon text-accent-neon font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Audit Logs
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'audit' && <AuditLogs />}
        </div>
      </div>
    </div>
  )
}

// General Settings Tab
const GeneralSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">General Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="form-label">Workspace Name</label>
            <input type="text" className="form-input" placeholder="Enter workspace name" />
          </div>

          <div>
            <label className="form-label">Time Zone</label>
            <select className="form-select">
              <option>UTC</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
              <option>Asia/Tokyo</option>
            </select>
          </div>

          <div>
            <label className="form-label">Date Format</label>
            <select className="form-select">
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="form-label">Language</label>
            <select className="form-select">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  )
}

// Notification Settings Tab
const NotificationSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Notification Preferences</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-[#0F172A]">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email updates for important events</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-[#0F172A]">Test Run Notifications</p>
              <p className="text-sm text-gray-500">Get notified when test runs complete</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-[#0F172A]">Ticket Assignments</p>
              <p className="text-sm text-gray-500">Notifications for new ticket assignments</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-[#0F172A]">Comment Mentions</p>
              <p className="text-sm text-gray-500">Get notified when someone mentions you</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>
        </div>

        <div className="mt-6">
          <button className="btn btn-primary">Save Preferences</button>
        </div>
      </div>
    </div>
  )
}

// Integration Settings Tab
const IntegrationSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Integration Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="form-label">API Key</label>
            <input type="text" className="form-input" placeholder="Your API key" />
          </div>

          <div>
            <label className="form-label">Webhook URL</label>
            <input type="url" className="form-input" placeholder="https://example.com/webhook" />
          </div>

          <div>
            <label className="form-label">CI/CD Integration</label>
            <select className="form-select">
              <option>None</option>
              <option>Jenkins</option>
              <option>GitHub Actions</option>
              <option>GitLab CI</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button className="btn btn-primary">Update Integrations</button>
        </div>
      </div>
    </div>
  )
}

// Security Settings Tab
const SecuritySettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Security Settings</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-[#0F172A]">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <button className="btn btn-outline">Enable</button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-[#0F172A]">Session Timeout</p>
              <p className="text-sm text-gray-500">Auto logout after inactivity</p>
            </div>
            <select className="form-select w-48">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>Never</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-[#0F172A]">IP Whitelist</p>
              <p className="text-sm text-gray-500">Restrict access to specific IPs</p>
            </div>
            <button className="btn btn-outline">Configure</button>
          </div>
        </div>

        <div className="mt-6">
          <button className="btn btn-primary">Save Security Settings</button>
        </div>
      </div>
    </div>
  )
}

// Audit Logs Tab
const AuditLogs = () => {
  const logs = [
    { id: 1, user: 'John Doe', action: 'Updated Project Settings', ip: '192.168.1.1', timestamp: '2026-02-12 10:30 AM' },
    { id: 2, user: 'Jane Smith', action: 'Created New Test Case', ip: '192.168.1.2', timestamp: '2026-02-12 09:15 AM' },
    { id: 3, user: 'Bob Wilson', action: 'Deleted Ticket #123', ip: '192.168.1.3', timestamp: '2026-02-11 04:45 PM' },
  ]

  return (
    <div>
      <h3 className="text-xl font-bold text-[#0F172A] mb-4">Audit Logs</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">IP Address</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-[#0F172A]">{log.user}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.action}</td>
                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{log.ip}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Settings
