import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

const TestData = () => {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)

  // TODO: Fetch from backend API
  const testData: any[] = []

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">{t('testData.title')}</h1>
          <p className="text-[#64748B]">{t('testData.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Dataset
        </button>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4">Test Data Sets</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Dataset Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Records</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Last Updated</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {testData.map(data => (
                <tr key={data.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{data.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{data.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{data.records}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{data.lastUpdated}</td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-accent-neon hover:underline mr-3">View</button>
                    <button className="text-accent-neon hover:underline">Export</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Test Dataset</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="form-label">Dataset Name *</label>
                  <input type="text" className="form-input" placeholder="Enter dataset name" required />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" placeholder="Describe the dataset..." rows={2}></textarea>
                </div>

                {/* Environment */}
                <div>
                  <label className="form-label">Environment</label>
                  <select className="form-select">
                    <option value="">Select environment</option>
                    <option value="1">Development</option>
                    <option value="2">Staging</option>
                    <option value="3">Production</option>
                  </select>
                </div>

                {/* Data Type & Format */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Data Type *</label>
                    <select className="form-select" required>
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="sql">SQL</option>
                      <option value="api">API Response</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Version</label>
                    <input type="text" className="form-input" placeholder="1.0.0" defaultValue="1.0.0" />
                  </div>
                </div>

                {/* Data Content */}
                <div>
                  <label className="form-label">Data Content</label>
                  <textarea className="form-textarea font-mono" placeholder="Paste JSON, CSV, or SQL data..." rows={6}></textarea>
                </div>

                {/* Generation Options */}
                <div>
                  <label className="form-label">Generation Method</label>
                  <select className="form-select">
                    <option value="manual">Manual Entry</option>
                    <option value="import_csv">Import CSV</option>
                    <option value="import_json">Import JSON</option>
                    <option value="auto_generate">Auto-generate (Faker)</option>
                    <option value="api_import">API Import</option>
                    <option value="template">Use Template</option>
                  </select>
                </div>

                {/* Template Selection (if using template) */}
                <div>
                  <label className="form-label">Template (Optional)</label>
                  <select className="form-select">
                    <option value="">No template</option>
                    <option value="1">User Credentials Template</option>
                    <option value="2">Product Catalog Template</option>
                    <option value="3">Payment Info Template</option>
                  </select>
                </div>

                {/* Auto-generate Settings */}
                <div>
                  <label className="form-label">Number of Records (if auto-generating)</label>
                  <input type="number" className="form-input" placeholder="10" defaultValue="10" />
                </div>

                {/* Data Privacy */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="is-active" defaultChecked className="w-4 h-4" />
                    <label htmlFor="is-active" className="text-sm text-gray-700">Active (Ready to use)</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="is-masked" className="w-4 h-4" />
                    <label htmlFor="is-masked" className="text-sm text-gray-700">Mask Sensitive Data (PII)</label>
                  </div>
                </div>

                {/* File Upload Option */}
                <div>
                  <label className="form-label">Import File (Optional)</label>
                  <input type="file" className="form-input" accept=".json,.csv,.sql" />
                  <p className="text-xs text-gray-500 mt-1">Supported formats: JSON, CSV, SQL</p>
                </div>

                {/* Data Schema (for JSON) */}
                <div>
                  <label className="form-label">Data Schema (JSON only)</label>
                  <textarea className="form-textarea font-mono" placeholder='{"name": "string", "email": "string", "age": "integer"}' rows={4}></textarea>
                  <p className="text-xs text-gray-500 mt-1">Define the expected structure for validation</p>
                </div>

                {/* Tags */}
                <div>
                  <label className="form-label">Tags</label>
                  <input type="text" className="form-input" placeholder="authentication, users, credentials" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary">Create Dataset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestData
