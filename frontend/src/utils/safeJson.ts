export async function safeJson(res: Response): Promise<any> {
  const text = await res.text()
  if (!text || text.trim() === '') return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
