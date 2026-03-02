import { useState, useEffect } from 'react'
import { registerConfirmHandler } from '../utils/confirm'

const ConfirmDialog = () => {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('Are you sure?')
  const [message, setMessage] = useState('')
  const [resolve, setResolve] = useState<((v: boolean) => void) | null>(null)

  useEffect(() => {
    registerConfirmHandler((msg, ttl) => {
      setMessage(msg)
      setTitle(ttl || 'Are you sure?')
      setOpen(true)
      return new Promise<boolean>(res => {
        setResolve(() => res)
      })
    })
  }, [])

  const handleChoice = (value: boolean) => {
    setOpen(false)
    resolve?.(value)
    setResolve(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => handleChoice(false)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => handleChoice(true)}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
