import { useState, useEffect, type ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

const ProjectDetails = () => {
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch project')
        }

        const data = await response.json()
        setProject(data)
      } catch (error) {
        console.error('Error fetching project:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <p className="text-gray-500">Loading project...</p>
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'test-cases', label: 'Test Cases' },
    { id: 'test-plans', label: 'Test Plans' },
    { id: 'test-runs', label: 'Test Runs' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'sprints', label: 'Sprints' },
    { id: 'documents', label: 'Documents' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'environments', label: 'Environments' },
    { id: 'automation', label: 'Automation' },
    { id: 'test-data', label: 'Test Data' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A] mb-2">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
          <span className="badge badge-success">{project.status}</span>
        </div>

        {/* Tabs Navigation */}
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
        {activeTab === 'overview' && <OverviewTab project={project} onProjectUpdated={(updatedProject: any) => setProject(updatedProject)} />}
        {activeTab === 'test-cases' && <TestCases />}
        {activeTab === 'test-plans' && <TestPlans />}
        {activeTab === 'test-runs' && <TestRuns />}
        {activeTab === 'tickets' && <Tickets />}
        {activeTab === 'sprints' && <Sprints />}
        {activeTab === 'documents' && <Documents />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'environments' && <Environments />}
        {activeTab === 'automation' && <Automation />}
        {activeTab === 'test-data' && <TestData />}
      </div>
    </div>
  )
}

const OverviewTab = ({ project, onProjectUpdated }: { project: any, onProjectUpdated: (p: any) => void }) => {
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleEditSave = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          project: {
            name: editFormData.name,
            description: editFormData.description,
            status: editFormData.status,
            repository_url: editFormData.repository_url,
            default_branch: editFormData.default_branch,
            test_timeout: editFormData.test_timeout,
            retry_failed_tests: editFormData.retry_failed_tests,
            parallel_execution: editFormData.parallel_execution,
            email_notifications: editFormData.email_notifications,
            webhook_url: editFormData.webhook_url
          }
        })
      })
      if (!response.ok) throw new Error('Failed to update project')
      // Re-fetch project to get full data
      const fetchResponse = await fetch(`http://localhost:3000/api/v1/projects/${project.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (fetchResponse.ok) {
        const updatedProject = await fetchResponse.json()
        onProjectUpdated(updatedProject)
      }
      setEditMode(false)
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return
    try {
      const response = await fetch(`http://localhost:3000/api/v1/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete project')
      navigate('/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {!editMode ? (
          <>
            <button
              className="btn btn-outline"
              onClick={() => {
                setEditFormData({
                  name: project.name || '',
                  description: project.description || '',
                  status: project.status || 'active',
                  repository_url: project.repository_url || '',
                  default_branch: project.default_branch || '',
                  test_timeout: project.test_timeout || '',
                  retry_failed_tests: project.retry_failed_tests || '',
                  parallel_execution: project.parallel_execution || '',
                  email_notifications: project.email_notifications || false,
                  webhook_url: project.webhook_url || ''
                })
                setEditMode(true)
              }}
            >
              Edit Project
            </button>
            <button
              className="btn bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete Project
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSave}>Save Changes</button>
          </>
        )}
      </div>

      {/* Project Information */}
      <div className="card">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Project Information</h3>
        {!editMode ? (
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
            }`}>
              {project.status}
            </span>
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
        ) : (
        <div className="space-y-4">
          <div>
            <label className="form-label">Project Name</label>
            <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="form-input" />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea name="description" value={editFormData.description} onChange={handleEditChange} className="form-textarea" rows={3}></textarea>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select name="status" value={editFormData.status} onChange={handleEditChange} className="form-select">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        )}
      </div>

      {/* Repository Settings */}
      <div className="card">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Repository Settings</h3>
        {!editMode ? (
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
              {project.default_branch ? (
                <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{project.default_branch}</span>
              ) : (
                <span className="text-gray-400">Not set</span>
              )}
            </p>
          </div>
        </div>
        ) : (
        <div className="space-y-4">
          <div>
            <label className="form-label">Repository URL</label>
            <input type="text" name="repository_url" value={editFormData.repository_url} onChange={handleEditChange} className="form-input" placeholder="https://github.com/..." />
          </div>
          <div>
            <label className="form-label">Default Branch</label>
            <input type="text" name="default_branch" value={editFormData.default_branch} onChange={handleEditChange} className="form-input" placeholder="main" />
          </div>
        </div>
        )}
      </div>

      {/* Test Configuration */}
      <div className="card">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Test Configuration</h3>
        {!editMode ? (
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
                }`}>
                  {project.parallel_execution}
                </span>
              ) : (
                <span className="text-gray-400">Disabled</span>
              )}
            </p>
          </div>
        </div>
        ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">Test Timeout (seconds)</label>
            <input type="number" name="test_timeout" value={editFormData.test_timeout} onChange={handleEditChange} className="form-input" placeholder="300" />
          </div>
          <div>
            <label className="form-label">Retry Failed Tests</label>
            <input type="number" name="retry_failed_tests" value={editFormData.retry_failed_tests} onChange={handleEditChange} className="form-input" placeholder="0" />
          </div>
          <div>
            <label className="form-label">Parallel Execution</label>
            <select name="parallel_execution" value={editFormData.parallel_execution} onChange={handleEditChange} className="form-select">
              <option value="">Disabled</option>
              <option value="enabled">Enabled</option>
            </select>
          </div>
        </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Notifications</h3>
        {!editMode ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Email Notifications</p>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              project.email_notifications ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {project.email_notifications ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="text-sm text-gray-500 mb-1">Webhook URL</p>
            <p className="text-[#0F172A] font-medium">
              {project.webhook_url ? (
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded break-all">{project.webhook_url}</span>
              ) : (
                <span className="text-gray-400">Not configured</span>
              )}
            </p>
          </div>
        </div>
        ) : (
        <div className="space-y-4">
          <div>
            <label className="form-label">Email Notifications</label>
            <select name="email_notifications" value={editFormData.email_notifications ? 'true' : 'false'} onChange={(e) => setEditFormData((prev: any) => ({ ...prev, email_notifications: e.target.value === 'true' }))} className="form-select">
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div>
            <label className="form-label">Webhook URL</label>
            <input type="text" name="webhook_url" value={editFormData.webhook_url} onChange={handleEditChange} className="form-input" placeholder="https://hooks.example.com/..." />
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDetails
