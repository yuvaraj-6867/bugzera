const CACHE_KEY = 'bugzera_translate_cache'
const API_URL = 'https://api.mymemory.translated.net/get'

// Language code mapping for MyMemory API
const langMap: Record<string, string> = {
  en: 'en',
  ta: 'ta',
  hi: 'hi',
  es: 'es',
  fr: 'fr',
  ja: 'ja',
}

function getCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function setCache(cache: Record<string, string>) {
  try {
    const cacheStr = JSON.stringify(cache)
    // Limit cache size to ~2MB
    if (cacheStr.length > 2_000_000) {
      const entries = Object.entries(cache)
      const trimmed = Object.fromEntries(entries.slice(Math.floor(entries.length / 2)))
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed))
    } else {
      localStorage.setItem(CACHE_KEY, cacheStr)
    }
  } catch {
    // localStorage full, clear old cache
    localStorage.removeItem(CACHE_KEY)
  }
}

// Queue to batch requests and avoid flooding the API
let pendingQueue: Map<string, { resolve: (v: string) => void; reject: (e: Error) => void }[]> = new Map()
let flushTimeout: ReturnType<typeof setTimeout> | null = null

function flushQueue(from: string, to: string) {
  const entries = Array.from(pendingQueue.entries())
  pendingQueue = new Map()

  // Process one at a time to respect rate limits
  const processNext = async (index: number) => {
    if (index >= entries.length) return
    const [text, callbacks] = entries[index]

    try {
      const result = await fetchTranslation(text, from, to)
      callbacks.forEach(cb => cb.resolve(result))
    } catch (err) {
      callbacks.forEach(cb => cb.resolve(text)) // fallback to original
    }

    // Small delay between requests
    setTimeout(() => processNext(index + 1), 100)
  }

  processNext(0)
}

async function fetchTranslation(text: string, from: string, to: string): Promise<string> {
  const fromLang = langMap[from] || 'en'
  const toLang = langMap[to] || 'en'

  const res = await fetch(
    `${API_URL}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
  )

  if (!res.ok) return text

  const data = await res.json()
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    const translated = data.responseData.translatedText
    // Cache the result
    const cache = getCache()
    cache[`${from}:${to}:${text}`] = translated
    setCache(cache)
    return translated
  }

  return text
}

export async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text || !text.trim() || from === to) return text

  // Check cache first
  const cacheKey = `${from}:${to}:${text}`
  const cache = getCache()
  if (cache[cacheKey]) return cache[cacheKey]

  // Direct fetch for single translations
  return fetchTranslation(text, from, to)
}

export async function translateBatch(
  texts: string[],
  from: string,
  to: string
): Promise<string[]> {
  if (from === to) return texts

  const cache = getCache()
  const results: (string | null)[] = texts.map(t => {
    const key = `${from}:${to}:${t}`
    return cache[key] || null
  })

  // Find uncached texts
  const uncached = texts
    .map((t, i) => (results[i] === null ? { text: t, index: i } : null))
    .filter(Boolean) as { text: string; index: number }[]

  // Translate uncached texts
  if (uncached.length > 0) {
    const translations = await Promise.all(
      uncached.map(({ text }) =>
        fetchTranslation(text, from, to).catch(() => text)
      )
    )

    uncached.forEach(({ index }, i) => {
      results[index] = translations[i]
    })
  }

  return results.map((r, i) => r || texts[i])
}
