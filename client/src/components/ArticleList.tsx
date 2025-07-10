import React, { useState } from 'react';
import { Article } from '../types';
import './ArticleList.css';

interface ArticleListProps {
  articles: Article[];
  onSelectArticle: (filename: string) => void;
  onCreateArticle: (title: string, category: string, tags: string[]) => void;
  onDeleteArticle: (filename: string) => void;
  onPublishArticle: (filename: string) => void;
  onUpdateStatus: (filename: string, status: string, wpId?: number) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  onSelectArticle,
  onCreateArticle,
  onDeleteArticle,
  onPublishArticle,
  onUpdateStatus,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Medical Conditions');
  const [newTags, setNewTags] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      const tags = newTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      onCreateArticle(newTitle.trim(), newCategory, tags);
      setNewTitle('');
      setNewCategory('Medical Conditions');
      setNewTags('');
      setShowCreateForm(false);
    }
  };

  const handleDeleteConfirm = (filename: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      onDeleteArticle(filename);
    }
  };

  const handlePublishConfirm = (filename: string, title: string) => {
    if (window.confirm(`Are you sure you want to publish "${title}" to WordPress?`)) {
      onPublishArticle(filename);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6c757d';
      case 'published': return '#28a745';
      case 'updated': return '#17a2b8';
      case 'error': return '#dc3545';
      case 'publishing': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesFilter = filter === 'all' || article.status === filter;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="article-list">
      <div className="article-list-header">
        <h2>📄 Articles ({articles.length})</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ New Article
        </button>
      </div>

      <div className="article-filters">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="updated">Updated</option>
            <option value="error">Error</option>
            <option value="publishing">Publishing</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showCreateForm && (
        <div className="create-form-overlay">
          <div className="create-form">
            <h3>Create New Article</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter article title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Category:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="Medical Conditions">Medical Conditions</option>
                  <option value="Treatments">Treatments</option>
                  <option value="Prevention">Prevention</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Research">Research</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Tags (comma-separated):</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="health, medicine, treatment"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Create Article
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="articles-grid">
        {filteredArticles.length === 0 ? (
          <div className="no-articles">
            {articles.length === 0 ? 
              "No articles found. Create your first article!" : 
              "No articles match your current filters."
            }
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div key={article.filename} className="article-card">
              <div className="article-header">
                <h3 onClick={() => onSelectArticle(article.filename)}>
                  {article.title}
                </h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(article.status) }}
                >
                  {article.status}
                </span>
              </div>
              
              <div className="article-meta">
                <p><strong>Category:</strong> {article.category}</p>
                <p><strong>Tags:</strong> {article.tags.join(', ') || 'None'}</p>
                {article.wpId && (
                  <p><strong>WordPress ID:</strong> {article.wpId}</p>
                )}
                {article.lastUpdated && (
                  <p><strong>Last Updated:</strong> {new Date(article.lastUpdated).toLocaleDateString()}</p>
                )}
              </div>
              
              <div className="article-actions">
                <button 
                  className="btn btn-edit"
                  onClick={() => onSelectArticle(article.filename)}
                >
                  ✏️ Edit
                </button>
                
                <button 
                  className="btn btn-publish"
                  onClick={() => handlePublishConfirm(article.filename, article.title)}
                  disabled={article.status === 'publishing'}
                >
                  🚀 {article.status === 'publishing' ? 'Publishing...' : (article.wpId ? 'Update' : 'Publish')}
                </button>
                
                <button 
                  className="btn btn-delete"
                  onClick={() => handleDeleteConfirm(article.filename, article.title)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ArticleList;