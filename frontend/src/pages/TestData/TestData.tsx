import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import BLoader from '../../components/BLoader'

const hdrs = () => ({
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
})

const DEFAULT_FORM = {
  name: '', description: '', data_type: 'json', version: '1.0.0',
  data_content: '', generation_method: 'manual', records_count: '10',
  is_active: true, mask_sensitive: false, tags: '',
}

// Minimal faker-like generator (no external library needed)
const FIRST_NAMES = ['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Henry','Iris','Jack']
const LAST_NAMES  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Moore']
const DOMAINS     = ['gmail.com','yahoo.com','outlook.com','company.io','example.org']
const STATUSES    = ['active','inactive','pending','archived']

function fakeRecord(index: number): Record<string, unknown> {
  const first = FIRST_NAMES[index % FIRST_NAMES.length]
  const last  = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]
  return {
    id: index + 1,
    first_name: first,
    last_name: last,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${index}@${DOMAINS[index % DOMAINS.length]}`,
    phone: `+1-555-${String(1000 + index).slice(1)}`,
    status: STATUSES[index % STATUSES.length],
    created_at: new Date(Date.now() - index * 86400000).toISOString().split('T')[0],
    score: parseFloat((Math.random() * 100).toFixed(2)),
  }
}

function generateData(dataType: string, count: number, mask: boolean): string {
  const n = Math.min(count, 100)
  const records = Array.from({ length: n }, (_, i) => fakeRecord(i)).map(r => {
    if (mask) {
      return {
        ...r,
        email:   String(r.email).replace(/(?<=.).(?=[^@]+@)/g, '*'),
        phone:   String(r.phone).replace(/\d(?=\d{4})/g, '*'),
        last_name: '***',
      }
    }
    return r
  })

  if (dataType === 'csv') {
    const headers = Object.keys(records[0]).join(',')
    const rows = records.map(r => Object.values(r).map(v => `"${v}"`).join(','))
    return [headers, ...rows].join('\n')
  }
  if (dataType === 'sql') {
    const cols = Object.keys(records[0]).join(', ')
    const vals = records.map(r =>
      `  (${Object.values(r).map(v => typeof v === 'number' ? v : `'${v}'`).join(', ')})`
    ).join(',\n')
    return `INSERT INTO test_data (${cols}) VALUES\n${vals};`
  }
  return JSON.stringify(records, null, 2)
}

function exportData(content: string, dataType: string, name: string) {
  const ext  = dataType === 'csv' ? 'csv' : dataType === 'sql' ? 'sql' : 'json'
  const mime = dataType === 'csv' ? 'text/csv' : dataType === 'sql' ? 'text/plain' : 'application/json'
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${name}.${ext}`
  a.click(); URL.revokeObjectURL(url)
}

