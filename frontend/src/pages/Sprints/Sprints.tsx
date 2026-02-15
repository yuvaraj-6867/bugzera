import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'

const Sprints = ({ projectId }: { projectId?: string }) => {
  const [showModal, setShowModal] = useState(false)
  const [sprints, setSprints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSprint, setSelectedSprint] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'active',
    sprintGoal: '',
    team: '',
    capacity: '',
    targetVelocity: '',
    completionPercentage: '0',
    retrospectiveNotes: '',
    trackBurndown: true,
    tags: ''
  })

  const fetchSprints = useCallback(async () => {
    try {
      setLoading(true)
      const url = projectId
        ? `http://localhost:3000/api/v1/sprints?project_id=${projectId}`
        : 'http://localhost:3000/api/v1/sprints'
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sprints')
      }

      const data = await response.json()
      setSprints(data.sprints || [])
    } catch (error) {
      console.error('Error fetching sprints:', error)
      setSprints([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchSprints()
  }, [fetchSprints])

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
      const response = await fetch('http://localhost:3000/api/v1/sprints', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          sprint: {
            name: formData.name,
            description: formData.description,
            start_date: formData.startDate,
            end_date: formData.endDate,
            status: formData.status,
            sprint_goal: formData.sprintGoal,
            project_id: projectId || null,
            team: formData.team,
            capacity: formData.capacity ? parseInt(formData.capacity) : null,
            target_velocity: formData.targetVelocity ? parseFloat(formData.targetVelocity) : null,
            completion_percentage: parseInt(formData.completionPercentage),
            retrospective_notes: formData.retrospectiveNotes,
            track_burndown: formData.trackBurndown,
            tags: formData.tags
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create sprint')
      }

      alert('✅ Sprint created successfully and saved to database!')
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'active',
        sprintGoal: '',
        team: '',
        capacity: '',
        targetVelocity: '',
        completionPercentage: '0',
        retrospectiveNotes: '',
        trackBurndown: true,
        tags: ''
      })
      setShowModal(false)
      fetchSprints()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create sprint'}`)
      console.error('Error creating sprint:', error)
    }
  }

  const viewSprint = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/sprints/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch sprint')
      }
      const data = await response.json()
      setSelectedSprint(data)
    } catch (error) {
      console.error('Error fetching sprint:', error)
    }
  }

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleEditSave = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/sprints/${selectedSprint.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          sprint: {
            name: editFormData.name,
            description: editFormData.description,
            start_date: editFormData.start_date,
            end_date: editFormData.end_date,
            status: editFormData.status
          }
        })
      })
      if (!response.ok) {
        throw new Error('Failed to update sprint')
      }
      fetchSprints()
      setEditMode(false)
      setSelectedSprint(null)
    } catch (error) {
      console.error('Error updating sprint:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to update sprint'}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sprint?')) return
    try {
      const response = await fetch(`http://localhost:3000/api/v1/sprints/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to delete sprint')
      }
      fetchSprints()
      setSelectedSprint(null)
    } catch (error) {
      console.error('Error deleting sprint:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete sprint'}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Sprints</h1>
          <p className="text-[#64748B]">Manage sprint planning and execution</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Sprint
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading sprints...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && sprints.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No sprints yet. Create your first sprint!</p>
        </div>
      )}

      {/* Current Active Sprint */}
      {!loading && sprints.filter(s => s.status === 'active').map(sprint => {
        const totalTickets = sprint.total_tickets || 0
        const doneCount = sprint.done_count || 0
        const progressPct = totalTickets > 0 ? Math.round((doneCount / totalTickets) * 100) : 0
        const daysLeft = sprint.end_date ? Math.max(0, Math.ceil((new Date(sprint.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0

        return (
          <div key={sprint.id} className="card mb-8 border-2 border-accent-neon">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="badge badge-success mb-2">Current Sprint</span>
                <h2 className="text-2xl font-bold text-[#0F172A]">{sprint.name}</h2>
                <p className="text-gray-600 mt-1">
                  {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                  <span className="ml-3 text-sm font-medium text-orange-600">({daysLeft} days left)</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-accent-neon">{progressPct}%</p>
                <p className="text-sm text-gray-500">Complete</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-accent-neon to-accent-electric h-3 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>

            {/* Ticket Status Counts */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-[#0F172A]">{totalTickets}</p>
                <p className="text-xs text-gray-500 mt-1">Total Tickets</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{sprint.todo_count || 0}</p>
                <p className="text-xs text-gray-500 mt-1">To Do</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">{sprint.in_progress_count || 0}</p>
                <p className="text-xs text-gray-500 mt-1">In Progress</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{sprint.in_review_count || 0}</p>
                <p className="text-xs text-gray-500 mt-1">In Review</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-700">{sprint.qa_ready_count || 0}</p>
                <p className="text-xs text-gray-500 mt-1">QA Ready</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{doneCount}</p>
                <p className="text-xs text-gray-500 mt-1">Done</p>
              </div>
            </div>
          </div>
        )
      })}

      {/* All Sprints */}
      {!loading && sprints.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">All Sprints ({sprints.length})</h3>
          <div className="space-y-4">
            {sprints.map(sprint => (
              <div key={sprint.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => viewSprint(sprint.id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-semibold text-[#0F172A]">{sprint.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                    </p>
                    {sprint.sprint_goal && (
                      <p className="text-sm text-gray-500 mt-1">{sprint.sprint_goal}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${
                      sprint.status === 'active' ? 'badge-success' :
                      sprint.status === 'completed' ? 'badge-info' :
                      sprint.status === 'cancelled' ? 'badge-error' :
                      'badge-neutral'
                    }`}>
                      {sprint.status}
                    </span>
                    <span className="text-sm text-gray-500">{sprint.completion_percentage || 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Sprint</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div>
                  <label className="form-label">Sprint Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="e.g., Sprint 25" required />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Brief description of this sprint..." rows={2}></textarea>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Start Date *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">End Date *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="form-input" required />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Sprint Goal */}
                <div>
                  <label className="form-label">Sprint Goal *</label>
                  <textarea name="sprintGoal" value={formData.sprintGoal} onChange={handleChange} className="form-textarea" placeholder="What do you want to achieve in this sprint?" rows={3} required></textarea>
                </div>

                {/* Team */}
                <div>
                  <label className="form-label">Team</label>
                  <select name="team" value={formData.team} onChange={handleChange} className="form-select">
                    <option value="">Select team</option>
                    <option value="1">QA Team</option>
                    <option value="2">Development Team</option>
                    <option value="3">Full Stack Team</option>
                  </select>
                </div>

                {/* Capacity & Velocity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Capacity (Story Points)</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="form-input" placeholder="40" />
                    <p className="text-xs text-gray-500 mt-1">Total story points for this sprint</p>
                  </div>
                  <div>
                    <label className="form-label">Target Velocity</label>
                    <input type="number" step="0.1" name="targetVelocity" value={formData.targetVelocity} onChange={handleChange} className="form-input" placeholder="35.5" />
                    <p className="text-xs text-gray-500 mt-1">Expected velocity based on history</p>
                  </div>
                </div>

                {/* Completion Percentage (for active/completed sprints) */}
                <div>
                  <label className="form-label">Initial Completion % (Optional)</label>
                  <input type="number" min="0" max="100" name="completionPercentage" value={formData.completionPercentage} onChange={handleChange} className="form-input" placeholder="0" />
                  <p className="text-xs text-gray-500 mt-1">Leave at 0 for new sprints</p>
                </div>

                {/* Retrospective Notes (for completed sprints) */}
                <div>
                  <label className="form-label">Retrospective Notes (Optional)</label>
                  <textarea name="retrospectiveNotes" value={formData.retrospectiveNotes} onChange={handleChange} className="form-textarea" placeholder="What went well, what could be improved..." rows={3}></textarea>
                  <p className="text-xs text-gray-500 mt-1">Add notes after sprint completion</p>
                </div>

                {/* Burndown Configuration */}
                <div>
                  <label className="form-label">Track Burndown</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input type="checkbox" id="trackBurndown" name="trackBurndown" checked={formData.trackBurndown} onChange={handleChange} className="w-4 h-4" />
                    <label htmlFor="trackBurndown" className="text-sm text-gray-700">Enable daily burndown tracking</label>
                  </div>
                </div>

                {/* Sprint Tags */}
                <div>
                  <label className="form-label">Tags</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="release, critical, feature-freeze" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Create Sprint</button>
            </div>
          </div>
        </div>
      )}

      {selectedSprint && (
        <div className="modal-backdrop" onClick={() => { setSelectedSprint(null); setEditMode(false) }}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedSprint.name}</h2>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditMode(true)
                    setEditFormData({
                      name: selectedSprint.name,
                      description: selectedSprint.description,
                      start_date: selectedSprint.start_date,
                      end_date: selectedSprint.end_date,
                      status: selectedSprint.status
                    })
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn bg-red-600 text-white hover:bg-red-700"
                  onClick={() => handleDelete(selectedSprint.id)}
                >
                  Delete
                </button>
                <button onClick={() => { setSelectedSprint(null); setEditMode(false) }} className="text-2xl">&times;</button>
              </div>
            </div>
            <div className="modal-body">
              {!editMode ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Name</label>
                    <p className="text-[#0F172A]">{selectedSprint.name}</p>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <p>
                      <span className={`badge ${
                        selectedSprint.status === 'active' ? 'badge-success' :
                        selectedSprint.status === 'completed' ? 'badge-info' :
                        selectedSprint.status === 'cancelled' ? 'badge-error' :
                        'badge-neutral'
                      }`}>
                        {selectedSprint.status}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Description</label>
                    <p className="text-[#0F172A]">{selectedSprint.description || 'No description'}</p>
                  </div>
                  <div>
                    <label className="form-label">Start Date</label>
                    <p className="text-[#0F172A]">{selectedSprint.start_date ? new Date(selectedSprint.start_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <label className="form-label">End Date</label>
                    <p className="text-[#0F172A]">{selectedSprint.end_date ? new Date(selectedSprint.end_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Ticket Counts</label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-2">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-[#0F172A]">{selectedSprint.total_tickets || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Total</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{selectedSprint.todo_count || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">To Do</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-700">{selectedSprint.in_progress_count || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">In Progress</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-700">{selectedSprint.in_review_count || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">In Review</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-700">{selectedSprint.qa_ready_count || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">QA Ready</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{selectedSprint.done_count || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Done</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="space-y-4">
                  <div>
                    <label className="form-label">Name *</label>
                    <input type="text" name="name" value={editFormData.name || ''} onChange={handleEditChange} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <textarea name="description" value={editFormData.description || ''} onChange={handleEditChange} className="form-textarea" rows={3}></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Start Date *</label>
                      <input type="date" name="start_date" value={editFormData.start_date || ''} onChange={handleEditChange} className="form-input" required />
                    </div>
                    <div>
                      <label className="form-label">End Date *</label>
                      <input type="date" name="end_date" value={editFormData.end_date || ''} onChange={handleEditChange} className="form-input" required />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Status *</label>
                    <select name="status" value={editFormData.status || 'planned'} onChange={handleEditChange} className="form-select" required>
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </form>
              )}
            </div>
            {editMode && (
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleEditSave}>Save</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Sprints
