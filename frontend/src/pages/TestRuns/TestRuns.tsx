import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  passed:  'bg-green-100 text-green-800',
  failed:  'bg-red-100 text-red-800',
}

const TestRuns = () => {
  const { t } = useLanguage()
  const { canCreate, canDelete } = usePermissions()
  const [showModal, setShowModal]       = useState(false)
  const [testRuns, setTestRuns]         = useState<any[]>([])
  const [testCases, setTestCases]       = useState<any[]>([])
  const [environments, setEnvironments] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [selectedIds, setSelectedIds]   = useState<number[]>([])
  const [showCompare, setShowCompare]   = useState(false)
  const [form, setForm] = useState({
    test_case_id:   '',
    environment_id: '',
    browser:        'Chrome',
    notes:          '',
  })

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this test run?')) return
    try {
      const res = await fetch(`/api/v1/test_runs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!res.ok) throw new Error('Failed to delete test run')
      setTestRuns(prev => prev.filter(r => r.id !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Delete failed'}`)
    }
  }

  const handleRerun = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/test_runs/${id}/rerun`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!res.ok) throw new Error('Failed to rerun')
      fetchAll()
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Rerun failed'}`)
    }
  }

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      const [runsRes, casesRes, envsRes] = await Promise.all([
        fetch('/api/v1/test_runs',    { headers }),
        fetch('/api/v1/test_cases',   { headers }),
        fetch('/api/v1/environments', { headers }),
      ])
      if (runsRes.ok)  { const d = await runsRes.json();  setTestRuns(Array.isArray(d) ? d : []) }
      if (casesRes.ok) {
        const d = await casesRes.json()
        setTestCases(d.test_cases || [])
      } else {
        console.error('test_cases fetch failed:', casesRes.status, casesRes.statusText)
      }
      if (envsRes.ok)  { const d = await envsRes.json();  setEnvironments(d.environments || []) }
    } catch (err) {
      console.error('TestRuns fetchAll error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' }
      const res = await fetch('/api/v1/test_runs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          test_run: {
            test_case_id:   form.test_case_id   || null,
            environment_id: form.environment_id || null,
            notes: 'Browser: ' + form.browser + (form.notes ? ' | ' + form.notes : ''),
          }
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.errors ? JSON.stringify(err.errors) : 'Failed to start test run')
      }
      setForm({ test_case_id: '', environment_id: '', browser: 'Chrome', notes: '' })
      setShowModal(false)
      fetchAll()
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Failed to start test run'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('testRuns.title')}</h1>
          <p className="text-gray-600">{t('testRuns.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length === 2 && (
            <button onClick={() => setShowCompare(true)} className="btn btn-outline">
              ⇄ Compare ({selectedIds.length})
            </button>
          )}
          {canCreate.testRuns && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <span>&#9654;</span> Start Test Run
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-4">
          Test Run History
          {!loading && <span className="text-sm font-normal text-gray-400 ml-2">({testRuns.length})</span>}
        </h3>

        {loading ? (
          <BLoader />
        ) : testRuns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {canCreate.testRuns ? 'No test runs yet. Click "Start Test Run" to begin.' : 'No test runs yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            {selectedIds.length > 0 && (
              <p className="text-xs text-gray-400 mb-2">
                {selectedIds.length === 1 ? 'Select one more run to compare.' : 'Click "Compare" to see side-by-side results.'}
              </p>
            )}
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-3 w-8"></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Run</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Project</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pass Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {testRuns.map(run => (
                  <tr key={run.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${selectedIds.includes(run.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(run.id)}
                        onChange={() => toggleSelect(run.id)}
                        disabled={!selectedIds.includes(run.id) && selectedIds.length === 2}
                        className="w-4 h-4 accent-indigo-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0F172A] dark:text-gray-100">{run.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{run.project}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={'px-2 py-0.5 rounded-full text-xs font-semibold ' + (statusColor[run.status] || 'bg-gray-100 text-gray-600')}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={'h-1.5 rounded-full ' + (run.passRate === '100%' ? 'bg-green-500' : run.passRate === '0%' ? 'bg-red-500' : 'bg-yellow-500')}
                            style={{ width: run.passRate }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{run.passRate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{run.duration}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{run.date}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {canCreate.testRuns && (
                          <button title="Rerun" onClick={() => handleRerun(run.id)}
                            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-xs font-medium">
                            ↻
                          </button>
                        )}
                        {canDelete.testRuns && (
                          <button title="Delete" onClick={() => handleDelete(run.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Start Test Run</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="form-label">Test Case</label>
                  <select
                    className="form-select"
                    value={form.test_case_id}
                    onChange={e => setForm(f => ({ ...f, test_case_id: e.target.value }))}
                  >
                    <option value="">All test cases (full suite)</option>
                    {testCases.map(tc => (
                      <option key={tc.id} value={tc.id}>{tc.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Environment</label>
                    <select
                      className="form-select"
                      value={form.environment_id}
                      onChange={e => setForm(f => ({ ...f, environment_id: e.target.value }))}
                    >
                      <option value="">Select environment</option>
                      {environments.length > 0 ? (
                        environments.map(env => (
                          <option key={env.id} value={env.id}>
                            {env.name} ({env.environment_type})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="production">Production</option>
                          <option value="staging">Staging</option>
                          <option value="development">Development</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Browser</label>
                    <select
                      className="form-select"
                      value={form.browser}
                      onChange={e => setForm(f => ({ ...f, browser: e.target.value }))}
                    >
                      <option>Chrome</option>
                      <option>Firefox</option>
                      <option>Safari</option>
                      <option>Edge</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Add any notes about this run..."
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Starting...' : 'Start Test Run'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && selectedIds.length === 2 && (() => {
        const [a, b] = selectedIds.map(id => testRuns.find(r => r.id === id))
        if (!a || !b) return null
        const rows: { label: string; keyA: string; keyB: string }[] = [
          { label: 'Status',    keyA: a.status,   keyB: b.status },
          { label: 'Pass Rate', keyA: a.passRate,  keyB: b.passRate },
          { label: 'Duration',  keyA: a.duration,  keyB: b.duration },
          { label: 'Project',   keyA: a.project,   keyB: b.project },
          { label: 'Date',      keyA: a.date,      keyB: b.date },
        ]
        return (
          <div className="modal-backdrop" onClick={() => setShowCompare(false)}>
            <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Test Run Comparison</h2>
                <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowCompare(false)}>×</button>
              </div>
              <div className="modal-body">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 text-left text-gray-500 w-28">Field</th>
                      <th className="py-2 text-left text-indigo-600 truncate max-w-[180px]">{a.name}</th>
                      <th className="py-2 text-left text-purple-600 truncate max-w-[180px]">{b.name}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.map(row => {
                      const diff = row.keyA !== row.keyB
                      return (
                        <tr key={row.label} className={diff ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                          <td className="py-2 text-gray-500 font-medium">{row.label}</td>
                          <td className="py-2 font-semibold text-indigo-700 dark:text-indigo-300">{row.keyA || '—'}</td>
                          <td className="py-2 font-semibold text-purple-700 dark:text-purple-300">{row.keyB || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-3">Highlighted rows indicate differences between runs.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => { setShowCompare(false); setSelectedIds([]) }}>Clear Selection</button>
                <button className="btn btn-primary" onClick={() => setShowCompare(false)}>Close</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default TestRuns
