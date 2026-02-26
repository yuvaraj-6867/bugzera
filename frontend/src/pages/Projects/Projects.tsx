import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { T } from '../../components/AutoTranslate'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'


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

const Projects = () => {
  const { t } = useLanguage()
  const { canCreate } = usePermissions()
  const [showModal, setShowModal] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(defaultForm)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/projects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const openCreate = () => {
    setFormData(defaultForm)
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/v1/projects', {
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
        const error = await response.json()
        throw new Error(error.message || 'Failed to create project')
      }
      setShowModal(false)
      fetchProjects()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Request failed'}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('projects.title')}</h1>
          <p className="text-gray-600">{t('projects.subtitle')}</p>
        </div>
        {canCreate.projects && (
          <button onClick={openCreate} className="btn btn-primary">
            <span>+</span> New Project
          </button>
        )}
      </div>

      {loading && <BLoader />}

      {!loading && projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No projects yet. Create your first project to get started!</p>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer block"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-[#0F172A] pr-2"><T>{project.name}</T></h3>
                <span className={`badge flex-shrink-0 ${project.status === 'active' ? 'badge-success' : project.status === 'archived' ? 'badge-neutral' : 'badge-warning'}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-600 mb-4"><T>{project.description || 'No description'}</T></p>
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
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects
