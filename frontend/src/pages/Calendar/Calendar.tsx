import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import { toast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirm'

const DAYS_LONG  = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAYS_SHORT = ['S','M','T','W','T','F','S']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const EVENT_COLORS: Record<string, string> = {
  test_cycle:     'bg-purple-500 text-white',
  bug_triage:     'bg-red-500 text-white',
  release_review: 'bg-blue-500 text-white',
  standup:        'bg-cyan-500 text-white',
  deadline:       'bg-orange-500 text-white',
  retesting:      'bg-yellow-500 text-gray-900',
  leave:          'bg-gray-400 text-white',
  work_from_home: 'bg-indigo-500 text-white',
}

const toLocalDatetimeString = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T09:00`
}

// Convert UTC ISO string from backend → local datetime-local input value (IST)
const toLocalInputValue = (utcStr: string): string => {
  if (!utcStr) return ''
  const d = new Date(utcStr)
  const y   = d.getFullYear()
  const mo  = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h   = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day}T${h}:${min}`
}

const buildCells = (year: number, month: number) => {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays    = new Date(year, month, 0).getDate()
  const cells: { date: Date; current: boolean; isNext: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, prevDays - i), current: false, isNext: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), current: true, isNext: false })
  while (cells.length < 35)
    cells.push({ date: new Date(year, month + 1, cells.length - firstDay - daysInMonth + 1), current: false, isNext: true })
  return cells.slice(0, 35)
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// Google all-day events return "2026-02-27" (date-only). new Date("2026-02-27") treats it
// as UTC midnight, which shifts to the previous day in IST/other +UTC zones. Fix: parse as local noon.
const parseEvDate = (str: string) => {
  if (typeof str === 'string' && str.length === 10 && !str.includes('T'))
    return new Date(`${str}T12:00:00`)   // local noon → stays on correct day
  return new Date(str)
}

const eventClass = (ev: any) =>
  ev.is_google ? 'bg-blue-500 text-white' : (EVENT_COLORS[ev.event_type] || 'bg-gray-400 text-white')

const Calendar = () => {
  const { t } = useLanguage()
  const { canCreate, canEdit, canDelete } = usePermissions()
  const today = new Date()

  const [events,    setEvents]    = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [viewMode,  setViewMode]  = useState<'month'|'week'|'day'>('month')
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected,  setSelected]  = useState<Date>(today)
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState<any>(null)
  const [openTypeMenu,   setOpenTypeMenu]   = useState(false)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [customTypes, setCustomTypes] = useState<{val: string; label: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('cal_custom_types') || '[]') } catch { return [] }
  })
  const [hiddenDefaultTypes, setHiddenDefaultTypes] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('cal_hidden_types') || '[]') } catch { return [] }
  })
  const [newTypeInput, setNewTypeInput] = useState('')
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)

  // Google Calendar
  const [gcalConnected, setGcalConnected]   = useState(false)
  const [gcalEmail,     setGcalEmail]       = useState('')
  const [gcalSyncing,   setGcalSyncing]     = useState(false)
  const [gcalLoading,   setGcalLoading]     = useState(false)
  const [gcalEvents,    setGcalEvents]      = useState<any[]>([])

  const deleteType = (val: string, isCustom: boolean) => {
    if (isCustom) {
      const updated = customTypes.filter(t => t.val !== val)
      setCustomTypes(updated)
      localStorage.setItem('cal_custom_types', JSON.stringify(updated))
    } else {
      const updated = [...hiddenDefaultTypes, val]
      setHiddenDefaultTypes(updated)
      localStorage.setItem('cal_hidden_types', JSON.stringify(updated))
    }
    if (formData.eventType === val) setFormData(prev => ({ ...prev, eventType: 'standup' }))
  }
  const [formData, setFormData] = useState({
    title: '', description: '', eventType: 'standup',
    startTime: '', location: '', allDay: false, status: 'scheduled'
  })

  const headers = { Authorization: `Bearer ${localStorage.getItem('authToken')}` }

  // Google Calendar helpers
  const checkGcalStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/google_calendar/status', { headers })
      const data = await res.json()
      setGcalConnected(data.connected)
      setGcalEmail(data.email || '')
    } catch { /* ignore */ }
  }, [])

  const connectGcal = async () => {
    setGcalLoading(true)
    try {
      const res  = await fetch('/api/v1/google_calendar/auth_url', { headers })
      const data = await res.json()
      if (data.url) {
        const popup = window.open(data.url, 'gcal_auth', 'width=500,height=600')
        const timer = setInterval(() => {
          if (popup?.closed) { clearInterval(timer); checkGcalStatus(); setGcalLoading(false) }
        }, 500)
      }
    } catch { toast.error('Failed to get auth URL'); setGcalLoading(false) }
  }

  const syncGcal = async () => {
    setGcalSyncing(true)
    try {
      const res  = await fetch('/api/v1/google_calendar/sync', { method: 'POST', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      toast.success(`Synced ${data.synced} events to Google Calendar`)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Sync failed') }
    finally { setGcalSyncing(false) }
  }

  const disconnectGcal = async () => {
    if (!await confirmDialog('Disconnect Google Calendar?', 'Disconnect')) return
    try {
      await fetch('/api/v1/google_calendar/disconnect', { method: 'DELETE', headers })
      setGcalConnected(false); setGcalEmail('')
      toast.success('Google Calendar disconnected')
    } catch { toast.error('Failed to disconnect') }
  }

  const fetchGcalEvents = useCallback(async (year: number, month: number) => {
    try {
      // Build date strings directly to avoid UTC conversion shifting the month boundary in IST
      const pad  = (n: number) => String(n).padStart(2, '0')
      const start = `${year}-${pad(month + 1)}-01`
      const nextYear  = month === 11 ? year + 1 : year
      const nextMonth = month === 11 ? 1 : month + 2
      const end = `${nextYear}-${pad(nextMonth)}-01`   // exclusive upper bound = first of next month
      const res  = await fetch(`/api/v1/google_calendar/events?start=${start}&end=${end}`, { headers })
      const data = await res.json()
      setGcalEvents(Array.isArray(data) ? data : [])
    } catch { setGcalEvents([]) }
  }, [])

  useEffect(() => { checkGcalStatus() }, [checkGcalStatus])
  useEffect(() => {
    if (gcalConnected) fetchGcalEvents(viewYear, viewMonth)
    else setGcalEvents([])
  }, [gcalConnected, viewYear, viewMonth, fetchGcalEvents])

  // Auto-refresh Google Calendar events every 5 minutes so external deletions are reflected
  useEffect(() => {
    if (!gcalConnected) return
    const interval = setInterval(() => fetchGcalEvents(viewYear, viewMonth), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [gcalConnected, viewYear, viewMonth, fetchGcalEvents])

  // Refresh Google Calendar events when the tab regains focus (user comes back from Google Calendar)
  useEffect(() => {
    if (!gcalConnected) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchGcalEvents(viewYear, viewMonth)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [gcalConnected, viewYear, viewMonth, fetchGcalEvents])

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/calendar_events', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Merge BugZera + Google Calendar events, deduplicating Google events that were
  // pushed from BugZera (same title on same day = same event, show BugZera copy only)
  const allEvents = [
    ...events,
    ...gcalEvents.filter(gev =>
      !events.some(ev =>
        ev.title === gev.title &&
        sameDay(parseEvDate(ev.start_time), parseEvDate(gev.start_time))
      )
    )
  ]

  const eventsOn = (date: Date) =>
    allEvents.filter(ev => sameDay(parseEvDate(ev.start_time), date))

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) } else setViewMonth(m => m-1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) } else setViewMonth(m => m+1) }

  // Week helpers
  const getWeekStart = (d: Date) => { const s = new Date(d); s.setDate(d.getDate() - d.getDay()); return s }
  const weekDays = (d: Date) => Array.from({ length: 7 }, (_, i) => { const dd = new Date(getWeekStart(d)); dd.setDate(dd.getDate() + i); return dd })
  const prevWeek = () => setSelected(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd })
  const nextWeek = () => setSelected(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd })
  const prevDay  = () => setSelected(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd })
  const nextDay  = () => setSelected(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd })

  const HOURS = Array.from({ length: 24 }, (_, i) => i)
  const eventsInHour = (date: Date, hour: number) =>
    allEvents.filter(ev => { const d = parseEvDate(ev.start_time); return sameDay(d, date) && d.getHours() === hour })

  const navPrev = () => { if (viewMode === 'month') prevMonth(); else if (viewMode === 'week') prevWeek(); else prevDay() }
  const navNext = () => { if (viewMode === 'month') nextMonth(); else if (viewMode === 'week') nextWeek(); else nextDay() }

  const headerTitle = (() => {
    if (viewMode === 'month') {
      const cells = buildCells(viewYear, viewMonth)
      const lastCell = cells[cells.length - 1].date
      return lastCell.getMonth() !== viewMonth
        ? `${MONTHS[viewMonth]}–${MONTHS[lastCell.getMonth()]}`
        : MONTHS[viewMonth]
    }
    if (viewMode === 'week') {
      const days = weekDays(selected)
      const first = days[0], last = days[6]
      return first.getMonth() === last.getMonth()
        ? `${MONTHS[first.getMonth()]} ${first.getDate()}–${last.getDate()}`
        : `${MONTHS[first.getMonth()]} ${first.getDate()} – ${MONTHS[last.getMonth()]} ${last.getDate()}`
    }
    return selected.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
  })()

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  const openCreate = (date: Date) => {
    if (!canCreate.calendar) return
    setEditEvent(null)
    setFormData({ title: '', description: '', eventType: 'standup', startTime: toLocalDatetimeString(date), location: '', allDay: false, status: 'scheduled' })
    setShowModal(true)
  }

  const openEdit = (e: React.MouseEvent, ev: any) => {
    e.stopPropagation()
    setEditEvent(ev)
    setFormData({ title: ev.title||'', description: ev.description||'', eventType: ev.event_type||'standup', startTime: toLocalInputValue(ev.start_time)||'', location: ev.location||'', allDay: ev.all_day||false, status: ev.status||'scheduled' })
    setShowModal(true)
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!await confirmDialog('This event will be permanently deleted.', 'Delete Event')) return
    try {
      await fetch(`/api/v1/calendar_events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
      setEvents(prev => prev.filter(ev => ev.id !== id))
    } catch { toast.error('Delete failed') }
  }

  const handleDeleteGcal = async (e: React.MouseEvent, gcalId: string) => {
    e.stopPropagation()
    if (!await confirmDialog('This will delete the event from Google Calendar too.', 'Delete Google Event')) return
    try {
      const res = await fetch(`/api/v1/google_calendar/delete_event?event_id=${encodeURIComponent(gcalId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!res.ok) throw new Error('Delete failed')
      setGcalEvents(prev => prev.filter(ev => ev.id !== gcalId))
      toast.success('Google event deleted')
    } catch { toast.error('Failed to delete Google event') }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const url    = editEvent ? `/api/v1/calendar_events/${editEvent.id}` : '/api/v1/calendar_events'
      const method = editEvent ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ calendar_event: { title: formData.title, description: formData.description, event_type: formData.eventType, start_time: formData.startTime ? new Date(formData.startTime).toISOString() : null, location: formData.location, all_day: formData.allDay, status: formData.status } })
      })
      if (!res.ok) throw new Error('Failed to save')
      setShowModal(false); setEditEvent(null); fetchEvents()

      // Auto-push to Google Calendar on create (not edit)
      // Note: do NOT re-fetch gcalEvents here — the new event is already shown via BugZera's
      // own fetchEvents(). Fetching from Google immediately would cause a duplicate to appear.
      if (!editEvent && gcalConnected) {
        try {
          const startDt = new Date(formData.startTime)
          const endDt   = new Date(startDt.getTime() + 60 * 60 * 1000) // +1 hour
          await fetch('/api/v1/google_calendar/push_event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
            body: JSON.stringify({ title: formData.title, description: formData.description, location: formData.location, start_time: startDt.toISOString(), end_time: endDt.toISOString() })
          })
        } catch { /* Google push failed silently — BugZera event was saved */ }
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const cells     = buildCells(viewYear, viewMonth)
  const miniCells = buildCells(viewYear, viewMonth)
  const selectedEvents = eventsOn(selected)

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden bg-white text-gray-900">

      {/* ── LEFT PANEL ── */}
      <div className="w-56 shrink-0 p-4 border-r border-gray-200 flex flex-col gap-4 overflow-y-auto bg-gray-50">

        {/* + New Event */}
        {canCreate.calendar && (
          <button
            onClick={() => openCreate(selected)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-accent-neon text-white text-sm font-semibold hover:opacity-90 transition"
          >
            + New Event
          </button>
        )}

        {/* Mini Calendar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-200 transition">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span className="text-xs font-semibold text-gray-700">{MONTHS[viewMonth].slice(0,3)} {viewYear}</span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-200 transition">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map((d, i) => <div key={i} className="text-center text-[10px] text-gray-400 font-medium py-0.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {miniCells.map((cell, i) => {
              const isTod  = sameDay(cell.date, today)
              const isSel  = sameDay(cell.date, selected)
              const dayEvs = eventsOn(cell.date)
              const hasEv  = dayEvs.length > 0
              return (
                <button key={i} onClick={() => setSelected(cell.date)}
                  className={`text-center text-[11px] py-1 rounded-full transition
                    ${isSel  ? 'bg-accent-neon text-white font-bold' : ''}
                    ${isTod && !isSel ? 'text-orange-500 font-bold' : ''}
                    ${!isSel && !isTod ? (cell.current ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-300 hover:bg-gray-200') : ''}
                  `}
                >
                  {cell.date.getDate()}
                  {hasEv && !isSel && <span className="block mx-auto w-1 h-1 rounded-full bg-accent-neon mt-0.5" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day events */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            {selected.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-gray-400">No events</p>
          ) : selectedEvents.map(ev => (
            <div key={ev.id} className={`text-xs px-2 py-1.5 rounded mb-1 ${eventClass(ev)}`}>
              {ev.title}
            </div>
          ))}
        </div>

        {/* ── Google Calendar ── */}
        <div className="mt-auto border-t border-gray-200 pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Google Calendar</p>
          {gcalConnected ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1">
                <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                <span className="text-xs text-gray-600 truncate">{gcalEmail || 'Connected'}</span>
              </div>
              <button
                onClick={disconnectGcal}
                className="w-full text-xs text-gray-400 hover:text-red-500 text-center py-1 transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectGcal}
              disabled={gcalLoading}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {gcalLoading ? 'Connecting…' : 'Connect Google Calendar'}
            </button>
          )}
        </div>

      </div>

      {/* ── MAIN CALENDAR ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button onClick={navPrev} className="p-1.5 rounded hover:bg-gray-100 transition">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900">{headerTitle}</h2>
            <button onClick={navNext} className="p-1.5 rounded hover:bg-gray-100 transition">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
            <button onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); setSelected(today) }}
              className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-medium">
              Today
            </button>
          </div>
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
            {(['month','week','day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs font-semibold capitalize transition
                  ${viewMode === mode ? 'bg-accent-neon text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* ── MONTH VIEW ── */}
        {viewMode === 'month' && (<>
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {DAYS_LONG.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 tracking-widest">{d}</div>
            ))}
          </div>
          {loading ? (
            <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden">
              {Array.from({length: 35}).map((_,i) => (
                <div key={i} className="border border-gray-100 dark:border-gray-800 p-1">
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-6 rounded mb-1" />
                  <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-3 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden">
              {cells.map((cell, idx) => {
                const dayEvents = eventsOn(cell.date)
                const isTod  = sameDay(cell.date, today)
                const isSel  = sameDay(cell.date, selected)
                const isLastCol = (idx + 1) % 7 === 0
                const isLastRow = idx >= 28
                return (
                  <div
                    key={idx}
                    onClick={() => { setSelected(cell.date); openCreate(cell.date) }}
                    className={`p-1.5 border-gray-200 overflow-hidden cursor-pointer
                      ${!isLastRow ? 'border-b' : ''}
                      ${!isLastCol ? 'border-r' : ''}
                      ${isSel ? 'bg-blue-50' : cell.current ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/60 hover:bg-gray-100/60'}
                    `}
                  >
                    <div className="mb-1 flex justify-start">
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                        ${isTod ? 'bg-orange-500 text-white font-bold' : cell.current ? 'text-gray-700' : 'text-gray-300'}
                      `}>{cell.date.getDate()}</span>
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} onClick={e => e.stopPropagation()}
                          className={`group flex items-center justify-between text-[11px] px-1.5 py-0.5 rounded ${eventClass(ev)}`}>
                          <span className="truncate flex-1">{ev.title}</span>
                          {ev.is_google ? (
                            <span className="hidden group-hover:flex items-center gap-0.5 ml-1 shrink-0">
                              <button onClick={e => handleDeleteGcal(e, ev.id)} className="hover:bg-white/30 rounded p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                            </span>
                          ) : (
                            <span className="hidden group-hover:flex items-center gap-0.5 ml-1 shrink-0">
                              {canEdit.calendar && <button onClick={e => openEdit(e, ev)} className="hover:bg-white/30 rounded p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>}
                              {canDelete.calendar && <button onClick={e => handleDelete(e, ev.id)} className="hover:bg-white/30 rounded p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}
                            </span>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <div className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 3}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>)}

        {/* ── WEEK VIEW ── */}
        {viewMode === 'week' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Week day headers */}
            <div className="grid border-b border-gray-200 bg-gray-50" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              <div />
              {weekDays(selected).map((d, i) => {
                const isTod = sameDay(d, today)
                return (
                  <div key={i} className="py-2 text-center border-l border-gray-200 cursor-pointer hover:bg-gray-100 transition" onClick={() => { setSelected(d); setViewMode('day') }}>
                    <div className="text-xs text-gray-400 font-medium">{DAYS_LONG[i]}</div>
                    <div className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${isTod ? 'bg-orange-500 text-white' : 'text-gray-700'}`}>{d.getDate()}</div>
                  </div>
                )
              })}
            </div>
            {/* Time grid */}
            <div className="flex-1 overflow-y-auto">
              {HOURS.map(hour => (
                <div key={hour} className="grid border-b border-gray-100" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', minHeight: 56 }}>
                  <div className="pr-2 pt-1 text-right text-xs text-gray-400 shrink-0">
                    {hour === 0 ? '' : `${hour.toString().padStart(2,'0')}:00`}
                  </div>
                  {weekDays(selected).map((d, di) => {
                    const evs = eventsInHour(d, hour)
                    return (
                      <div key={di} className="border-l border-gray-100 p-0.5 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => { const nd = new Date(d); nd.setHours(hour); openCreate(nd) }}>
                        {evs.map(ev => (
                          <div key={ev.id} onClick={e => e.stopPropagation()}
                            className={`group text-[11px] px-1.5 py-1 rounded mb-0.5 flex items-center justify-between ${eventClass(ev)}`}>
                            <span className="truncate flex-1">{ev.title}</span>
                            {ev.is_google ? (
                              <span className="hidden group-hover:flex gap-0.5 shrink-0">
                                <button onClick={e => handleDeleteGcal(e, ev.id)} className="hover:bg-white/30 rounded p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                              </span>
                            ) : (
                              <span className="hidden group-hover:flex gap-0.5 shrink-0">
                                {canEdit.calendar && <button onClick={e => openEdit(e, ev)} className="hover:bg-white/30 rounded p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>}
                                {canDelete.calendar && <button onClick={e => handleDelete(e, ev.id)} className="hover:bg-white/30 rounded p-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DAY VIEW ── */}
        {viewMode === 'day' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-2 flex items-center gap-2">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${sameDay(selected, today) ? 'bg-orange-500 text-white' : 'text-gray-700'}`}>
                {selected.getDate()}
              </div>
              <span className="text-sm font-semibold text-gray-600">
                {selected.toLocaleDateString('en', { weekday: 'long', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {HOURS.map(hour => {
                const evs = eventsInHour(selected, hour)
                return (
                  <div key={hour} className="flex border-b border-gray-100 min-h-14">
                    <div className="w-14 pr-2 pt-1 text-right text-xs text-gray-400 shrink-0">
                      {hour === 0 ? '' : `${hour.toString().padStart(2,'0')}:00`}
                    </div>
                    <div className="flex-1 p-1 border-l border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => { const nd = new Date(selected); nd.setHours(hour); openCreate(nd) }}>
                      {evs.map(ev => (
                        <div key={ev.id} onClick={e => e.stopPropagation()}
                          className={`group flex items-center justify-between text-sm px-3 py-2 rounded mb-1 ${eventClass(ev)}`}>
                          <div>
                            <div className="font-medium">{ev.title}</div>
                            {ev.location && <div className="text-xs opacity-80 mt-0.5">{ev.location}</div>}
                          </div>
                          {ev.is_google ? (
                            <span className="hidden group-hover:flex gap-1 shrink-0 ml-2">
                              <button onClick={e => handleDeleteGcal(e, ev.id)} className="hover:bg-white/30 rounded p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                            </span>
                          ) : (
                            <span className="hidden group-hover:flex gap-1 shrink-0 ml-2">
                              {canEdit.calendar && <button onClick={e => openEdit(e, ev)} className="hover:bg-white/30 rounded p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>}
                              {canDelete.calendar && <button onClick={e => handleDelete(e, ev.id)} className="hover:bg-white/30 rounded p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>


      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#2C2C2E' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditEvent(null) }}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <div className="flex flex-col items-center">
                <span className="text-sm font-semibold text-white">{editEvent ? 'Edit Event' : 'New Event'}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: EVENT_COLORS[formData.eventType]?.includes('purple') ? '#a855f7' : EVENT_COLORS[formData.eventType]?.includes('red') ? '#ef4444' : EVENT_COLORS[formData.eventType]?.includes('blue') ? '#3b82f6' : EVENT_COLORS[formData.eventType]?.includes('cyan') ? '#06b6d4' : EVENT_COLORS[formData.eventType]?.includes('orange') ? '#f97316' : EVENT_COLORS[formData.eventType]?.includes('yellow') ? '#eab308' : EVENT_COLORS[formData.eventType]?.includes('indigo') ? '#6366f1' : '#9ca3af' }}
                  />
                  <span className="text-xs text-gray-400 capitalize">{formData.eventType.replace('_', ' ')}</span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition"
              >
                {editEvent ? 'Save' : 'Save'}
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[70vh]">
              {/* Title + Location */}
              <div className="mx-4 mt-4 rounded-xl overflow-hidden" style={{ background: '#3A3A3C' }}>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Title"
                  required
                  autoFocus
                  className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 text-sm outline-none border-b border-white/10 focus:border-orange-500 transition-colors"
                />
                <div className="flex items-center px-4 py-3 gap-2">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Location"
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                  />
                  <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </div>
              </div>

              {/* Schedule */}
              <div className="mx-4 mt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Schedule</p>
                <div className="rounded-xl" style={{ background: '#3A3A3C' }}>
                  {/* All Day */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-sm text-white">All Day</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, allDay: !prev.allDay }))}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${formData.allDay ? 'bg-orange-500' : 'bg-gray-500'}`}
                    >
                      <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${formData.allDay ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-sm text-white">Starts</span>
                    <input
                      type={formData.allDay ? 'date' : 'datetime-local'}
                      name="startTime"
                      value={formData.allDay ? formData.startTime.slice(0, 10) : formData.startTime}
                      onChange={handleChange}
                      required
                      className="bg-transparent text-sm text-orange-400 outline-none text-right"
                    />
                  </div>

                  {/* Event Type — custom inline picker */}
                  <div>
                    <button
                      type="button"
                      onClick={() => { setOpenTypeMenu(o => !o); setOpenStatusMenu(false) }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="text-white">Type</span>
                      <span className="flex items-center gap-1 text-orange-400">
                        {formData.eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        <svg className={`w-3.5 h-3.5 transition-transform ${openTypeMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                      </span>
                    </button>
                    {openTypeMenu && (
                      <div className="border-t border-white/10">
                        {([
                          { val: 'standup',        label: 'Standup',        isCustom: false },
                          { val: 'test_cycle',     label: 'Test Cycle',     isCustom: false },
                          { val: 'bug_triage',     label: 'Bug Triage',     isCustom: false },
                          { val: 'release_review', label: 'Release Review', isCustom: false },
                          { val: 'retesting',      label: 'Retesting',      isCustom: false },
                          { val: 'deadline',       label: 'Deadline',       isCustom: false },
                          { val: 'leave',          label: 'Leave',          isCustom: false },
                          { val: 'work_from_home', label: 'Work From Home', isCustom: false },
                          ...customTypes.map(t => ({ val: t.val, label: t.label, isCustom: true })),
                        ] as { val: string; label: string; isCustom: boolean }[])
                          .filter(t => !hiddenDefaultTypes.includes(t.val))
                          .map(({ val, label, isCustom }) => (
                          <div key={val} className="group flex items-center hover:bg-white/5 transition-colors">
                            <button
                              type="button"
                              onClick={() => { setFormData(prev => ({ ...prev, eventType: val })); setOpenTypeMenu(false); setShowNewTypeInput(false) }}
                              className={`flex-1 flex items-center gap-2 px-6 py-2.5 text-sm text-left ${formData.eventType === val ? 'text-orange-400' : 'text-gray-300'}`}
                            >
                              <span className="flex-1">{label}</span>
                              {formData.eventType === val && <svg className="w-4 h-4 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>}
                            </button>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); deleteType(val, isCustom) }}
                              className="opacity-0 group-hover:opacity-100 pr-4 text-gray-500 hover:text-red-400 transition-all"
                              title="Delete type"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        ))}

                        {/* Add new type */}
                        <div className="border-t border-white/10 px-4 py-3">
                          {showNewTypeInput ? (
                            <div className="space-y-2">
                              <input
                                autoFocus
                                type="text"
                                value={newTypeInput}
                                onChange={e => setNewTypeInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Escape') { setShowNewTypeInput(false); setNewTypeInput('') }
                                }}
                                placeholder="Enter type name…"
                                className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setShowNewTypeInput(false); setNewTypeInput('') }}
                                  className="flex-1 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/5 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={!newTypeInput.trim()}
                                  onClick={() => {
                                    if (!newTypeInput.trim()) return
                                    const val = newTypeInput.trim().toLowerCase().replace(/\s+/g, '_')
                                    const label = newTypeInput.trim()
                                    const updated = [...customTypes, { val, label }]
                                    setCustomTypes(updated)
                                    localStorage.setItem('cal_custom_types', JSON.stringify(updated))
                                    setFormData(prev => ({ ...prev, eventType: val }))
                                    setNewTypeInput('')
                                    setShowNewTypeInput(false)
                                    setOpenTypeMenu(false)
                                  }}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 transition"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowNewTypeInput(true)}
                              className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition py-0.5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                              Add new type
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mx-4 mt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Status</p>
                <div className="rounded-xl" style={{ background: '#3A3A3C' }}>
                  <button
                    type="button"
                    onClick={() => { setOpenStatusMenu(o => !o); setOpenTypeMenu(false) }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-white">Status</span>
                    <span className="flex items-center gap-1 text-orange-400">
                      {formData.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      <svg className={`w-3.5 h-3.5 transition-transform ${openStatusMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </span>
                  </button>
                  {openStatusMenu && (
                    <div className="border-t border-white/10">
                      {[
                        ['scheduled',   'Scheduled'],
                        ['in_progress', 'In Progress'],
                        ['completed',   'Completed'],
                        ['cancelled',   'Cancelled'],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => { setFormData(prev => ({ ...prev, status: val })); setOpenStatusMenu(false) }}
                          className={`w-full flex items-center justify-between px-6 py-2.5 text-sm transition-colors hover:bg-white/5 ${formData.status === val ? 'text-orange-400' : 'text-gray-300'}`}
                        >
                          <span>{label}</span>
                          {formData.status === val && <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mx-4 mt-3 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Notes</p>
                <div className="rounded-xl overflow-hidden" style={{ background: '#3A3A3C' }}>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Add notes…"
                    className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
