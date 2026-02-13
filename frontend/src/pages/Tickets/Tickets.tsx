import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent, type DragEvent } from 'react'

const statusColumns = [
  { id: 'todo', label: 'To Do', color: 'border-blue-400', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  { id: 'in_progress', label: 'In Progress', color: 'border-yellow-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  { id: 'in_review', label: 'In Review', color: 'border-purple-400', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  { id: 'qa_ready', label: 'QA Ready', color: 'border-orange-400', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  { id: 'done', label: 'Done', color: 'border-green-400', bgColor: 'bg-green-50', textColor: 'text-green-700' },
]

const Tickets = () => {
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [tickets, setTickets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [sprints, setSprints] = useState<any[]>([])
  const [environments, setEnvironments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTicket, setDraggedTicket] = useState<any>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    type: 'bug',
    priority: 'medium',
    severity: 'medium',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    environment: '',
    browserVersion: '',
    osDetails: '',
    assignedTo: '',
    dueDate: '',
    estimate: '',
    sprint: '',
    milestone: ''
  })

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/api/v1/tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }

      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }, [])

  const fetchSprints = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/sprints', {
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
    }
  }, [])

  const fetchEnvironments = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/environments', {
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
    fetchTickets()
    fetchUsers()
    fetchSprints()
    fetchEnvironments()
  }, [fetchTickets, fetchUsers, fetchSprints, fetchEnvironments])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:3000/api/v1/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ticket: {
            title: formData.title,
            description: formData.description,
            status: formData.status,
            ticket_type: formData.type,
            priority: formData.priority,
            severity: formData.severity,
            steps_to_reproduce: formData.stepsToReproduce,
            expected_result: formData.expectedResult,
            actual_result: formData.actualResult,
            environment: formData.environment || null,
            browser_version: formData.browserVersion,
            os_details: formData.osDetails,
            assigned_to: formData.assignedTo || null,
            due_date: formData.dueDate || null,
            estimate: formData.estimate ? parseFloat(formData.estimate) : null,
            sprint_id: formData.sprint || null,
            milestone: formData.milestone
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create ticket')
      }

      alert('✅ Ticket created successfully and saved to database!')
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        type: 'bug',
        priority: 'medium',
        severity: 'medium',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: '',
        environment: '',
        browserVersion: '',
        osDetails: '',
        assignedTo: '',
        dueDate: '',
        estimate: '',
        sprint: '',
        milestone: ''
      })
      setShowModal(false)
      fetchTickets()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create ticket'}`)
      console.error('Error creating ticket:', error)
    }
  }

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ ticket: { status: newStatus } })
      })
      if (!response.ok) throw new Error('Failed to update status')
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
    } catch (error) {
      console.error('Error updating ticket status:', error)
      fetchTickets()
    }
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>, ticket: any) => {
    setDraggedTicket(ticket)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    if (draggedTicket && draggedTicket.status !== columnId) {
      updateTicketStatus(draggedTicket.id, columnId)
    }
    setDraggedTicket(null)
  }

  const handleDragEnd = () => {
    setDraggedTicket(null)
    setDragOverColumn(null)
  }

  const viewTicket = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/tickets/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch ticket')
      const data = await response.json()
      setSelectedTicket(data.ticket || data)
    } catch (error) {
      console.error('Error fetching ticket:', error)
    }
  }

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleEditSave = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ticket: {
            title: editFormData.title,
            description: editFormData.description,
            status: editFormData.status,
            severity: editFormData.severity
          }
        })
      })
      if (!response.ok) throw new Error('Failed to update ticket')
      await fetchTickets()
      setEditMode(false)
      setSelectedTicket(null)
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return
    try {
      const response = await fetch(`http://localhost:3000/api/v1/tickets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete ticket')
      await fetchTickets()
      setSelectedTicket(null)
    } catch (error) {
      console.error('Error deleting ticket:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tickets</h1>
          <p className="text-gray-600">Track bugs and issues</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'board' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <span>+</span> New Ticket
          </button>
        </div>
      </div>      

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading tickets...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && tickets.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No tickets yet. Create your first ticket!</p>
        </div>
      )}

      {/* Kanban Board View */}
      {!loading && viewMode === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map(column => {
            const columnTickets = tickets.filter(t => t.status === column.id)
            return (
              <div
                key={column.id}
                className={`min-w-[280px] flex-1 rounded-lg border-t-4 ${column.color} ${
                  dragOverColumn === column.id ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-50'
                } transition-colors`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="p-3 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">{column.label}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${column.bgColor} ${column.textColor}`}>
                    {columnTickets.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {columnTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ticket)}
                      onDragEnd={handleDragEnd}
                      onClick={() => viewTicket(ticket.id)}
                      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                        draggedTicket?.id === ticket.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{ticket.title}</h4>
                      </div>
                      {ticket.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ticket.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(ticket.severity)}`}>
                          {ticket.severity}
                        </span>
                        {ticket.ticket_type && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {ticket.ticket_type}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{ticket.assigned_user || 'Unassigned'}</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {columnTickets.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400">
                      Drop tickets here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && tickets.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Tickets ({tickets.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewTicket(ticket.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                      {ticket.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">{ticket.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColumns.find(s => s.id === ticket.status)?.bgColor || 'bg-gray-100'
                      } ${statusColumns.find(s => s.id === ticket.status)?.textColor || 'text-gray-800'}`}>
                        {statusColumns.find(s => s.id === ticket.status)?.label || ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(ticket.severity)}`}>
                        {ticket.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.assigned_user || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.sprint_name || 'No Sprint'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Ticket</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div>
                  <label className="form-label">Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" placeholder="Enter ticket title" required />
                </div>
                <div>
                  <label className="form-label">Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Describe the issue..." rows={3} required></textarea>
                </div>

                {/* Classification */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="form-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="qa_ready">QA Ready</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="form-select">
                      <option value="bug">Bug</option>
                      <option value="feature">Feature</option>
                      <option value="improvement">Improvement</option>
                      <option value="task">Task</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className="form-select">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Severity</label>
                    <select name="severity" value={formData.severity} onChange={handleChange} className="form-select">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Bug Details */}
                <div>
                  <label className="form-label">Steps to Reproduce</label>
                  <textarea name="stepsToReproduce" value={formData.stepsToReproduce} onChange={handleChange} className="form-textarea" placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..." rows={3}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Expected Result</label>
                    <textarea name="expectedResult" value={formData.expectedResult} onChange={handleChange} className="form-textarea" placeholder="What should happen..." rows={2}></textarea>
                  </div>
                  <div>
                    <label className="form-label">Actual Result</label>
                    <textarea name="actualResult" value={formData.actualResult} onChange={handleChange} className="form-textarea" placeholder="What actually happens..." rows={2}></textarea>
                  </div>
                </div>

                {/* Environment Details */}
                <div className="grid grid-cols-3 gap-4">
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
                  <div>
                    <label className="form-label">Browser/Version</label>
                    <input type="text" name="browserVersion" value={formData.browserVersion} onChange={handleChange} className="form-input" placeholder="Chrome 120" />
                  </div>
                  <div>
                    <label className="form-label">OS Details</label>
                    <input type="text" name="osDetails" value={formData.osDetails} onChange={handleChange} className="form-input" placeholder="Windows 11" />
                  </div>
                </div>

                {/* Assignment & Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Assign To</label>
                    <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="form-select">
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="form-input" />
                  </div>
                </div>

                {/* Estimation */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Estimate (hours)</label>
                    <input type="number" step="0.5" name="estimate" value={formData.estimate} onChange={handleChange} className="form-input" placeholder="4.5" />
                  </div>
                  <div>
                    <label className="form-label">Sprint</label>
                    <select name="sprint" value={formData.sprint} onChange={handleChange} className="form-select">
                      <option value="">No Sprint</option>
                      {sprints.map(sprint => (
                        <option key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional */}
                <div>
                  <label className="form-label">Milestone</label>
                  <input type="text" name="milestone" value={formData.milestone} onChange={handleChange} className="form-input" placeholder="v2.0.0" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Create Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => { setSelectedTicket(null); setEditMode(false) }}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editMode ? 'Edit Ticket' : 'Ticket Details'}</h2>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <>
                    <button
                      className="btn btn-outline text-sm"
                      onClick={() => {
                        setEditMode(true)
                        setEditFormData({
                          title: selectedTicket.title || '',
                          description: selectedTicket.description || '',
                          status: selectedTicket.status || 'todo',
                          severity: selectedTicket.severity || 'medium'
                        })
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn text-sm bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleDelete(selectedTicket.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
                <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => { setSelectedTicket(null); setEditMode(false) }}>×</button>
              </div>
            </div>
            <div className="modal-body">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Title</label>
                    <input type="text" name="title" value={editFormData.title} onChange={handleEditChange} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <textarea name="description" value={editFormData.description} onChange={handleEditChange} className="form-textarea" rows={4}></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Status</label>
                      <select name="status" value={editFormData.status} onChange={handleEditChange} className="form-select">
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="qa_ready">QA Ready</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Severity</label>
                      <select name="severity" value={editFormData.severity} onChange={handleEditChange} className="form-select">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="mt-1 text-gray-900">{selectedTicket.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        statusColumns.find(s => s.id === selectedTicket.status)?.bgColor || 'bg-gray-100'
                      } ${statusColumns.find(s => s.id === selectedTicket.status)?.textColor || 'text-gray-800'}`}>
                        {statusColumns.find(s => s.id === selectedTicket.status)?.label || selectedTicket.status}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedTicket.description || 'No description'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Severity</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(selectedTicket.severity)}`}>
                        {selectedTicket.severity}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <p className="mt-1 text-gray-900">{selectedTicket.assigned_user || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sprint</label>
                    <p className="mt-1 text-gray-900">{selectedTicket.sprint_name || 'No Sprint'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <p className="mt-1 text-gray-900">{selectedTicket.created_by || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-gray-900">{selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Updated At</label>
                    <p className="mt-1 text-gray-900">{selectedTicket.updated_at ? new Date(selectedTicket.updated_at).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
            {editMode && (
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleEditSave}>Save</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Tickets
