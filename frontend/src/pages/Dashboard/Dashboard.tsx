import { useLanguage } from '../../contexts/LanguageContext'

const Dashboard = () => {
  const { t } = useLanguage()
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
        <p className="text-gray-600">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Projects</h3>
          <p className="text-3xl font-bold text-gray-900">12</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Test Cases</h3>
          <p className="text-3xl font-bold text-gray-900">348</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Test Runs</h3>
          <p className="text-3xl font-bold text-gray-900">1,247</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Open Tickets</h3>
          <p className="text-3xl font-bold text-gray-900">23</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Recent Test Runs</h3>
          <p className="text-gray-500">No recent test runs</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <p className="text-gray-500">No recent activity</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
