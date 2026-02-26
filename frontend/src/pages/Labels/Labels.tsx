import { useState, useEffect, useCallback } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const DEFAULT_COLORS = ['#6366F1', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316']

const Labels = () => {
  const { isAdminOrManager } = usePermissions()
  const [labels, setLabels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLabel, setEditingLabel] = useState<any>(null)
  const [form, setForm] = useState({ name: '', color: '#6366F1', description: '' })
  const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }

  const fetchLabels = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/v1/labels', { headers })
    if (res.ok) { const d = await res.json(); setLabels(d.labels || []) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLabels() }, [fetchLabels])

  const openCreate = () => {
    setEditingLabel(null)
    setForm({ name: '', color: '#6366F1', description: '' })
    setShowModal(true)
  }

  const openEdit = (label: any) => {
    setEditingLabel(label)
    setForm({ name: label.name, color: label.color || '#6366F1', description: label.description || '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const method = editingLabel ? 'PUT' : 'POST'
    const url = editingLabel ? `/api/v1/labels/${editingLabel.id}` : '/api/v1/labels'
    const res = await fetch(url, {
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: form })
    })
    if (res.ok) { setShowModal(false); fetchLabels() }
    else { const e = await res.json(); alert(JSON.stringify(e.errors || 'Failed')) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this label?')) return
    await fetch(`/api/v1/labels/${id}`, { method: 'DELETE', headers })
    fetchLabels()
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-transparent p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] dark:text-gray-100 mb-2">Labels</h1>
          <p className="text-[#64748B] dark:text-gray-400">Manage labels to categorize tickets and test cases</p>
        </div>
        {isAdminOrManager && (
          <button className="btn btn-primary" onClick={openCreate}>+ New Label</button>
        )}
      </div>

      {loading ? (
        <BLoader />
      ) : labels.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🏷️</div>
          <p className="text-gray-400 text-lg mb-2">No labels yet.</p>
          <p className="text-gray-400 text-sm">Create labels to organize your tickets and test cases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {labels.map(label => (
            <div key={label.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: label.color || '#6366F1' }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{label.name}</p>
                {label.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{label.description}</p>}
              </div>
              {isAdminOrManager && (
                <div className="flex gap-1 flex-shrink-0">
                  <button title="Edit" onClick={() => openEdit(label)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button title="Delete" onClick={() => handleDelete(label.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingLabel ? 'Edit Label' : 'Create Label'}</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="form-label">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="bug, feature, urgent..." />
              </div>
              <div>
                <label className="form-label">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
                  <span className="text-sm text-gray-500">{form.color}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DEFAULT_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))} className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-input" placeholder="Optional description" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.color }} />
                <span className="text-sm font-medium" style={{ color: form.color }}>{form.name || 'Preview'}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>
                {editingLabel ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Labels
