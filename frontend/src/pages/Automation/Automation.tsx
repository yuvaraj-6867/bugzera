import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'

import { toast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirm'

const LANG_LABELS: Record<string, string> = {
  javascript: 'JS', python: 'Python', ruby: 'Ruby', java: 'Java'
}
const LANG_COLORS: Record<string, string> = {
  javascript: 'bg-yellow-100 text-yellow-800',
  python: 'bg-blue-100 text-blue-800',
  ruby: 'bg-red-100 text-red-800',
  java: 'bg-orange-100 text-orange-800'
}

const Automation = () => {
  const { t } = useLanguage()
  const { canDelete } = usePermissions()
  const [showModal, setShowModal] = useState(false)
  const [viewScript, setViewScript] = useState<any>(null)
  const [workflows, setWorkflows] = useState<any[]>([])
  const [testCases, setTestCases] = useState<any[]>([])
  const [environments, setEnvironments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    workflowName: '',
    description: '',
    scriptType: 'selenium',
    language: 'javascript',
    scriptContent: '',
    testCase: '',
    environment: '',
    schedule: '',
    timeout: '300',
    retryCount: '0',
    status: 'draft',
    parallelExecution: false,
    template: '',
    notifyFailure: true,
    notifySuccess: false
  })

  const fetchAutomationScripts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/automation_scripts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch automation scripts')
      }

      const data = await response.json()
      setWorkflows(data.automation_scripts || [])
    } catch (error) {
      console.error('Error fetching automation scripts:', error)
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTestCases = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/test_cases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch test cases')
      }

      const data = await response.json()
      setTestCases(data.test_cases || [])
    } catch (error) {
      console.error('Error fetching test cases:', error)
      setTestCases([])
    }
  }, [])

  const fetchEnvironments = useCallback(async () => {
    try {
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
    }
  }, [])

  useEffect(() => {
    fetchAutomationScripts()
    fetchTestCases()
    fetchEnvironments()
  }, [fetchAutomationScripts, fetchTestCases, fetchEnvironments])

  const handleDelete = async (id: number) => {
    if (!await confirmDialog('Delete this automation workflow?', 'Delete Workflow')) return
    try {
      const res = await fetch(`/api/v1/automation_scripts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!res.ok) throw new Error('Failed to delete workflow')
      setWorkflows(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/v1/automation_scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          automation_script: {
            name: formData.workflowName,
            description: formData.description,
            script_type: formData.scriptType,
            language: formData.language,
            framework: formData.scriptType,
            script_content: formData.scriptContent,
            script_path: formData.scriptContent ? null : '/scripts/default.js',
            test_case_id: formData.testCase || null,
            status: formData.status
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors ? JSON.stringify(error.errors) : 'Failed to create automation script')
      }

      toast.success('Automation workflow created successfully and saved to database!')
      setFormData({
        workflowName: '',
        description: '',
        scriptType: 'selenium',
        language: 'javascript',
        scriptContent: '',
        testCase: '',
        environment: '',
        schedule: '',
        timeout: '300',
        retryCount: '0',
        status: 'draft',
        parallelExecution: false,
        template: '',
        notifyFailure: true,
        notifySuccess: false
      })
      setShowModal(false)
      fetchAutomationScripts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create automation script')
      console.error('Error creating automation script:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">{t('automation.title')}</h1>
          <p className="text-[#64748B]">{t('automation.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Workflow
        </button>
      </div>

      {/* Loading State */}
      {loading && null}

      {/* Empty State */}
      {!loading && workflows.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No automation workflows yet. Create your first workflow!</p>
        </div>
      )}

      {/* Workflows Table */}
      {!loading && workflows.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-xl font-bold mb-4">Automation Workflows</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Workflow Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Language</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Test Case</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Created By</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workflows.map(workflow => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{workflow.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{workflow.script_type || workflow.framework || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${LANG_COLORS[workflow.language] || 'bg-gray-100 text-gray-700'}`}>
                        {LANG_LABELS[workflow.language] || workflow.language || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${workflow.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                        {workflow.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{workflow.test_case || 'No Test Case'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{workflow.created_by || 'Unknown'}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-1">
                      {workflow.script_content && (
                        <button title="View Script" onClick={() => setViewScript(workflow)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        </button>
                      )}
                      {canDelete.automation && (
                        <button title="Delete" onClick={() => handleDelete(workflow.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Script Modal */}
      {viewScript && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewScript(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{viewScript.name}</h2>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{viewScript.script_type || viewScript.framework}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${LANG_COLORS[viewScript.language] || 'bg-gray-100 text-gray-700'}`}>{viewScript.language}</span>
                  {viewScript.test_case && viewScript.test_case !== 'No Test Case' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">Test: {viewScript.test_case}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setViewScript(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="bg-gray-950 text-green-400 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto min-h-[200px]">{viewScript.script_content || '// No script content'}</pre>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Automation Workflow</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div>
                  <label className="form-label">Workflow Name *</label>
                  <input type="text" name="workflowName" value={formData.workflowName} onChange={handleChange} className="form-input" placeholder="Enter workflow name" required />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Describe the automation workflow..." rows={2}></textarea>
                </div>

                {/* Script Type & Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Script Type *</label>
                    <select name="scriptType" value={formData.scriptType} onChange={handleChange} className="form-select" required>
                      <option value="selenium">Selenium</option>
                      <option value="playwright">Playwright</option>
                      <option value="cypress">Cypress</option>
                      <option value="api">API Testing</option>
                      <option value="custom">Custom Script</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Language</label>
                    <select name="language" value={formData.language} onChange={handleChange} className="form-select">
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="ruby">Ruby</option>
                      <option value="java">Java</option>
                    </select>
                  </div>
                </div>

                {/* Script Content */}
                <div>
                  <label className="form-label">Script Content</label>
                  <textarea name="scriptContent" value={formData.scriptContent} onChange={handleChange} className="form-textarea font-mono" placeholder="// Enter your automation script here..." rows={6}></textarea>
                </div>

                {/* Test Case & Environment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Test Case</label>
                    <select name="testCase" value={formData.testCase} onChange={handleChange} className="form-select">
                      <option value="">Link to test case</option>
                      {testCases.map(testCase => (
                        <option key={testCase.id} value={testCase.id}>
                          {testCase.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Environment</label>
                    <select name="environment" value={formData.environment} onChange={handleChange} className="form-select">
                      <option value="">Select environment</option>
                      {environments.map(env => (
                        <option key={env.id} value={env.id}>
                          {env.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Execution Schedule */}
                <div>
                  <label className="form-label">Schedule (Cron Expression)</label>
                  <input type="text" name="schedule" value={formData.schedule} onChange={handleChange} className="form-input" placeholder="0 0 * * * (Daily at midnight)" />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for manual execution only</p>
                </div>

                {/* Execution Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Timeout (seconds)</label>
                    <input type="number" name="timeout" value={formData.timeout} onChange={handleChange} className="form-input" placeholder="300" />
                  </div>
                  <div>
                    <label className="form-label">Retry Count</label>
                    <input type="number" name="retryCount" value={formData.retryCount} onChange={handleChange} className="form-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Parallel Execution */}
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="parallelExecution" name="parallelExecution" checked={formData.parallelExecution} onChange={handleChange} className="w-4 h-4" />
                  <label htmlFor="parallelExecution" className="text-sm text-gray-700">Enable Parallel Execution</label>
                </div>

                {/* Template */}
                <div>
                  <label className="form-label">Use Template (Optional)</label>
                  <select name="template" value={formData.template} onChange={handleChange} className="form-select">
                    <option value="">No template</option>
                    <option value="1">Login Automation Template</option>
                    <option value="2">Form Submission Template</option>
                    <option value="3">API Testing Template</option>
                  </select>
                </div>

                {/* Notification Settings */}
                <div>
                  <label className="form-label">Notify On</label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="notifyFailure" name="notifyFailure" checked={formData.notifyFailure} onChange={handleChange} className="w-4 h-4" />
                      <label htmlFor="notifyFailure" className="text-sm text-gray-700">Failure</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="notifySuccess" name="notifySuccess" checked={formData.notifySuccess} onChange={handleChange} className="w-4 h-4" />
                      <label htmlFor="notifySuccess" className="text-sm text-gray-700">Success</label>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Create Workflow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Automation
