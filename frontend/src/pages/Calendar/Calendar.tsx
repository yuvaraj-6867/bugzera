import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'

const Calendar = () => {
  const [showModal, setShowModal] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'standup',
    startTime: '',
    location: '',
    allDay: false,
    status: 'scheduled'
  })

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/api/v1/calendar_events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events')
      }

      const data = await response.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

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
      const response = await fetch('http://localhost:3000/api/v1/calendar_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          calendar_event: {
            title: formData.title,
            description: formData.description,
            event_type: formData.eventType,
            start_time: formData.startTime,
            location: formData.location,
            all_day: formData.allDay,
            status: formData.status
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors ? JSON.stringify(error.errors) : 'Failed to create event')
      }

      alert('✅ Event created successfully!')
      setFormData({
        title: '',
        description: '',
        eventType: 'standup',
        startTime: '',
        location: '',
        allDay: false,
        status: 'scheduled'
      })
      setShowModal(false)
      fetchEvents()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create event'}`)
      console.error('Error creating event:', error)
    }
  }

  const getEventTypeColor = (eventType: string) => {
    const colors: { [key: string]: string } = {
      'test_cycle': 'bg-purple-100 text-purple-800',
      'bug_triage': 'bg-red-100 text-red-800',
      'release_review': 'bg-blue-100 text-blue-800',
      'standup': 'bg-green-100 text-green-800',
      'deadline': 'bg-orange-100 text-orange-800',
      'retesting': 'bg-yellow-100 text-yellow-800',
      'leave': 'bg-gray-100 text-gray-800',
      'work_from_home': 'bg-indigo-100 text-indigo-800'
    }
    return colors[eventType] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const upcomingEvents = events.filter(event => new Date(event.start_time) > new Date())
  const pastEvents = events.filter(event => new Date(event.start_time) <= new Date())

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Calendar</h1>
          <p className="text-gray-600">Schedule and manage events</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <span>+</span> New Event
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading events...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No events scheduled. Create your first event!</p>
        </div>
      )}

      {/* Events Display */}
      {!loading && events.length > 0 && (
        <div className="space-y-6">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Upcoming Events ({upcomingEvents.length})</h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-base font-semibold text-gray-900">{event.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.event_type)}`}>
                            {event.event_type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 {new Date(event.start_time).toLocaleString()}</span>
                          {event.location && <span>📍 {event.location}</span>}
                          {event.created_by && <span>👤 {event.created_by.name}</span>}
                          {event.all_day && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">All Day</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Past Events ({pastEvents.length})</h3>
              <div className="space-y-3">
                {pastEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg bg-gray-50 opacity-75">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-base font-semibold text-gray-700">{event.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.event_type)}`}>
                            {event.event_type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 {new Date(event.start_time).toLocaleString()}</span>
                          {event.location && <span>📍 {event.location}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Calendar Event</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Title */}
                <div>
                  <label className="form-label">Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Event description..."
                    rows={3}
                  ></textarea>
                </div>

                {/* Event Type & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Event Type *</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="standup">Standup</option>
                      <option value="test_cycle">Test Cycle</option>
                      <option value="bug_triage">Bug Triage</option>
                      <option value="release_review">Release Review</option>
                      <option value="retesting">Retesting</option>
                      <option value="deadline">Deadline</option>
                      <option value="leave">Leave</option>
                      <option value="work_from_home">Work From Home</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Start Time */}
                <div>
                  <label className="form-label">Start Time *</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Meeting room, Zoom link, etc."
                  />
                </div>

                {/* All Day */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allDay"
                    name="allDay"
                    checked={formData.allDay}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor="allDay" className="text-sm text-gray-700">All Day Event</label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Create Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
