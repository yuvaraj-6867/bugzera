import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'

const Documents = () => {
  const [showModal, setShowModal] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentType: 'SRS',
    tags: 'SRS',
    version: '1.0'
  })

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3000/api/v1/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Auto-update tags when document type changes
    if (name === 'documentType') {
      setFormData(prev => ({ ...prev, tags: value }))
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title with filename if not set
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name }))
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', selectedFile)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('tag_list', formData.tags)

      const response = await fetch('http://localhost:3000/api/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formDataToSend
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload document')
      }

      alert('✅ Document uploaded successfully!')
      setFormData({
        title: '',
        description: '',
        documentType: 'SRS',
        tags: 'SRS',
        version: '1.0'
      })
      setSelectedFile(null)
      setShowModal(false)
      fetchDocuments()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to upload document'}`)
      console.error('Error uploading document:', error)
    }
  }

  const handleDownload = async (documentId: number, title: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = title
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to download document'}`)
      console.error('Error downloading document:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">Store and manage documentation (SRS, Test Plans, Reports, etc.)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <span>+</span> Upload Document
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading documents...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No documents yet. Upload your first document!</p>
        </div>
      )}

      {/* Documents Table */}
      {!loading && documents.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Documents ({documents.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                      {doc.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">{doc.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags?.map((tag: string, index: number) => (
                          <span key={index} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.file_size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.uploaded_by}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      v{doc.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDownload(doc.id, doc.title)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Download
                      </button>
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
              <h2 className="modal-title">Upload Document</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* File Upload */}
                <div>
                  <label className="form-label">Select File *</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="form-input"
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500 mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter document title"
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
                    placeholder="Brief description of the document..."
                    rows={3}
                  ></textarea>
                </div>

                {/* Document Type */}
                <div>
                  <label className="form-label">Document Type *</label>
                  <select
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="SRS">SRS (Software Requirements Specification)</option>
                    <option value="Test Plan">Test Plan</option>
                    <option value="Test Case">Test Case Document</option>
                    <option value="Test Report">Test Report</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="API Documentation">API Documentation</option>
                    <option value="User Guide">User Guide</option>
                    <option value="Technical Specification">Technical Specification</option>
                    <option value="Meeting Notes">Meeting Notes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Comma-separated tags (e.g., SRS, Requirements, v2.0)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Upload Document</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Documents
