import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

const Analytics = () => {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">{t('analytics.title')}</h1>
          <p className="text-[#64748B]">{t('analytics.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Report
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Test Pass Rate" value="87.5%" trend="+5.2%" />
        <MetricCard title="Bug Resolution" value="92.3%" trend="+3.1%" />
        <MetricCard title="Avg Execution Time" value="4.2m" trend="-1.5%" />
        <MetricCard title="Test Coverage" value="76.8%" trend="+8.3%" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Test Execution Trends</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-400">Chart Visualization</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Bug Status Distribution</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-400">Chart Visualization</p>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Saved Reports</h3>
        <ReportsTable />
      </div>

      {/* New Report Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Report</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                <div>
                  <label className="form-label">Report Name</label>
                  <input type="text" className="form-input" placeholder="Enter report name" />
                </div>
                <div>
                  <label className="form-label">Report Type</label>
                  <select className="form-select">
                    <option>Test Execution Summary</option>
                    <option>Bug Analysis</option>
                    <option>Performance Metrics</option>
                    <option>Team Productivity</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Time Period</label>
                  <select className="form-select">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                    <option>Custom range</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Format</label>
                  <select className="form-select">
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary">Generate Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MetricCard = ({ title, value, trend }: { title: string; value: string; trend: string }) => {
  const isPositive = trend.startsWith('+')
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-[#0F172A] mb-2">{value}</p>
      <p className={`text-sm ${isPositive ? 'text-status-success' : 'text-status-error'}`}>{trend} from last period</p>
    </div>
  )
}

const ReportsTable = () => {
  const reports = [
    { id: 1, name: 'Weekly Test Summary', type: 'Test Execution', lastRun: '2026-02-12', status: 'Completed' },
    { id: 2, name: 'Bug Analysis Report', type: 'Bug Analysis', lastRun: '2026-02-11', status: 'Completed' },
    { id: 3, name: 'Team Performance', type: 'Team Productivity', lastRun: '2026-02-10', status: 'Scheduled' },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Report Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Last Run</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {reports.map(report => (
            <tr key={report.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{report.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{report.type}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{report.lastRun}</td>
              <td className="px-4 py-3">
                <span className={`badge ${report.status === 'Completed' ? 'badge-success' : 'badge-info'}`}>
                  {report.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <button className="text-accent-neon hover:underline mr-3">View</button>
                <button className="text-accent-neon hover:underline">Download</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Analytics
