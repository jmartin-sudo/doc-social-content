import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArticleContent } from '../types';
import './ArticleEditor.css';

interface ArticleEditorProps {
  filename: string;
  onBack: () => void;
  onFetchContent: (filename: string) => Promise<ArticleContent | null>;
  onUpdateContent: (filename: string, content: ArticleContent) => void;
  onPublish: (filename: string) => void;
  onUpdateStatus: (filename: string, status: string, wpId?: number) => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({
  filename,
  onBack,
  onFetchContent,
  onUpdateContent,
  onPublish,
  onUpdateStatus,
}) => {
  const [content, setContent] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const articleContent = await onFetchContent(filename);
        if (articleContent) {
          setContent(articleContent);
        } else {
          setError('Failed to load article content');
        }
      } catch (err) {
        setError('Failed to load article content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [filename, onFetchContent]);

  const handleSave = async () => {
    if (!content) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Calculate word count
      const wordCount = content.content.split(/\\s+/).filter(word => word.length > 0).length;
      const updatedContent = { ...content, wordCount };
      
      await onUpdateContent(filename, updatedContent);
      setContent(updatedContent);
      setUnsavedChanges(false);
    } catch (err) {
      setError('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!content) return;
    
    if (unsavedChanges) {
      const shouldSaveFirst = window.confirm('You have unsaved changes. Save before publishing?');
      if (shouldSaveFirst) {
        await handleSave();
      }
    }
    
    const confirmPublish = window.confirm(`Are you sure you want to publish "${content.title}" to WordPress?`);
    if (confirmPublish) {
      onPublish(filename);
    }
  };

  const updateContent = (field: keyof ArticleContent, value: any) => {
    if (!content) return;
    
    setContent({ ...content, [field]: value });
    setUnsavedChanges(true);
  };

  const updateTags = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    updateContent('tags', tags);
  };

  if (loading) {
    return (
      <div className="article-editor">
        <div className="loading">Loading article content...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="article-editor">
        <div className="error">
          {error || 'Failed to load article content'}
          <button onClick={onBack}>← Back to List</button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-editor">
      <div className="editor-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back to List
        </button>
        <h2>✏️ Editing: {content.title}</h2>
        <div className="editor-actions">
          <button 
            className="btn btn-save"
            onClick={handleSave}
            disabled={saving || !unsavedChanges}
          >
            {saving ? '💾 Saving...' : '💾 Save'}
          </button>
          <button 
            className="btn btn-preview"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? '📝 Edit' : '👁️ Preview'}
          </button>
          <button 
            className="btn btn-publish"
            onClick={handlePublish}
            disabled={saving}
          >
            🚀 Publish
          </button>
        </div>
      </div>

      {unsavedChanges && (
        <div className="unsaved-warning">
          ⚠️ You have unsaved changes
        </div>
      )}

      <div className="editor-content">
        <div className="editor-sidebar">
          <div className="meta-section">
            <h3>📊 Article Info</h3>
            
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder="Article title"
              />
            </div>
            
            
            <div className="form-group">
              <label>Tags (comma-separated):</label>
              <input
                type="text"
                value={content.tags.join(', ')}
                onChange={(e) => updateTags(e.target.value)}
                placeholder="health, medicine, treatment"
              />
            </div>
            
            <div className="form-group">
              <label>Author:</label>
              <input
                type="text"
                value={content.author}
                onChange={(e) => updateContent('author', e.target.value)}
                placeholder="Author name"
              />
            </div>
            
            <div className="form-group">
              <label>Meta Description:</label>
              <textarea
                value={content.metaDescription}
                onChange={(e) => updateContent('metaDescription', e.target.value)}
                placeholder="Brief description for SEO"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>Featured Image URL:</label>
              <input
                type="url"
                value={content.featuredImage}
                onChange={(e) => updateContent('featuredImage', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="stats">
              <p><strong>Word Count:</strong> {content.wordCount || 0}</p>
              <p><strong>Date Created:</strong> {content.dateCreated}</p>
            </div>
          </div>
        </div>

        <div className="editor-main">
          {!showPreview ? (
            <>
              <div className="form-group">
                <label>Content (Markdown):</label>
                <textarea
                  className="content-editor"
                  value={content.content}
                  onChange={(e) => updateContent('content', e.target.value)}
                  placeholder="Write your article content in Markdown format..."
                />
              </div>
              
              <div className="editor-help">
                <h4>📝 Markdown Tips:</h4>
                <ul>
                  <li><code># Heading 1</code> for main headings</li>
                  <li><code>## Heading 2</code> for section headings</li>
                  <li><code>**bold text**</code> for bold</li>
                  <li><code>*italic text*</code> for italic</li>
                  <li><code>- Item</code> for bullet points</li>
                  <li><code>[link text](url)</code> for links</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="preview-panel">
              <div className="preview-header">
                <h3>📖 Preview</h3>
                <p>This is how your article will appear when published:</p>
              </div>
              <div className="preview-content">
                <ReactMarkdown>{content.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;