import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'

const TestCases = () => {
  const [showModal, setShowModal] = useState(false)
  const [testCases, setTestCases] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    testType: 'functional',
    preconditions: '',
    testSteps: '',
    expectedResults: '',
    testData: '',
    postConditions: '',
    assignedTo: '',
    automationStatus: 'not_automated',
    estimatedDuration: '',
    tags: ''
  })

  const fetchTestCases = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/api/v1/test_cases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch test cases')
      }

      const data = await response.json()
      setTestCases(data.test_cases || [])
    } catch (error) {
      console.error('Error fetching test cases:', error)
      setTestCases([])
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

  useEffect(() => {
    fetchTestCases()
    fetchUsers()
  }, [fetchTestCases, fetchUsers])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:3000/api/v1/test_cases', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          test_case: {
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            test_type: formData.testType,
            preconditions: formData.preconditions,
            test_steps: formData.testSteps,
            expected_results: formData.expectedResults,
            test_data: formData.testData,
            post_conditions: formData.postConditions,
            assigned_user: formData.assignedTo || null,
            automation_status: formData.automationStatus,
            estimated_duration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
            tags: formData.tags
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create test case')
      }

      const result = await response.json()
      const testCaseNumber = result.test_case?.id ? `TC-${String(result.test_case.id).padStart(3, '0')}` : 'TC-XXX'
      alert(`✅ Test case ${testCaseNumber} created successfully and saved to database!`)
      setFormData({
        title: '',
        description: '',
        status: 'draft',
        priority: 'medium',
        testType: 'functional',
        preconditions: '',
        testSteps: '',
        expectedResults: '',
        testData: '',
        postConditions: '',
        assignedTo: '',
        automationStatus: 'not_automated',
        estimatedDuration: '',
        tags: ''
      })
      setShowModal(false)
      fetchTestCases()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create test case'}`)
      console.error('Error creating test case:', error)
    }
  }

  const viewTestCase = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/test_cases/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch test case')
      }
      const data = await response.json()
      setSelectedTestCase(data.test_case || data)
      setEditMode(false)
    } catch (error) {
      console.error('Error fetching test case:', error)
      alert('Failed to load test case details')
    }
  }

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleEditSave = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/test_cases/${selectedTestCase.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          test_case: {
            title: editFormData.title,
            description: editFormData.description,
            status: editFormData.status,
            priority: editFormData.priority,
            test_type: editFormData.test_type,
            preconditions: editFormData.preconditions,
            test_steps: editFormData.test_steps,
            expected_results: editFormData.expected_results,
            test_data: editFormData.test_data,
            post_conditions: editFormData.post_conditions,
            automation_status: editFormData.automation_status,
            estimated_duration: editFormData.estimated_duration ? parseInt(editFormData.estimated_duration) : null,
            tags: editFormData.tags
          }
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update test case')
      }
      const data = await response.json()
      setSelectedTestCase(data.test_case || data)
      setEditMode(false)
      fetchTestCases()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to update test case'}`)
      console.error('Error updating test case:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this test case?')) return
    try {
      const response = await fetch(`http://localhost:3000/api/v1/test_cases/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to delete test case')
      }
      setSelectedTestCase(null)
      setEditMode(false)
      fetchTestCases()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete test case'}`)
      console.error('Error deleting test case:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Test Cases</h1>
            {!loading && testCases.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                {testCases.length} {testCases.length === 1 ? 'Case' : 'Cases'}
              </span>
            )}
          </div>
          <p className="text-gray-600">Create and manage test cases with unique identifiers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <span>+</span> New Test Case
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading test cases...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && testCases.length === 0 && (
        <div className="card text-center py-12">
          <div className="mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              TC-001
            </span>
          </div>
          <p className="text-gray-500 text-lg mb-2">No test cases yet</p>
          <p className="text-gray-400 text-sm">Create your first test case to get started!</p>
        </div>
      )}

      {/* Test Cases List */}
      {!loading && testCases.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Test Cases ({testCases.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Case #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testCases.map((testCase) => (
                  <tr key={testCase.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewTestCase(testCase.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          TC-{String(testCase.id).padStart(3, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{testCase.title}</div>
                      {testCase.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">{testCase.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        testCase.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        testCase.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {testCase.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        testCase.status === 'active' ? 'bg-green-100 text-green-800' :
                        testCase.status === 'passed' ? 'bg-blue-100 text-blue-800' :
                        testCase.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {testCase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {testCase.assigned_user || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(testCase.created_at).toLocaleDateString()}
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
              <h2 className="modal-title">Create Test Case</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div>
                  <label className="form-label">Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" placeholder="Enter test case title" required />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="form-textarea" placeholder="Describe the test case..." rows={2}></textarea>
                </div>

                {/* Classification */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
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
                    <label className="form-label">Test Type</label>
                    <select name="testType" value={formData.testType} onChange={handleChange} className="form-select">
                      <option value="functional">Functional</option>
                      <option value="regression">Regression</option>
                      <option value="smoke">Smoke</option>
                      <option value="integration">Integration</option>
                      <option value="e2e">E2E</option>
                    </select>
                  </div>
                </div>

                {/* Test Details */}
                <div>
                  <label className="form-label">Preconditions</label>
                  <textarea name="preconditions" value={formData.preconditions} onChange={handleChange} className="form-textarea" placeholder="Setup required before test..." rows={2}></textarea>
                </div>
                <div>
                  <label className="form-label">Test Steps *</label>
                  <textarea name="testSteps" value={formData.testSteps} onChange={handleChange} className="form-textarea" placeholder="1. Step one&#10;2. Step two&#10;3. Step three" rows={4} required></textarea>
                </div>
                <div>
                  <label className="form-label">Expected Results *</label>
                  <textarea name="expectedResults" value={formData.expectedResults} onChange={handleChange} className="form-textarea" placeholder="Expected outcomes..." rows={3} required></textarea>
                </div>
                <div>
                  <label className="form-label">Test Data</label>
                  <textarea name="testData" value={formData.testData} onChange={handleChange} className="form-textarea" placeholder="Test data required..." rows={2}></textarea>
                </div>
                <div>
                  <label className="form-label">Post Conditions</label>
                  <textarea name="postConditions" value={formData.postConditions} onChange={handleChange} className="form-textarea" placeholder="Cleanup actions..." rows={2}></textarea>
                </div>

                {/* Assignment & Automation */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Assign To</label>
                    <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="form-select">
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Automation Status</label>
                    <select name="automationStatus" value={formData.automationStatus} onChange={handleChange} className="form-select">
                      <option value="not_automated">Not Automated</option>
                      <option value="in_progress">In Progress</option>
                      <option value="automated">Automated</option>
                    </select>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Estimated Duration (min)</label>
                    <input type="number" name="estimatedDuration" value={formData.estimatedDuration} onChange={handleChange} className="form-input" placeholder="30" />
                  </div>
                  <div>
                    <label className="form-label">Tags</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="login, auth, critical" />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Create Test Case</button>
            </div>
          </div>
        </div>
      )}

      {selectedTestCase && (
        <div className="modal-backdrop" onClick={() => { setSelectedTestCase(null); setEditMode(false) }}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  TC-{String(selectedTestCase.id).padStart(3, '0')}
                </span>
                <h2 className="modal-title">{selectedTestCase.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <>
                    <button
                      className="btn btn-outline text-sm"
                      onClick={() => {
                        setEditFormData({
                          title: selectedTestCase.title || '',
                          description: selectedTestCase.description || '',
                          status: selectedTestCase.status || 'draft',
                          priority: selectedTestCase.priority || 'medium',
                          test_type: selectedTestCase.test_type || 'functional',
                          preconditions: selectedTestCase.preconditions || '',
                          test_steps: selectedTestCase.test_steps || '',
                          expected_results: selectedTestCase.expected_results || '',
                          test_data: selectedTestCase.test_data || '',
                          post_conditions: selectedTestCase.post_conditions || '',
                          assigned_user: selectedTestCase.assigned_user || '',
                          automation_status: selectedTestCase.automation_status || 'not_automated',
                          estimated_duration: selectedTestCase.estimated_duration || '',
                          tags: selectedTestCase.tags || ''
                        })
                        setEditMode(true)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn text-sm bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleDelete(selectedTestCase.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  onClick={() => { setSelectedTestCase(null); setEditMode(false) }}
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="modal-body">
              {!editMode ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="form-label text-gray-500">Title</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.title || '-'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Status</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.status || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label text-gray-500">Description</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTestCase.description || '-'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Priority</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.priority || '-'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Test Type</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.test_type || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label text-gray-500">Preconditions</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTestCase.preconditions || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label text-gray-500">Test Steps</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTestCase.test_steps || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label text-gray-500">Expected Results</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTestCase.expected_results || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label text-gray-500">Test Data</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTestCase.test_data || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label text-gray-500">Post Conditions</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTestCase.post_conditions || '-'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Assigned User</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.assigned_user || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Automation Status</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.automation_status || '-'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Estimated Duration</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.estimated_duration ? `${selectedTestCase.estimated_duration} min` : '-'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Tags</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.tags || '-'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Created At</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.created_at ? new Date(selectedTestCase.created_at).toLocaleString() : '-'}</p>
                  </div>
                  <div>
                    <label className="form-label text-gray-500">Updated At</label>
                    <p className="text-sm text-gray-900">{selectedTestCase.updated_at ? new Date(selectedTestCase.updated_at).toLocaleString() : '-'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Title</label>
                    <input type="text" name="title" value={editFormData.title} onChange={handleEditChange} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <textarea name="description" value={editFormData.description} onChange={handleEditChange} className="form-textarea" rows={3}></textarea>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Status</label>
                      <select name="status" value={editFormData.status} onChange={handleEditChange} className="form-select">
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Priority</label>
                      <select name="priority" value={editFormData.priority} onChange={handleEditChange} className="form-select">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Test Type</label>
                      <select name="test_type" value={editFormData.test_type} onChange={handleEditChange} className="form-select">
                        <option value="functional">Functional</option>
                        <option value="regression">Regression</option>
                        <option value="smoke">Smoke</option>
                        <option value="integration">Integration</option>
                        <option value="e2e">E2E</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Preconditions</label>
                    <textarea name="preconditions" value={editFormData.preconditions} onChange={handleEditChange} className="form-textarea" rows={2}></textarea>
                  </div>
                  <div>
                    <label className="form-label">Test Steps</label>
                    <textarea name="test_steps" value={editFormData.test_steps} onChange={handleEditChange} className="form-textarea" rows={4}></textarea>
                  </div>
                  <div>
                    <label className="form-label">Expected Results</label>
                    <textarea name="expected_results" value={editFormData.expected_results} onChange={handleEditChange} className="form-textarea" rows={3}></textarea>
                  </div>
                  <div>
                    <label className="form-label">Test Data</label>
                    <textarea name="test_data" value={editFormData.test_data} onChange={handleEditChange} className="form-textarea" rows={2}></textarea>
                  </div>
                  <div>
                    <label className="form-label">Post Conditions</label>
                    <textarea name="post_conditions" value={editFormData.post_conditions} onChange={handleEditChange} className="form-textarea" rows={2}></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Assigned User</label>
                      <input type="text" name="assigned_user" value={editFormData.assigned_user} onChange={handleEditChange} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Automation Status</label>
                      <select name="automation_status" value={editFormData.automation_status} onChange={handleEditChange} className="form-select">
                        <option value="not_automated">Not Automated</option>
                        <option value="in_progress">In Progress</option>
                        <option value="automated">Automated</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Estimated Duration (min)</label>
                      <input type="number" name="estimated_duration" value={editFormData.estimated_duration} onChange={handleEditChange} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Tags</label>
                      <input type="text" name="tags" value={editFormData.tags} onChange={handleEditChange} className="form-input" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {editMode && (
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleEditSave}>Save Changes</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TestCases
