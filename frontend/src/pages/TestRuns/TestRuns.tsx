import { useState, useEffect, useCallback } from 'react'

const TestRuns = () => {
  const [showModal, setShowModal] = useState(false)
  const [testCases, setTestCases] = useState<any[]>([])

  const fetchTestCases = useCallback(async () => {
    try {
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
    }
  }, [])

  useEffect(() => {
    fetchTestCases()
  }, [fetchTestCases])

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Test Runs</h1>
          <p className="text-gray-600">Execute and monitor test runs</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <span>▶</span> Start Test Run
        </button>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-4">Test Run History</h3>
        <p className="text-gray-500">No test runs yet.</p>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Start Test Run</h2>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="form-label">Test Case <span className="text-red-500">*</span></label>
                  <select className="form-select">
                    <option value="">Select test case</option>
                    {testCases.map(testCase => (
                      <option key={testCase.id} value={testCase.id}>
                        {testCase.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Environment</label>
                    <select className="form-select">
                      <option>Production</option>
                      <option>Staging</option>
                      <option>Development</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Browser</label>
                    <input type="text" className="form-input" placeholder="e.g., Chrome" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" placeholder="Add any notes..." rows={3}></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary">Start Test Run</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestRuns
