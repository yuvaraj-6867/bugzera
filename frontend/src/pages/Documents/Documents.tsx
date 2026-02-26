import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { useLanguage } from '../../contexts/LanguageContext'
import { T } from '../../components/AutoTranslate'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const APPROVAL_BADGE: Record<string, string> = {
  draft:       'bg-gray-100 text-gray-600',
  in_review:   'bg-yellow-100 text-yellow-700',
  approved:    'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-600',
}

const Documents = () => {
  const { t } = useLanguage()
  const { canCreate, canDelete, isAdminOrManager } = usePermissions()
  const [showModal, setShowModal] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null)
  const [excelData, setExcelData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
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
      const response = await fetch('/api/v1/documents', {
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

      const response = await fetch('/api/v1/documents', {
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
      const response = await fetch(`/api/v1/documents/${documentId}/download`, {
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

  const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(name)
  const isVideoFile = (name: string) => /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(name)
  const isPdfFile = (name: string) => /\.pdf$/i.test(name)
  const isExcelFile = (name: string) => /\.(xlsx|xls|csv)$/i.test(name)

  const getFileType = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    if (isImageFile(name)) return { label: 'Image', color: 'bg-purple-100 text-purple-800' }
    if (isVideoFile(name)) return { label: 'Video', color: 'bg-pink-100 text-pink-800' }
    if (isPdfFile(name)) return { label: 'PDF', color: 'bg-red-100 text-red-800' }
    if (isExcelFile(name)) return { label: ext.toUpperCase(), color: 'bg-green-100 text-green-800' }
    if (/\.(doc|docx)$/i.test(name)) return { label: 'DOC', color: 'bg-blue-100 text-blue-800' }
    if (/\.(ppt|pptx)$/i.test(name)) return { label: 'PPT', color: 'bg-orange-100 text-orange-800' }
    if (/\.(txt|md)$/i.test(name)) return { label: 'TXT', color: 'bg-gray-100 text-gray-800' }
    if (/\.(zip|rar|7z|tar|gz)$/i.test(name)) return { label: 'Archive', color: 'bg-yellow-100 text-yellow-800' }
    return { label: ext.toUpperCase() || 'File', color: 'bg-gray-100 text-gray-800' }
  }

  const handleApproval = async (documentId: number, action: 'approve' | 'reject' | 'in_review') => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}`, 'Content-Type': 'application/json' }
    if (action === 'in_review') {
      await fetch(`/api/v1/documents/${documentId}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ document: { approval_status: 'in_review' } })
      })
    } else {
      await fetch(`/api/v1/documents/${documentId}/${action}`, { method: 'POST', headers })
    }
    fetchDocuments()
  }

  const handleDelete = async (documentId: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      const response = await fetch(`/api/v1/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (!response.ok) throw new Error('Failed to delete document')
      fetchDocuments()
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to delete document'}`)
    }
  }

  const openPreview = async (url: string, name: string) => {
    const type = isImageFile(name) ? 'image' : isVideoFile(name) ? 'video' : isPdfFile(name) ? 'pdf' : isExcelFile(name) ? 'excel' : 'other'
    setExcelData(null)
    setPreviewFile({ url, name, type })
    if (type === 'excel') {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
        if (jsonData.length > 0) {
          const headers = (jsonData[0] as string[]).map(h => String(h ?? ''))
          const rows = jsonData.slice(1).map(row => (row as string[]).map(cell => String(cell ?? '')))
          setExcelData({ headers, rows })
        }
      } catch (error) {
        console.error('Error parsing Excel:', error)
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('documents.title')}</h1>
          <p className="text-gray-600">{t('documents.subtitle')}</p>
        </div>
        {canCreate.documents && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <span>+</span> Upload Document
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && <BLoader />}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">{canCreate.documents ? 'No documents yet. Upload your first document!' : 'No documents yet.'}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => {
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900"><T>{doc.title}</T></div>
                          {doc.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md"><T>{doc.description}</T></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {doc.tags?.map((tag: string, index: number) => (
                            <span key={index} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {tag}
                            </span>
                          )) || <span className="text-sm text-gray-400">-</span>}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${APPROVAL_BADGE[doc.approval_status || 'draft']}`}>
                          {(doc.approval_status || 'draft').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button title="View" onClick={() => openPreview(`http://localhost:3000${doc.file_url}`, doc.title)} className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          {/* Download */}
                          <button title="Download" onClick={() => handleDownload(doc.id, doc.title)} className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                          {/* Submit for review */}
                          {doc.approval_status === 'draft' && (
                            <button title="Submit for Review" onClick={() => handleApproval(doc.id, 'in_review')} className="p-1.5 rounded text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </button>
                          )}
                          {/* Approve */}
                          {doc.approval_status === 'in_review' && isAdminOrManager && (
                            <button title="Approve" onClick={() => handleApproval(doc.id, 'approve')} className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          {/* Reject */}
                          {doc.approval_status === 'in_review' && isAdminOrManager && (
                            <button title="Reject" onClick={() => handleApproval(doc.id, 'reject')} className="p-1.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                          {/* Delete */}
                          {canDelete.documents && (
                            <button title="Delete" onClick={() => handleDelete(doc.id, doc.title)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                <p className="text-gray-500 text-sm mb-4">Preview not available for this file type</p>
                <a href={previewFile.url} download={previewFile.name} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm">Download File</a>
              </div>
            )}
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
