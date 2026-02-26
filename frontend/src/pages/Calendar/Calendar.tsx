import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const EVENT_COLORS: Record<string, string> = {
  test_cycle:      'bg-purple-500 text-white',
  bug_triage:      'bg-red-500 text-white',
  release_review:  'bg-blue-500 text-white',
  standup:         'bg-green-500 text-white',
  deadline:        'bg-orange-500 text-white',
  retesting:       'bg-yellow-500 text-white',
  leave:           'bg-gray-400 text-white',
  work_from_home:  'bg-indigo-500 text-white',
}

const toLocalDatetimeString = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T09:00`
}

const Calendar = () => {
  const { t } = useLanguage()
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

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
      const response = await fetch('/api/v1/calendar_events', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!response.ok) throw new Error('Failed to fetch calendar events')
      const data = await response.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const openCreateOnDate = (date: Date) => {
    if (!canCreate.calendar) return
    setEditEvent(null)
    setFormData({ title: '', description: '', eventType: 'standup', startTime: toLocalDatetimeString(date), location: '', allDay: false, status: 'scheduled' })
    setShowModal(true)
  }

  const openEdit = (e: React.MouseEvent, event: any) => {
    e.stopPropagation()
    setEditEvent(event)
    setFormData({
      title: event.title || '',
      description: event.description || '',
      eventType: event.event_type || 'standup',
      startTime: event.start_time ? event.start_time.slice(0, 16) : '',
      location: event.location || '',
      allDay: event.all_day || false,
      status: event.status || 'scheduled',
    })
    setShowModal(true)
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this event?')) return
    try {
      const res = await fetch(`/api/v1/calendar_events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!res.ok) throw new Error('Failed to delete event')
      setEvents(prev => prev.filter(ev => ev.id !== id))
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Delete failed'}`)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const url = editEvent ? `/api/v1/calendar_events/${editEvent.id}` : '/api/v1/calendar_events'
      const method = editEvent ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
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
        throw new Error(error.errors ? JSON.stringify(error.errors) : `Failed to ${editEvent ? 'update' : 'create'} event`)
      }
      setFormData({ title: '', description: '', eventType: 'standup', startTime: '', location: '', allDay: false, status: 'scheduled' })
      setEditEvent(null)
      setShowModal(false)
      fetchEvents()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to save event'}`)
    }
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate()

  const cells: { date: Date; isCurrentMonth: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ date: new Date(viewYear, viewMonth - 1, prevMonthDays - i), isCurrentMonth: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(viewYear, viewMonth, d), isCurrentMonth: true })
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++)
    cells.push({ date: new Date(viewYear, viewMonth + 1, d), isCurrentMonth: false })

  const eventsOnDate = (date: Date) =>
    events.filter(ev => {
      const d = new Date(ev.start_time)
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate()
    })

  const isToday = (date: Date) =>
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  const isPast = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return d < t
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">{t('calendar.title')}</h1>
          <p className="text-[#64748B]">{t('calendar.subtitle')}</p>
        </div>
        <div className="flex gap-2 items-center">
          <a href="/api/v1/calendar_events/export"
            className="btn btn-outline text-sm"
            target="_blank" rel="noopener noreferrer">
            ↓ Export iCal
          </a>
          {canCreate.calendar && (
            <button
              onClick={() => {
                setEditEvent(null)
                setFormData({ title: '', description: '', eventType: 'standup', startTime: toLocalDatetimeString(today), location: '', allDay: false, status: 'scheduled' })
                setShowModal(true)
              }}
              className="btn btn-primary"
            >
              + New Event
            </button>
          )}
        </div>
      </div>

      {loading && <BLoader />}

      {!loading && (
        <div className="card p-0 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-[#0F172A]">{MONTHS[viewMonth]} {viewYear}</h2>
              <button
                onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()) }}
                className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors font-medium"
              >
                Today
              </button>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const dayEvents = eventsOnDate(cell.date)
              const today_ = isToday(cell.date)
              const past = isPast(cell.date)
              const isLastRow = idx >= 35
              const isLastCol = (idx + 1) % 7 === 0
              return (
                <div
                  key={idx}
                  onClick={() => !past && openCreateOnDate(cell.date)}
                  className={`min-h-[100px] p-2 border-gray-100 transition-colors
                    ${!isLastRow ? 'border-b' : ''}
                    ${!isLastCol ? 'border-r' : ''}
                    ${past
                      ? 'bg-gray-50 opacity-50 cursor-not-allowed'
                      : cell.isCurrentMonth
                        ? 'bg-white hover:bg-indigo-50/30 cursor-pointer'
                        : 'bg-gray-50/50 hover:bg-indigo-50/20 cursor-pointer'
                    }
                  `}
                >
                  {/* Date Number */}
                  <div className="mb-1">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${today_ ? 'bg-indigo-600 text-white font-bold' : past ? 'text-gray-400' : cell.isCurrentMonth ? 'text-[#0F172A]' : 'text-gray-300'}
                    `}>
                      {cell.date.getDate()}
                    </span>
                  </div>
                  {/* Events */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div
                        key={ev.id}
                        title={ev.title}
                        className={`group flex items-center justify-between text-xs px-1.5 py-0.5 rounded ${past ? 'bg-gray-300 text-gray-500' : EVENT_COLORS[ev.event_type] || 'bg-gray-400 text-white'}`}
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="truncate flex-1">{ev.title}</span>
                        {!past && (
                          <span className="hidden group-hover:flex items-center gap-0.5 ml-1 shrink-0">
                            {canEdit.calendar && (
                              <button onClick={e => openEdit(e, ev)} className="hover:bg-white/30 rounded p-0.5" title="Edit">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            {canDelete.calendar && (
                              <button onClick={e => handleDelete(e, ev.id)} className="hover:bg-white/30 rounded p-0.5" title="Delete">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editEvent ? 'Edit Event' : 'Create Calendar Event'}</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="form-label">Event Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" placeholder="Enter event title" required />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Event description..." rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Event Type *</label>
                    <select name="eventType" value={formData.eventType} onChange={handleChange} className="form-select" required>
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
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Start Time *</label>
                  <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} className="form-input" min={toLocalDatetimeString(today)} required />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="form-input" placeholder="Meeting room, Zoom link, etc." />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="allDay" name="allDay" checked={formData.allDay} onChange={handleChange} className="w-4 h-4" />
                  <label htmlFor="allDay" className="text-sm text-gray-700">All Day Event</label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setEditEvent(null) }}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>{editEvent ? 'Save Changes' : 'Create Event'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
