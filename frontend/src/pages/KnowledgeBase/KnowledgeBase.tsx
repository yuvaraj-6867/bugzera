import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { usePermissions } from '../../hooks/usePermissions'
import BLoader from '../../components/BLoader'

const CATEGORIES = ['Getting Started', 'Best Practices', 'Integrations', 'Troubleshooting', 'API Reference', 'Tutorials', 'FAQ']

const hdrs = () => ({
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
})

const StarRating = ({ articleId, ratings, onRate }: { articleId: number, ratings: Record<number, number>, onRate: (id: number, star: number) => void }) => {
  const saved = ratings[articleId] || 0
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          onClick={() => onRate(articleId, star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none focus:outline-none transition-transform hover:scale-125"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <span style={{ color: star <= (hovered || saved) ? '#f59e0b' : '#d1d5db' }}>★</span>
        </button>
      ))}
      {saved > 0 && <span className="text-xs text-gray-400 ml-1">You rated {saved}/5</span>}
    </div>
  )
}

const KnowledgeBase = () => {
  const { t } = useLanguage()
  const { isAdminOrManager } = usePermissions()

  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [viewArticle, setViewArticle] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [editArticle, setEditArticle] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [ratings, setRatings] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem('kb_ratings') || '{}') } catch { return {} }
  })
  const [formData, setFormData] = useState({
    title: '', category: '', status: 'draft', content: '',
    tags: '', is_public: false, summary: '', display_order: '0',
  })

  const handleRate = (articleId: number, star: number) => {
    const updated = { ...ratings, [articleId]: star }
    setRatings(updated)
    localStorage.setItem('kb_ratings', JSON.stringify(updated))
  }

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/articles', { headers: hdrs() })
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles || [])
      }
    } catch (err) {
      console.error('KnowledgeBase fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdminOrManager) fetchArticles()
    else setLoading(false)
  }, [fetchArticles, isAdminOrManager])

  const openCreate = () => {
    setEditArticle(null)
    setFormData({ title: '', category: '', status: 'draft', content: '', tags: '', is_public: false, summary: '', display_order: '0' })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (article: any) => {
    setEditArticle(article)
    setFormData({
      title: article.title || '',
      category: article.category || '',
      status: article.status || 'draft',
      content: article.content || '',
      tags: article.tags || '',
      is_public: article.is_public ?? false,
      summary: article.summary || '',
      display_order: String(article.display_order ?? 0),
    })
    setFormError('')
    setShowModal(true)
    setViewArticle(null)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    setFormError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.category || !formData.content.trim()) {
      setFormError('Title, category and content are required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const url = editArticle ? `/api/v1/articles/${editArticle.id}` : '/api/v1/articles'
      const method = editArticle ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: hdrs(),
        body: JSON.stringify({
          article: {
            title: formData.title,
            category: formData.category,
            status: formData.status,
            content: formData.content,
            tags: formData.tags,
            is_public: formData.is_public,
            summary: formData.summary,
            display_order: parseInt(formData.display_order) || 0,
          }
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to save article')
        return
      }
      setShowModal(false)
      fetchArticles()
    } catch {
      setFormError('Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this article? This cannot be undone.')) return
    try {
      await fetch(`/api/v1/articles/${id}`, { method: 'DELETE', headers: hdrs() })
      setViewArticle(null)
      fetchArticles()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const filtered = articles.filter(a => {
    const matchesSearch = !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !activeCategory || a.category === activeCategory
    return matchesSearch && matchesCategory
  })

  if (!isAdminOrManager) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Restricted</h2>
          <p className="text-gray-500">Knowledge Base is available to Manager and Admin roles only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-transparent p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] dark:text-gray-100 mb-2">{t('knowledgeBase.title')}</h1>
          <p className="text-[#64748B] dark:text-gray-400">{t('knowledgeBase.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Article</button>
      </div>

      <div className="card mb-6">
        <input
          type="search"
          className="form-input"
          placeholder="Search articles by title or summary..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button className={`btn ${activeCategory === '' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveCategory('')}>
          All ({articles.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = articles.filter(a => a.category === cat).length
          return (
            <button key={cat} className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}>
              {cat} {count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4 text-[#0F172A] dark:text-gray-100">
          {activeCategory || 'All Articles'}
          {!loading && <span className="text-sm font-normal text-gray-400 ml-2">({filtered.length})</span>}
        </h3>
        {loading ? <BLoader /> : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            {articles.length === 0 ? 'No articles yet. Click "+ New Article" to create one.' : 'No articles match your filter.'}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map(article => (
              <div key={article.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors" onClick={() => setViewArticle(article)}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-base font-semibold text-[#0F172A] dark:text-gray-100 flex-1 mr-4">{article.title}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      article.status === 'published' ? 'bg-green-100 text-green-800' :
                      article.status === 'draft'     ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>{article.status}</span>
                    <button title="Edit" onClick={e => { e.stopPropagation(); openEdit(article) }} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button title="Delete" onClick={e => { e.stopPropagation(); handleDelete(article.id) }} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {article.summary && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{article.summary}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {article.category && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{article.category}</span>}
                  {article.tags && <span>{article.tags}</span>}
                  <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
                  {ratings[article.id] && (
                    <span className="text-yellow-500">{'★'.repeat(ratings[article.id])}{'☆'.repeat(5 - ratings[article.id])}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Article Modal */}
      {viewArticle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewArticle(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex-1 mr-4">
                <h2 className="text-2xl font-bold text-[#0F172A] dark:text-gray-100">{viewArticle.title}</h2>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  {viewArticle.category && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{viewArticle.category}</span>}
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${viewArticle.status === 'published' ? 'bg-green-100 text-green-800' : viewArticle.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{viewArticle.status}</span>
                  <span className="text-gray-400">Updated {new Date(viewArticle.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(viewArticle)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Edit</button>
                <button onClick={() => handleDelete(viewArticle.id)} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
                <button onClick={() => setViewArticle(null)} className="text-gray-400 hover:text-gray-600 ml-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              {viewArticle.summary && (
                <p className="text-gray-600 italic mb-4 text-sm border-l-4 border-accent-neon pl-3">{viewArticle.summary}</p>
              )}
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{viewArticle.content}</pre>
              {viewArticle.tags && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Tags: {viewArticle.tags}</p>
                </div>
              )}
              {/* Article Rating */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Was this article helpful?</p>
                <StarRating articleId={viewArticle.id} ratings={ratings} onRate={handleRate} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-gray-100">
                {editArticle ? 'Edit Article' : 'Create Knowledge Base Article'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{formError}</div>}

              <div>
                <label className="form-label">Article Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" placeholder="Enter article title" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="form-select" required>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="form-select">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Summary / Excerpt</label>
                <textarea name="summary" value={formData.summary} onChange={handleChange} className="form-textarea" placeholder="Brief summary shown in article list..." rows={2} />
              </div>

              <div>
                <label className="form-label">Content *</label>
                <textarea name="content" value={formData.content} onChange={handleChange} className="form-textarea min-h-[180px]" placeholder="Write article content..." required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Tags</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="testing, api, guide" />
                </div>
                <div>
                  <label className="form-label">Display Order</label>
                  <input type="number" name="display_order" value={formData.display_order} onChange={handleChange} className="form-input" placeholder="0" min="0" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_public" name="is_public" checked={formData.is_public} onChange={handleChange} className="w-4 h-4" />
                <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300">Public (visible to all users)</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn btn-primary disabled:opacity-50">
                  {saving ? 'Saving...' : editArticle ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBase
