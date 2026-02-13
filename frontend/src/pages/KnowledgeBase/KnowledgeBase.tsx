import { useState } from 'react'

const KnowledgeBase = () => {
  const [showModal, setShowModal] = useState(false)

  // TODO: Fetch from backend API
  const articles: any[] = []

  const categories = ['Getting Started', 'Best Practices', 'Integrations', 'Troubleshooting', 'API Reference']

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Knowledge Base</h1>
          <p className="text-[#64748B]">Documentation and guides</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Article
        </button>
      </div>

      {/* Search */}
      <div className="card mb-8">
        <input
          type="search"
          className="form-input"
          placeholder="Search articles..."
        />
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-[#0F172A] mb-4">Categories</h3>
        <div className="flex flex-wrap gap-3">
          {categories.map(category => (
            <button key={category} className="btn btn-outline">
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Recent Articles</h3>
        <div className="space-y-4">
          {articles.map(article => (
            <div key={article.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <h4 className="text-lg font-semibold text-[#0F172A] mb-2">{article.title}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="badge badge-neutral">{article.category}</span>
                <span>👁 {article.views} views</span>
                <span>Updated {article.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Knowledge Base Article</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="modal-body">
              <form className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="form-label">Article Title *</label>
                  <input type="text" className="form-input" placeholder="Enter article title" required />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Category *</label>
                    <select className="form-select" required>
                      <option value="">Select category</option>
                      <option value="getting-started">Getting Started</option>
                      <option value="best-practices">Best Practices</option>
                      <option value="integrations">Integrations</option>
                      <option value="troubleshooting">Troubleshooting</option>
                      <option value="api-reference">API Reference</option>
                      <option value="tutorials">Tutorials</option>
                      <option value="faq">FAQ</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select className="form-select">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="form-label">Content *</label>
                  <textarea className="form-textarea min-h-[250px]" placeholder="Write your article content using Markdown..." required></textarea>
                  <p className="text-xs text-gray-500 mt-1">Supports Markdown formatting</p>
                </div>

                {/* Tags */}
                <div>
                  <label className="form-label">Tags</label>
                  <input type="text" className="form-input" placeholder="testing, api, guide, automation" />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated tags for better discoverability</p>
                </div>

                {/* Visibility */}
                <div>
                  <label className="form-label">Visibility</label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3">
                      <input type="radio" id="visibility-private" name="visibility" value="false" defaultChecked className="w-4 h-4" />
                      <label htmlFor="visibility-private" className="text-sm text-gray-700">Private (Team Only)</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="radio" id="visibility-public" name="visibility" value="true" className="w-4 h-4" />
                      <label htmlFor="visibility-public" className="text-sm text-gray-700">Public (Anyone with link)</label>
                    </div>
                  </div>
                </div>

                {/* SEO & Meta */}
                <div>
                  <label className="form-label">Summary/Excerpt (Optional)</label>
                  <textarea className="form-textarea" placeholder="Brief summary for search results..." rows={2}></textarea>
                </div>

                {/* Related Articles */}
                <div>
                  <label className="form-label">Related Articles (Optional)</label>
                  <input type="text" className="form-input" placeholder="Article IDs: 1, 5, 12" />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated article IDs to link related content</p>
                </div>

                {/* Attachments */}
                <div>
                  <label className="form-label">Attachments (Optional)</label>
                  <input type="file" className="form-input" multiple accept="image/*,.pdf,.doc,.docx" />
                  <p className="text-xs text-gray-500 mt-1">Images, PDFs, or documents</p>
                </div>

                {/* Author Override */}
                <div>
                  <label className="form-label">Author</label>
                  <select className="form-select">
                    <option value="">Current User (Default)</option>
                    <option value="1">John Doe</option>
                    <option value="2">Jane Smith</option>
                    <option value="3">Admin User</option>
                  </select>
                </div>

                {/* Display Order */}
                <div>
                  <label className="form-label">Display Order (Optional)</label>
                  <input type="number" className="form-input" placeholder="0" defaultValue="0" />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in category listing</p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary">Publish Article</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBase
