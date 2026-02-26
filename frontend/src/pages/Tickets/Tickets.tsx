import React, { useState, useEffect, useCallback, type FormEvent, type ChangeEvent, type DragEvent } from 'react'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../contexts/LanguageContext'
import { T } from '../../components/AutoTranslate'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const statusColumns = [
  { id: 'todo', label: 'To Do', color: 'border-blue-400', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  { id: 'in_progress', label: 'In Progress', color: 'border-yellow-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  { id: 'in_review', label: 'In Review', color: 'border-purple-400', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  { id: 'qa_ready', label: 'QA Ready', color: 'border-orange-400', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  { id: 'done', label: 'Done', color: 'border-green-400', bgColor: 'bg-green-50', textColor: 'text-green-700' },
]

const Tickets = ({ projectId }: { projectId?: string }) => {
  const { t } = useLanguage()
  const { canCreate, canEdit, canDelete } = usePermissions()
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
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>('active')
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [editAttachmentFiles, setEditAttachmentFiles] = useState<File[]>([])
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null)
  const [ticketComments, setTicketComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [ticketTimeLogs, setTicketTimeLogs] = useState<any[]>([])
  const [showTimeLogModal, setShowTimeLogModal] = useState(false)
  const [timeLogEntry, setTimeLogEntry] = useState({ time_spent: '', description: '' })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
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
      const url = projectId
        ? `/api/v1/tickets?project_id=${projectId}`
        : '/api/v1/tickets'
      const response = await fetch(url, {
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
  }, [projectId])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/users', {
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
      const url = projectId
        ? `/api/v1/sprints?project_id=${projectId}`
        : '/api/v1/sprints'
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
    }
  }, [projectId])

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
    fetchTickets()
    fetchUsers()
    fetchSprints()
    fetchEnvironments()
  }, [fetchTickets, fetchUsers, fetchSprints, fetchEnvironments])

  useEffect(() => {
    if (!selectedTicket?.id) { setTicketComments([]); setTicketTimeLogs([]); return }
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    setLoadingComments(true)
    Promise.all([
      fetch(`/api/v1/tickets/${selectedTicket.id}/comments`, { headers }),
      fetch(`/api/v1/tickets/${selectedTicket.id}/ticket_time_logs`, { headers })
    ]).then(async ([cRes, tRes]) => {
      if (cRes.ok) { const d = await cRes.json(); setTicketComments(d.comments || []) }
      if (tRes.ok) { const d = await tRes.json(); setTicketTimeLogs(d.ticket_time_logs || []) }
    }).finally(() => setLoadingComments(false))
  }, [selectedTicket?.id])

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket?.id) return
    const res = await fetch(`/api/v1/tickets/${selectedTicket.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({ comment: { content: newComment } })
    })
    if (res.ok) {
      const d = await res.json()
      setTicketComments(prev => [...prev, d.comment])
      setNewComment('')
    }
  }

  const handleLogTime = async () => {
    if (!timeLogEntry.time_spent || !selectedTicket?.id) return
    const res = await fetch(`/api/v1/tickets/${selectedTicket.id}/ticket_time_logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({ ticket_time_log: timeLogEntry })
    })
    if (res.ok) {
      const d = await res.json()
      setTicketTimeLogs(prev => [...prev, d.ticket_time_log])
      setTimeLogEntry({ time_spent: '', description: '' })
      setShowTimeLogModal(false)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('ticket[title]', formData.title)
      fd.append('ticket[description]', formData.description)
      fd.append('ticket[status]', formData.status)
      fd.append('ticket[ticket_type]', formData.type)
      fd.append('ticket[priority]', formData.priority)
      fd.append('ticket[severity]', formData.severity)
      fd.append('ticket[steps_to_reproduce]', formData.stepsToReproduce)
      fd.append('ticket[expected_result]', formData.expectedResult)
      fd.append('ticket[actual_result]', formData.actualResult)
      if (formData.environment) fd.append('ticket[environment]', formData.environment)
      fd.append('ticket[browser_version]', formData.browserVersion)
      fd.append('ticket[os_details]', formData.osDetails)
      if (formData.assignedTo) fd.append('ticket[assigned_to]', formData.assignedTo)
      if (formData.dueDate) fd.append('ticket[due_date]', formData.dueDate)
      if (formData.estimate) fd.append('ticket[estimate]', formData.estimate)
      if (formData.sprint) fd.append('ticket[sprint_id]', formData.sprint)
      fd.append('ticket[milestone]', formData.milestone)
      fd.append('ticket[project_id]', projectId || '')
      attachmentFiles.forEach(file => {
        fd.append('ticket[attachments][]', file)
      })

      const response = await fetch('/api/v1/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: fd
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create ticket')
      }

      alert('Ticket created successfully!')
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
      setAttachmentFiles([])
      setShowModal(false)
      fetchTickets()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create ticket'}`)
      console.error('Error creating ticket:', error)
    }
  }

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/v1/tickets/${ticketId}`, {
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
      const response = await fetch(`/api/v1/tickets/${id}`, {
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
      let response
      if (editAttachmentFiles.length > 0) {
        const fd = new FormData()
        fd.append('ticket[title]', editFormData.title)
        fd.append('ticket[description]', editFormData.description)
        fd.append('ticket[status]', editFormData.status)
        fd.append('ticket[severity]', editFormData.severity)
        if (editFormData.assigned_user) fd.append('ticket[assigned_user]', editFormData.assigned_user)
        if (editFormData.sprint_id) fd.append('ticket[sprint_id]', editFormData.sprint_id)
        if (selectedTicket.attachments) {
          fd.append('existing_attachments', JSON.stringify(selectedTicket.attachments))
        }
        editAttachmentFiles.forEach(file => {
          fd.append('attachments[]', file)
        })
        response = await fetch(`/api/v1/tickets/${selectedTicket.id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          body: fd
        })
      } else {
        response = await fetch(`/api/v1/tickets/${selectedTicket.id}`, {
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
              severity: editFormData.severity,
              assigned_user: editFormData.assigned_user,
              sprint_id: editFormData.sprint_id || null
            }
          })
        })
      }
      if (!response.ok) throw new Error('Failed to update ticket')
      await fetchTickets()
      setEditMode(false)
      setEditAttachmentFiles([])
      setSelectedTicket(null)
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return
    try {
      const response = await fetch(`/api/v1/tickets/${id}`, {
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

  const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(name)
  const isVideoFile = (name: string) => /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(name)
  const isPdfFile = (name: string) => /\.pdf$/i.test(name)
  const isExcelFile = (name: string) => /\.(xlsx|xls|csv)$/i.test(name)

  const getFileIcon = (name: string) => {
    if (isImageFile(name)) return 'IMG'
    if (isVideoFile(name)) return 'VID'
    if (isPdfFile(name)) return 'PDF'
    if (isExcelFile(name)) return 'XLS'
    const ext = name.split('.').pop()?.toUpperCase()
    return ext || 'FILE'
  }

  const renderFileThumb = (name: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const dims = size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-24 h-24' : 'w-20 h-20'
    const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'
    const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]'
    if (isPdfFile(name)) {
      return (
        <div className={`${dims} rounded-lg border border-red-200 flex flex-col items-center justify-center bg-red-50 cursor-pointer hover:border-red-400 transition-colors`}>
          <svg className={`${iconSize} text-red-500`} viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 17.5v-3h1.1c.7 0 1.2-.1 1.5-.4.3-.3.5-.7.5-1.2s-.2-.9-.5-1.2c-.3-.3-.8-.4-1.5-.4H8.5v6.2h1zm1-4.6c.3 0 .5.1.6.2.1.1.2.3.2.6 0 .3-.1.5-.2.6-.1.1-.3.2-.6.2h-.9v-1.6h.9zm3.5 4.6v-3h1.3c.5 0 .9.2 1.2.5.3.3.4.8.4 1.3v.4c0 .3-.1.5-.2.7-.1.2-.3.4-.5.5-.2.1-.5.2-.9.2H14zm1-2.5v2h.3c.2 0 .4-.1.5-.2.1-.1.2-.4.2-.8 0-.4-.1-.7-.2-.8-.1-.1-.3-.2-.5-.2H15z"/></svg>
          <span className={`${textSize} text-red-600 font-semibold mt-0.5`}>PDF</span>
        </div>
      )
    }
    if (isExcelFile(name)) {
      return (
        <div className={`${dims} rounded-lg border border-green-200 flex flex-col items-center justify-center bg-green-50 cursor-pointer hover:border-green-400 transition-colors`}>
          <svg className={`${iconSize} text-green-600`} viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 17l2-3-2-3h1.5l1.3 2 1.2-2H13.5l-2 3 2 3H12l-1.3-2-1.2 2H8z"/></svg>
          <span className={`${textSize} text-green-700 font-semibold mt-0.5`}>XLS</span>
        </div>
      )
    }
    return (
      <div className={`${dims} rounded-lg border border-gray-200 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors`}>
        <svg className={`${iconSize} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        <span className={`${textSize} text-gray-500 mt-0.5`}>{getFileIcon(name)}</span>
      </div>
    )
  }

  const [excelData, setExcelData] = useState<{ headers: string[]; rows: string[][] } | null>(null)

  const parseExcelFromUrl = async (url: string) => {
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
      if (jsonData.length > 0) {
        const headers = (jsonData[0] as string[]).map(h => String(h ?? ''))
        const rows = jsonData.slice(1).map(row => (row as string[]).map(cell => String(cell ?? '')))
        setExcelData({ headers, rows })
      }
    } catch (error) {
      console.error('Error parsing Excel:', error)
      setExcelData(null)
    }
  }

  const parseExcelFromFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
      if (jsonData.length > 0) {
        const headers = (jsonData[0] as string[]).map(h => String(h ?? ''))
        const rows = jsonData.slice(1).map(row => (row as string[]).map(cell => String(cell ?? '')))
        setExcelData({ headers, rows })
      }
    } catch (error) {
      console.error('Error parsing Excel:', error)
      setExcelData(null)
    }
  }

  const openPreview = (url: string, name: string, file?: File) => {
    const type = isImageFile(name) ? 'image' : isVideoFile(name) ? 'video' : isPdfFile(name) ? 'pdf' : isExcelFile(name) ? 'excel' : 'other'
    setExcelData(null)
    setPreviewFile({ url, name, type })
    if (type === 'excel') {
      if (file) {
        parseExcelFromFile(file)
      } else {
        parseExcelFromUrl(url)
      }
    }
  }

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTickets.length && filteredTickets.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredTickets.map(t => t.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} ticket(s)? This cannot be undone.`)) return
    try {
      const res = await fetch('/api/v1/tickets/bulk_delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (res.ok) { setSelectedIds([]); fetchTickets() }
    } catch (error) { console.error('Bulk delete failed:', error) }
  }

  const handleBulkUpdateStatus = async (status: string) => {
    if (!status) return
    try {
      const res = await fetch('/api/v1/tickets/bulk_update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ ids: selectedIds, status })
      })
      if (res.ok) { setSelectedIds([]); fetchTickets() }
    } catch (error) { console.error('Bulk status update failed:', error) }
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

  // Filter tickets by selected sprint
  const filteredTickets = tickets.filter(ticket => {
    if (selectedSprintFilter === 'all') return true
    if (selectedSprintFilter === 'active') {
      const activeSprint = sprints.find(s => s.status === 'active')
      return activeSprint ? ticket.sprint_id === activeSprint.id : true
    }
    if (selectedSprintFilter === 'unassigned') return !ticket.sprint_id
    return ticket.sprint_id === parseInt(selectedSprintFilter)
  })

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('tickets.title')}</h1>
          <p className="text-gray-600">{t('tickets.subtitle')}</p>
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
          {canCreate.tickets && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <span>+</span> New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Sprint Filter */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-600">Sprint:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSprintFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedSprintFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedSprintFilter('active')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedSprintFilter === 'active' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            Current Sprint
          </button>
          {sprints.filter(s => s.status === 'completed').map(sprint => (
            <button
              key={sprint.id}
              onClick={() => setSelectedSprintFilter(String(sprint.id))}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedSprintFilter === String(sprint.id) ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {sprint.name}
            </button>
          ))}
          <button
            onClick={() => setSelectedSprintFilter('unassigned')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedSprintFilter === 'unassigned' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            No Sprint
          </button>
        </div>
      </div>      

      {/* Loading State */}
      {loading && <BLoader />}

      {/* Kanban Board View */}
      {!loading && viewMode === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map(column => {
            const columnTickets = filteredTickets.filter(t => t.status === column.id)
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
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2"><T>{ticket.title}</T></h4>
                      </div>
                      {ticket.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2"><T>{ticket.description}</T></p>
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
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedIds.length === filteredTickets.length && filteredTickets.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className={`hover:bg-gray-50 cursor-pointer ${selectedIds.includes(ticket.id) ? 'bg-blue-50' : ''}`} onClick={() => viewTicket(ticket.id)}>
                    <td className="px-4 py-4 w-10" onClick={e => toggleSelect(ticket.id, e)}>
                      <input type="checkbox" className="rounded" checked={selectedIds.includes(ticket.id)} onChange={() => {}} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900"><T>{ticket.title}</T></div>
                      {ticket.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md"><T>{ticket.description}</T></div>
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

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && viewMode === 'list' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl z-50">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <div className="h-5 w-px bg-gray-600" />
          <select
            className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
            defaultValue=""
            onChange={e => { handleBulkUpdateStatus(e.target.value); (e.target as HTMLSelectElement).value = '' }}
          >
            <option value="" disabled>Change Status</option>
            {statusColumns.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {canDelete.tickets && (
            <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1 rounded">
              Delete Selected
            </button>
          )}
          <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white text-sm ml-1">✕</button>
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
                  <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border-0 outline-none resize-y" placeholder="Describe the issue..." rows={3} required></textarea>
                    {attachmentFiles.length > 0 && (
                      <div className="px-3 pb-2 flex flex-wrap gap-2">
                        {attachmentFiles.map((file, idx) => (
                          <div key={idx} className="relative group">
                            {isImageFile(file.name) ? (
                              <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => openPreview(URL.createObjectURL(file), file.name, file)}>
                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                              </div>
                            ) : isVideoFile(file.name) ? (
                              <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors relative bg-black" onClick={() => openPreview(URL.createObjectURL(file), file.name, file)}>
                                <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                              </div>
                            ) : (
                              <div onClick={() => openPreview(URL.createObjectURL(file), file.name, file)}>
                                {renderFileThumb(file.name, 'md')}
                              </div>
                            )}
                            <button type="button" className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setAttachmentFiles(prev => prev.filter((_, i) => i !== idx))}>x</button>
                            <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[80px] text-center">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-gray-200 px-3 py-1.5 bg-gray-50">
                      <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-blue-600 transition-colors w-fit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        Attach files
                        <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) setAttachmentFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Classification */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="form-label">Status *</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select" required>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="qa_ready">QA Ready</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Type *</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="form-select" required>
                      <option value="bug">Bug</option>
                      <option value="feature">Feature</option>
                      <option value="improvement">Improvement</option>
                      <option value="task">Task</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Priority *</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className="form-select" required>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Severity *</label>
                    <select name="severity" value={formData.severity} onChange={handleChange} className="form-select" required>
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
                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="form-input" min={new Date().toISOString().split('T')[0]} />
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

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-white text-sm font-medium truncate max-w-[400px]">{previewFile.name}</span>
              <a href={previewFile.url} download={previewFile.name} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white text-xs bg-white/20 px-3 py-1 rounded-full">
                Download
              </a>
              <button className="text-white/70 hover:text-white text-2xl leading-none" onClick={() => setPreviewFile(null)}>x</button>
            </div>
            {previewFile.type === 'image' ? (
              <img src={previewFile.url} alt={previewFile.name} className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg shadow-2xl" />
            ) : previewFile.type === 'video' ? (
              <video src={previewFile.url} controls autoPlay className="max-w-[85vw] max-h-[80vh] rounded-lg shadow-2xl bg-black" />
            ) : previewFile.type === 'pdf' ? (
              <iframe src={previewFile.url} className="w-[80vw] h-[80vh] rounded-lg bg-white" title={previewFile.name} />
            ) : previewFile.type === 'excel' ? (
              <div className="bg-white rounded-lg shadow-2xl max-w-[85vw] max-h-[80vh] overflow-auto">
                {excelData ? (
                  <table className="min-w-full border-collapse">
                    <thead className="bg-green-600 sticky top-0">
                      <tr>
                        {excelData.headers.map((header, i) => (
                          <th key={i} className="px-4 py-2 text-left text-xs font-semibold text-white border border-green-700 whitespace-nowrap">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {excelData.headers.map((_, cIdx) => (
                            <td key={cIdx} className="px-4 py-1.5 text-sm text-gray-700 border border-gray-200 whitespace-nowrap">{row[cIdx] || ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <BLoader />
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <p className="text-gray-700 font-medium mb-2">{previewFile.name}</p>
                <a href={previewFile.url} download={previewFile.name} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm">Download File</a>
              </div>
            )}
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
                {!editMode && (canEdit.tickets || canDelete.tickets) && (
                  <>
                    {canEdit.tickets && (
                      <button
                        title="Edit"
                        className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          setEditMode(true)
                          setEditFormData({
                            title: selectedTicket.title || '',
                            description: selectedTicket.description || '',
                            status: selectedTicket.status || 'todo',
                            severity: selectedTicket.severity || 'medium',
                            assigned_user: selectedTicket.assigned_user || '',
                            sprint_id: selectedTicket.sprint_id || ''
                          })
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    )}
                    {canDelete.tickets && (
                      <button
                        title="Delete"
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => handleDelete(selectedTicket.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </>
                )}
                <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => { setSelectedTicket(null); setEditMode(false) }}>×</button>
              </div>
            </div>
            <div className="modal-body">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Title *</label>
                    <input type="text" name="title" value={editFormData.title} onChange={handleEditChange} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <textarea name="description" value={editFormData.description} onChange={handleEditChange} className="w-full px-3 py-2 border-0 outline-none resize-y" rows={4}></textarea>
                      {((selectedTicket.attachments && selectedTicket.attachments.length > 0) || editAttachmentFiles.length > 0) && (
                        <div className="px-3 pb-2 flex flex-wrap gap-2">
                          {selectedTicket.attachments && selectedTicket.attachments.map((att: any, idx: number) => (
                            <div key={`existing-${idx}`} className="relative">
                              {isImageFile(att.name) ? (
                                <div className="w-16 h-16 rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400" onClick={() => openPreview(`http://localhost:3000${att.url}`, att.name)}>
                                  <img src={`http://localhost:3000${att.url}`} alt={att.name} className="w-full h-full object-cover" />
                                </div>
                              ) : isVideoFile(att.name) ? (
                                <div className="w-16 h-16 rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 relative bg-black" onClick={() => openPreview(`http://localhost:3000${att.url}`, att.name)}>
                                  <video src={`http://localhost:3000${att.url}`} className="w-full h-full object-cover" muted />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                  </div>
                                </div>
                              ) : (
                                <div onClick={() => openPreview(`http://localhost:3000${att.url}`, att.name)}>
                                  {renderFileThumb(att.name, 'sm')}
                                </div>
                              )}
                            </div>
                          ))}
                          {editAttachmentFiles.map((file, idx) => (
                            <div key={`new-${idx}`} className="relative group">
                              {isImageFile(file.name) ? (
                                <div className="w-16 h-16 rounded border-2 border-blue-300 overflow-hidden cursor-pointer" onClick={() => openPreview(URL.createObjectURL(file), file.name, file)}>
                                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                </div>
                              ) : isVideoFile(file.name) ? (
                                <div className="w-16 h-16 rounded border-2 border-blue-300 overflow-hidden cursor-pointer relative bg-black" onClick={() => openPreview(URL.createObjectURL(file), file.name, file)}>
                                  <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                  </div>
                                </div>
                              ) : (
                                <div onClick={() => openPreview(URL.createObjectURL(file), file.name, file)}>
                                  {renderFileThumb(file.name, 'sm')}
                                </div>
                              )}
                              <button type="button" className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditAttachmentFiles(prev => prev.filter((_, i) => i !== idx))}>x</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-gray-200 px-3 py-1.5 bg-gray-50">
                        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer hover:text-blue-600 transition-colors w-fit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          Attach files
                          <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) setEditAttachmentFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Status *</label>
                      <select name="status" value={editFormData.status} onChange={handleEditChange} className="form-select" required>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="qa_ready">QA Ready</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Severity *</label>
                      <select name="severity" value={editFormData.severity} onChange={handleEditChange} className="form-select" required>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Assigned To</label>
                      <select name="assigned_user" value={editFormData.assigned_user} onChange={handleEditChange} className="form-select">
                        <option value="">Unassigned</option>
                        {users.map(user => (
                          <option key={user.id} value={`${user.first_name} ${user.last_name}`}>
                            {user.first_name} {user.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Sprint</label>
                      <select name="sprint_id" value={editFormData.sprint_id} onChange={handleEditChange} className="form-select">
                        <option value="">No Sprint</option>
                        {sprints.map(sprint => (
                          <option key={sprint.id} value={sprint.id}>
                            {sprint.name} {sprint.status === 'active' ? '(Active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="mt-1 text-gray-900"><T>{selectedTicket.title}</T></p>
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
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap"><T>{selectedTicket.description || 'No description'}</T></p>
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
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Attachments</label>
                      <div className="mt-2 flex flex-wrap gap-3">

                        {selectedTicket.attachments.map((att: any, idx: number) => (
                          <div key={idx} className="cursor-pointer" onClick={() => openPreview(`http://localhost:3000${att.url}`, att.name)}>
                            {isImageFile(att.name) ? (
                              <div className="group">
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                                  <img src={`http://localhost:3000${att.url}`} alt={att.name} className="w-full h-full object-cover" />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[96px] text-center">{att.name}</p>
                              </div>
                            ) : isVideoFile(att.name) ? (
                              <div className="group">
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all relative bg-black">
                                  <video src={`http://localhost:3000${att.url}`} className="w-full h-full object-cover" muted />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[96px] text-center">{att.name}</p>
                              </div>
                            ) : (
                              <div className="group">
                                {renderFileThumb(att.name, 'lg')}
                                <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[96px] text-center">{att.name}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    💬 Comments ({ticketComments.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                    {loadingComments ? (
                      <p className="text-xs text-gray-400">Loading comments...</p>
                    ) : ticketComments.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No comments yet.</p>
                    ) : ticketComments.map((c: any) => (
                      <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-accent-neon text-white text-xs flex items-center justify-center font-bold">
                            {(c.author || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-gray-700">{c.author || 'Unknown'}</span>
                          <span className="text-xs text-gray-400 ml-auto">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 ml-8">{c.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && newComment.trim() && handleAddComment()}
                      placeholder="Add a comment..."
                      className="flex-1 form-input text-sm py-1.5"
                    />
                    <button onClick={handleAddComment} disabled={!newComment.trim()} className="btn btn-primary text-sm py-1.5 px-3 disabled:opacity-40">
                      Post
                    </button>
                  </div>
                </div>

                {/* Time Log Section */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">
                      ⏱ Time Logs
                      {ticketTimeLogs.length > 0 && (
                        <span className="text-xs font-normal text-gray-500 ml-2">
                          ({ticketTimeLogs.reduce((s: number, l: any) => s + parseFloat(l.time_spent || 0), 0).toFixed(1)}h total)
                        </span>
                      )}
                    </h4>
                    <button onClick={() => setShowTimeLogModal(true)} className="text-xs btn btn-outline py-1 px-2">
                      + Log Time
                    </button>
                  </div>
                  {ticketTimeLogs.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {ticketTimeLogs.map((log: any) => (
                        <div key={log.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                          <span className="font-medium text-blue-600">{log.time_spent}h</span>
                          <span className="flex-1 truncate">{log.description || 'No description'}</span>
                          <span className="text-gray-400">{log.user_name || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </>
              )}
            </div>

            {/* Time Log Modal */}
            {showTimeLogModal && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-80">
                  <h3 className="text-base font-semibold mb-4">Log Time</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="form-label">Hours Spent *</label>
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={timeLogEntry.time_spent}
                        onChange={e => setTimeLogEntry(prev => ({ ...prev, time_spent: e.target.value }))}
                        className="form-input"
                        placeholder="e.g. 1.5"
                      />
                    </div>
                    <div>
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        value={timeLogEntry.description}
                        onChange={e => setTimeLogEntry(prev => ({ ...prev, description: e.target.value }))}
                        className="form-input"
                        placeholder="What did you work on?"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setShowTimeLogModal(false)} className="btn btn-outline">Cancel</button>
                    <button onClick={handleLogTime} disabled={!timeLogEntry.time_spent} className="btn btn-primary disabled:opacity-40">Log</button>
                  </div>
                </div>
              </div>
            )}

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
