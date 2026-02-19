import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#FAFBFC] dark:bg-[#0F172A]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