const TestData = () => {
  const { t } = useLanguage()
  const [testData, setTestData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDataset, setEditDataset] = useState<any>(null)
  const [viewDataset, setViewDataset] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState<any>({ ...DEFAULT_FORM })

  const fetchTestData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/test_data_sets', { headers: hdrs() })
      if (res.ok) {
        const data = await res.json()
        setTestData(data.test_data_sets || [])
      }
    } catch (err) {
      console.error('TestData fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTestData() }, [fetchTestData])

  const openCreate = () => {
    setEditDataset(null)
    setFormData({ ...DEFAULT_FORM })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (dataset: any) => {
    setEditDataset(dataset)
    setFormData({
      name: dataset.name || '',
      description: dataset.description || '',
      data_type: dataset.data_type || 'json',
      version: dataset.version || '1.0.0',
      data_content: dataset.data_content || '',
      generation_method: dataset.generation_method || 'manual',
      records_count: String(dataset.records_count ?? 10),
      is_active: dataset.is_active ?? true,
      mask_sensitive: dataset.mask_sensitive ?? false,
      tags: dataset.tags || '',
    })
    setFormError('')
    setViewDataset(null)
    setShowModal(true)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData((prev: any) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }))
    }
    setFormError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Dataset name is required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const url = editDataset ? `/api/v1/test_data_sets/${editDataset.id}` : '/api/v1/test_data_sets'
      const method = editDataset ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: hdrs(),
        body: JSON.stringify({
          test_data_set: {
            name: formData.name,
            description: formData.description,
            data_type: formData.data_type,
            version: formData.version,
            data_content: formData.data_content,
            generation_method: formData.generation_method,
            records_count: parseInt(formData.records_count) || null,
            is_active: formData.is_active,
            mask_sensitive: formData.mask_sensitive,
            tags: formData.tags,
          }
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to save dataset')
        return
      }
      setShowModal(false)
      fetchTestData()
    } catch {
      setFormError('Failed to save dataset')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this dataset? This cannot be undone.')) return
    try {
      await fetch(`/api/v1/test_data_sets/${id}`, { method: 'DELETE', headers: hdrs() })
      setViewDataset(null)
      fetchTestData()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleGenerate = () => {
    const count = parseInt(formData.records_count) || 10
    const content = generateData(formData.data_type, count, formData.mask_sensitive)
    setFormData((prev: any) => ({ ...prev, data_content: content, generation_method: 'auto_generate' }))
  }

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const ext = file.name.split('.').pop()?.toLowerCase()
      const dataType = ext === 'csv' ? 'csv' : ext === 'sql' ? 'sql' : 'json'
      setFormData((prev: any) => ({
        ...prev,
        data_content: text,
        data_type: dataType,
        generation_method: `import_${dataType}`,
        name: prev.name || file.name.replace(/\.[^.]+$/, ''),
      }))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-transparent p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] dark:text-gray-100 mb-2">{t('testData.title')}</h1>
          <p className="text-[#64748B] dark:text-gray-400">{t('testData.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Dataset
        </button>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4 text-[#0F172A] dark:text-gray-100">Test Data Sets</h3>
        {loading ? (
          <BLoader />
        ) : testData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No datasets yet. Click "+ New Dataset" to create one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Dataset Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Records</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Last Updated</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {testData.map(dataset => (
                  <tr key={dataset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <td className="px-4 py-3 text-sm font-medium text-[#0F172A] dark:text-gray-100">{dataset.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 uppercase">{dataset.data_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{dataset.records_count ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        dataset.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {dataset.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(dataset.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button title="View" onClick={() => setViewDataset(dataset)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button title="Edit" onClick={() => openEdit(dataset)} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button title="Delete" onClick={() => handleDelete(dataset.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Dataset Modal */}
      {viewDataset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewDataset(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A] dark:text-gray-100">{viewDataset.name}</h2>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="uppercase text-gray-500 font-mono">{viewDataset.data_type}</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${viewDataset.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {viewDataset.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {viewDataset.version && <span className="text-gray-400">v{viewDataset.version}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {viewDataset.data_content && (
                  <button title="Export / Download" onClick={() => exportData(viewDataset.data_content, viewDataset.data_type, viewDataset.name)} className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                )}
                <button title="Close" onClick={() => setViewDataset(null)} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 text-sm">
              {viewDataset.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-gray-700 dark:text-gray-300">{viewDataset.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Generation Method</p>
                  <p className="text-gray-700 dark:text-gray-300">{viewDataset.generation_method || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Records Count</p>
                  <p className="text-gray-700 dark:text-gray-300">{viewDataset.records_count ?? '—'}</p>
                </div>
              </div>
              {viewDataset.data_content && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Data Content</p>
                    <div className="flex items-center gap-2">
                      {viewDataset.mask_sensitive && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">🔒 Masked PII</span>
                      )}
                    </div>
                  </div>
                  <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">{viewDataset.data_content}</pre>
                  <p className="text-xs text-gray-400 mt-1">{viewDataset.data_content.split('\n').length} lines</p>
                </div>
              )}
              {viewDataset.tags && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tags</p>
                  <p className="text-gray-500">{viewDataset.tags}</p>
                </div>
              )}
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                Created: {new Date(viewDataset.created_at).toLocaleString()} · Updated: {new Date(viewDataset.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-gray-100">
                {editDataset ? 'Edit Dataset' : 'Create Test Dataset'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{formError}</div>}

              <div>
                <label className="form-label">Dataset Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Enter dataset name" required />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Describe the dataset..." rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Data Type *</label>
                  <select name="data_type" value={formData.data_type} onChange={handleChange} className="form-select" required>
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="sql">SQL</option>
                    <option value="api">API Response</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Version</label>
                  <input type="text" name="version" value={formData.version} onChange={handleChange} className="form-input" placeholder="1.0.0" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label mb-0">Data Content</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleGenerate} className="btn btn-outline py-1 px-3 text-xs">
                      ⚡ Auto-Generate
                    </button>
                    <label className="btn btn-outline py-1 px-3 text-xs cursor-pointer">
                      📂 Import File
                      <input type="file" accept=".json,.csv,.sql,.txt" onChange={handleImportFile} className="hidden" />
                    </label>
                  </div>
                </div>
                <textarea name="data_content" value={formData.data_content} onChange={handleChange} className="form-textarea font-mono" placeholder="Paste JSON, CSV, or SQL — or use Auto-Generate / Import File above..." rows={6} />
                {formData.data_content && (
                  <p className="text-xs text-gray-400 mt-1">{formData.data_content.split('\n').length} lines · {formData.data_content.length} chars</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Generation Method</label>
                  <select name="generation_method" value={formData.generation_method} onChange={handleChange} className="form-select">
                    <option value="manual">Manual Entry</option>
                    <option value="import_csv">Import CSV</option>
                    <option value="import_json">Import JSON</option>
                    <option value="auto_generate">Auto-generate (Faker)</option>
                    <option value="api_import">API Import</option>
                    <option value="template">Use Template</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Number of Records</label>
                  <input type="number" name="records_count" value={formData.records_count} onChange={handleChange} className="form-input" placeholder="10" min="1" />
                </div>
              </div>

              <div>
                <label className="form-label">Tags</label>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="authentication, users, credentials" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4" />
                  <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active (Ready to use)</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="mask_sensitive" name="mask_sensitive" checked={formData.mask_sensitive} onChange={handleChange} className="w-4 h-4" />
                  <label htmlFor="mask_sensitive" className="text-sm text-gray-700 dark:text-gray-300">Mask Sensitive Data (PII)</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : editDataset ? 'Save Changes' : 'Create Dataset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestData
