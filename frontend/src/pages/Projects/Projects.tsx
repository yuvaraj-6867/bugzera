import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'

const Projects = () => {
  const [showModal, setShowModal] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    visibility: 'private',
    repositoryUrl: '',
    repositoryType: '',
    defaultBranch: 'main',
    testTimeout: '300',
    retryFailedTests: '0',
    parallelExecution: 'sequential',
    maxParallelJobs: '1',
    emailNotifications: true,
    slackNotifications: false,
    webhookUrl: ''
  })

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/api/v1/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

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
      const response = await fetch('http://localhost:3000/api/v1/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          project: {
            name: formData.name,
            description: formData.description,
            status: formData.status,
            visibility: formData.visibility,
            repository_url: formData.repositoryUrl,
            repository_type: formData.repositoryType,
            default_branch: formData.defaultBranch,
            test_timeout: parseInt(formData.testTimeout),
            retry_failed_tests: parseInt(formData.retryFailedTests),
            parallel_execution: formData.parallelExecution,
            max_parallel_jobs: parseInt(formData.maxParallelJobs),
            email_notifications: formData.emailNotifications,
            slack_notifications: formData.slackNotifications,
            webhook_url: formData.webhookUrl
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create project')
      }

      alert('✅ Project created successfully and saved to database!')
      setFormData({
        name: '',
        description: '',
        status: 'active',
        visibility: 'private',
        repositoryUrl: '',
        repositoryType: '',
        defaultBranch: 'main',
        testTimeout: '300',
        retryFailedTests: '0',
        parallelExecution: 'sequential',
        maxParallelJobs: '1',
        emailNotifications: true,
        slackNotifications: false,
        webhookUrl: ''
      })
      setShowModal(false)
      fetchProjects()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create project'}`)
      console.error('Error creating project:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage your testing projects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <span>+</span> New Project
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No projects yet. Create your first project to get started!</p>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-[#0F172A]">{project.name}</h3>
              <span className={`badge ${project.status === 'active' ? 'badge-success' : project.status === 'archived' ? 'badge-neutral' : 'badge-warning'}`}>
                {project.status}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{project.description || 'No description'}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Info */}
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
                    <label className="form-label">Visibility</label>
                    <select name="visibility" value={formData.visibility} onChange={handleChange} className="form-select">
                      <option value="private">Private</option>
                      <option value="team">Team</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>

                {/* Repository Config */}
                <div>
                  <label className="form-label">Repository URL</label>
                  <input type="url" name="repositoryUrl" value={formData.repositoryUrl} onChange={handleChange} className="form-input" placeholder="https://github.com/user/repo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Repository Type</label>
                    <select name="repositoryType" value={formData.repositoryType} onChange={handleChange} className="form-select">
                      <option value="">None</option>
                      <option value="github">GitHub</option>
                      <option value="gitlab">GitLab</option>
                      <option value="bitbucket">Bitbucket</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Default Branch</label>
                    <input type="text" name="defaultBranch" value={formData.defaultBranch} onChange={handleChange} className="form-input" placeholder="main" />
                  </div>
                </div>

                {/* Test Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Test Timeout (seconds)</label>
                    <input type="number" name="testTimeout" value={formData.testTimeout} onChange={handleChange} className="form-input" placeholder="300" />
                  </div>
                  <div>
                    <label className="form-label">Retry Failed Tests</label>
                    <input type="number" name="retryFailedTests" value={formData.retryFailedTests} onChange={handleChange} className="form-input" placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Parallel Execution</label>
                    <select name="parallelExecution" value={formData.parallelExecution} onChange={handleChange} className="form-select">
                      <option value="sequential">Sequential</option>
                      <option value="parallel">Parallel</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Max Parallel Jobs</label>
                    <input type="number" name="maxParallelJobs" value={formData.maxParallelJobs} onChange={handleChange} className="form-input" placeholder="1" />
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="emailNotifications" name="emailNotifications" checked={formData.emailNotifications} onChange={handleChange} className="w-4 h-4" />
                    <label htmlFor="emailNotifications" className="text-sm text-gray-700">Enable Email Notifications</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="slackNotifications" name="slackNotifications" checked={formData.slackNotifications} onChange={handleChange} className="w-4 h-4" />
                    <label htmlFor="slackNotifications" className="text-sm text-gray-700">Enable Slack Notifications</label>
                  </div>
                </div>
                <div>
                  <label className="form-label">Webhook URL</label>
                  <input type="url" name="webhookUrl" value={formData.webhookUrl} onChange={handleChange} className="form-input" placeholder="https://example.com/webhook" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Create Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects
