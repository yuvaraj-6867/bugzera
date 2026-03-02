type ToastType = 'success' | 'error' | 'info'
export type Toast = { id: number; message: string; type: ToastType }
type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
let counter = 0
const listeners: Listener[] = []

function notify() { listeners.forEach(l => l([...toasts])) }

function add(message: string, type: ToastType, duration = 3500) {
  const id = ++counter
  toasts = [...toasts, { id, message, type }]
  notify()
  setTimeout(() => { toasts = toasts.filter(t => t.id !== id); notify() }, duration)
}

export const toast = {
  success: (msg: string) => add(msg, 'success'),
  error:   (msg: string) => add(msg, 'error'),
  info:    (msg: string) => add(msg, 'info'),
  subscribe: (fn: Listener) => {
    listeners.push(fn)
    return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1) }
  }
}
