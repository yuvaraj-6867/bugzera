import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

interface TestCase {
  id: number
  title: string
  status: string
  priority: string
  execution_order?: number
  test_case_number?: string
}

interface TestPlan {
  id: number
  test_plan_number: string
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  test_cases_count: number
  passed_count: number
  failed_count: number
  progress_percentage: number
  created_by: string
  created_at: string
  test_cases?: TestCase[]
}

const TestPlans = () => {
  const { t } = useLanguage()
  const { canCreate, canEdit, canDelete } = usePermissions()
  const [showModal, setShowModal] = useState(false)
  const [showAddTestCaseModal, setShowAddTestCaseModal] = useState(false)
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([])
  const [selectedTestPlan, setSelectedTestPlan] = useState<TestPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft',
    start_date: '',
    end_date: ''
  })

  const fetchTestPlans = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/test_plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch test plans')

      const data = await response.json()
      setTestPlans(data.test_plans || [])
    } catch (error) {
      console.error('Error fetching test plans:', error)
      setTestPlans([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllTestCases = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/test_cases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch test cases')

      const data = await response.json()
      setAllTestCases(data.test_cases || [])
    } catch (error) {
      console.error('Error fetching test cases:', error)
      setAllTestCases([])
    }
  }, [])

  useEffect(() => {
    fetchTestPlans()
    fetchAllTestCases()
  }, [fetchTestPlans, fetchAllTestCases])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/v1/test_plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ test_plan: formData })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create test plan')
      }

      const result = await response.json()
      alert(`✅ Test Plan "${result.test_plan.name}" created successfully!`)
      setFormData({
        name: '',
        description: '',
        status: 'draft',
        start_date: '',
        end_date: ''
      })
      setShowModal(false)
      fetchTestPlans()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create test plan'}`)
    }
  }

  const handleDeletePlan = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this test plan?')) return
    try {
      const res = await fetch(`/api/v1/test_plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!res.ok) throw new Error('Failed to delete test plan')
      setTestPlans(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Delete failed'}`)
    }
  }

  const viewTestPlan = async (testPlan: TestPlan) => {
    try {
      const response = await fetch(`/api/v1/test_plans/${testPlan.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch test plan details')

      const data = await response.json()
      setSelectedTestPlan(data.test_plan)
      setShowAddTestCaseModal(false)
    } catch (error) {
      console.error('Error fetching test plan details:', error)
    }
  }

  const addTestCaseToPlan = async (testCaseId: number) => {
    if (!selectedTestPlan) return

    try {
      const response = await fetch(`/api/v1/test_plans/${selectedTestPlan.id}/add_test_case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ test_case_id: testCaseId })
      })

      if (!response.ok) throw new Error('Failed to add test case')

      const data = await response.json()
      setSelectedTestPlan(data.test_plan)
      setShowAddTestCaseModal(false)
      fetchTestPlans()
      alert('✅ Test case added to plan!')
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to add test case'}`)
    }
  }

  const removeTestCase = async (testCaseId: number) => {
    if (!selectedTestPlan) return

    if (!confirm('Remove this test case from the plan?')) return

    try {
      const response = await fetch(
        `/api/v1/test_plans/${selectedTestPlan.id}/remove_test_case/${testCaseId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to remove test case')

      const data = await response.json()
      setSelectedTestPlan(data.test_plan)
      fetchTestPlans()
      alert('✅ Test case removed from plan!')
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to remove test case'}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">{t('testPlans.title')}</h1>
            {!loading && testPlans.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-blue-600 text-white">
                {testPlans.length} {testPlans.length === 1 ? 'Plan' : 'Plans'}
              </span>
            )}
          </div>
          <p className="text-gray-600">{t('testPlans.subtitle')}</p>
        </div>
        {canCreate.testPlans && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <span>+</span> New Test Plan
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && <BLoader />}

      {/* Empty State */}
      {!loading && testPlans.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No test plans yet</p>
          {canCreate.testPlans && <p className="text-gray-400 text-sm">Create your first test plan to organize test cases!</p>}
        </div>
      )}

      {/* Test Plans Grid */}
      {!loading && testPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {testPlans.map((plan) => (
            <div
              key={plan.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => viewTestPlan(plan)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-teal-600 text-white mr-2">
                    {plan.test_plan_number || `TP-${String(plan.id).padStart(2, '0')}`}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{plan.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    plan.status === 'active' ? 'bg-green-100 text-green-800' :
                    plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.status}
                  </span>
                  {canDelete.testPlans && (
                    <button title="Delete" onClick={(e) => handleDeletePlan(plan.id, e)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{plan.description || 'No description'}</p>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{plan.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full"
                    style={{ width: `${plan.progress_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-bold text-gray-900">{plan.test_cases_count}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <div className="font-bold text-green-600">{plan.passed_count}</div>
                  <div className="text-xs text-gray-500">Passed</div>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <div className="font-bold text-red-600">{plan.failed_count}</div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                Created by {plan.created_by || 'Unknown'} • {new Date(plan.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Plan Details Modal */}
      {selectedTestPlan && (
        <div className="modal-backdrop" onClick={() => setSelectedTestPlan(null)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-teal-600 text-white">
                    {selectedTestPlan.test_plan_number || `TP-${String(selectedTestPlan.id).padStart(2, '0')}`}
                  </span>
                  <h2 className="modal-title">{selectedTestPlan.name}</h2>
                </div>
                <p className="text-sm text-gray-500">{selectedTestPlan.description}</p>
              </div>
              <button onClick={() => setSelectedTestPlan(null)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              {canEdit.testPlans && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowAddTestCaseModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    + Add Test Case
                  </button>
                </div>
              )}

              {/* Test Cases List */}
              {selectedTestPlan.test_cases && selectedTestPlan.test_cases.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Test Case</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Priority</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTestPlan.test_cases.map((tc, index) => (
                        <tr key={tc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {tc.test_case_number || `TC-${String(tc.id).padStart(3, '0')}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{tc.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tc.priority === 'high' ? 'bg-red-100 text-red-800' :
                              tc.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {tc.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tc.status === 'passed' ? 'bg-green-100 text-green-800' :
                              tc.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {tc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {canEdit.testPlans && (
                              <button title="Remove" onClick={() => removeTestCase(tc.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded">
                  <p className="text-gray-500">No test cases added yet</p>
                  <button
                    onClick={() => setShowAddTestCaseModal(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Add your first test case
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Test Case Modal */}
      {showAddTestCaseModal && selectedTestPlan && (
        <div className="modal-backdrop" onClick={() => setShowAddTestCaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Test Case to Plan</h2>
              <button onClick={() => setShowAddTestCaseModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body max-h-96 overflow-y-auto">
              {allTestCases.filter(tc =>
                !selectedTestPlan.test_cases?.some(existing => existing.id === tc.id)
              ).map(testCase => (
                <div
                  key={testCase.id}
                  className="p-3 border rounded mb-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  onClick={() => addTestCaseToPlan(testCase.id)}
                >
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white mr-2">
                      TC-{String(testCase.id).padStart(3, '0')}
                    </span>
                    <span className="font-medium">{testCase.title}</span>
                  </div>
                  <button className="btn btn-primary btn-sm">Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Test Plan Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Test Plan</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Plan Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g., Sprint 1 Test Plan"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="form-textarea"
                      placeholder="Describe this test plan..."
                      rows={3}
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        className="form-input"
                        min={formData.start_date || undefined}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Test Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestPlans
