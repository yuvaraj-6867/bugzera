import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchResult {
  id: number
  title: string
  type: 'ticket' | 'test_case' | 'project'
  status?: string
  label?: string
}

const hdrs = () => ({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })

const typeIcon = (type: SearchResult['type']) => {
  if (type === 'ticket') return (
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  if (type === 'test_case') return (
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  return (
    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

const typeLabel: Record<SearchResult['type'], string> = {
  ticket: 'Ticket',
  test_case: 'Test Case',
  project: 'Project',
}

const typeRoute: Record<SearchResult['type'], string> = {
  ticket: '/tickets',
  test_case: '/test-cases',
  project: '/projects',
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const [ticketsRes, testCasesRes, projectsRes] = await Promise.all([
        fetch(`/api/v1/tickets?q=${encodeURIComponent(q)}&per_page=3`, { headers: hdrs() }),
        fetch(`/api/v1/test_cases?q=${encodeURIComponent(q)}&per_page=3`, { headers: hdrs() }),
        fetch(`/api/v1/projects?q=${encodeURIComponent(q)}&per_page=3`, { headers: hdrs() }),
      ])

      const combined: SearchResult[] = []
      if (ticketsRes.ok) {
        const d = await ticketsRes.json()
        const items = d.tickets || d || []
        items.slice(0, 3).forEach((t: any) => combined.push({ id: t.id, title: t.title, type: 'ticket', status: t.status }))
      }
      if (testCasesRes.ok) {
        const d = await testCasesRes.json()
        const items = d.test_cases || d || []
        items.slice(0, 3).forEach((t: any) => combined.push({ id: t.id, title: t.title, type: 'test_case', status: t.status }))
      }
      if (projectsRes.ok) {
        const d = await projectsRes.json()
        const items = d.projects || d || []
        items.slice(0, 3).forEach((p: any) => combined.push({ id: p.id, title: p.name, type: 'project' }))
      }
      setResults(combined)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  // Keyboard shortcut: Ctrl+K or /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Click outside close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    setResults([])
    navigate(typeRoute[result.type])
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search trigger */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm w-48 md:w-64"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="flex-1 text-left hidden md:block">Search...</span>
        <kbd className="hidden md:inline text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-0 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tickets, test cases, projects..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            )}
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((r, i) => (
                <li key={`${r.type}-${r.id}-${i}`}>
                  <button
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    {typeIcon(r.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400">{typeLabel[r.type]}{r.status ? ` · ${r.status}` : ''}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query && !loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No results for "<span className="font-medium text-gray-600 dark:text-gray-300">{query}</span>"
            </div>
          ) : !query ? (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              Type to search across tickets, test cases, and projects
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
