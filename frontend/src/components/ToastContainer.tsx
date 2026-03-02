import { useState, useEffect } from 'react'
import { toast, type Toast } from '../utils/toast'

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => toast.subscribe(setToasts), [])
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm animate-fade-in ${
            t.type === 'success' ? 'bg-green-600' :
            t.type === 'error'   ? 'bg-red-600'   : 'bg-gray-700'
          }`}
        >
          {t.type === 'success' ? '✅ ' : t.type === 'error' ? '❌ ' : 'ℹ️ '}
          {t.message}
        </div>
      ))}
    </div>
  )
}
