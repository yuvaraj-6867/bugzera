import { toast } from './toast'

export async function downloadFile(url: string, filename: string) {
  try {
    const token = localStorage.getItem('authToken')
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Download failed' }))
      toast.error(err.error || 'Download failed')
      return
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch {
    toast.error('Download failed. Please try again.')
  }
}
