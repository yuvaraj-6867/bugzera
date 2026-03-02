import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import ConfirmDialog from '../ConfirmDialog'

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#FAFBFC] dark:bg-[#0F172A]">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-end items-center px-8 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <NotificationBell />
        </div>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog />
    </div>
  )
}

export default MainLayout
