import React, { useState, useEffect } from 'react';
import './App.css';
import ArticleList from './components/ArticleList';
import ArticleEditor from './components/ArticleEditor';
import { Article, ArticleContent } from './types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/articles`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch article content
  const fetchArticleContent = async (filename: string): Promise<ArticleContent | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/articles/${filename}`);
      if (!response.ok) throw new Error('Failed to fetch article content');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article content');
      return null;
    }
  };

  // Update article content
  const updateArticleContent = async (filename: string, content: ArticleContent) => {
    try {
      const response = await fetch(`${API_BASE}/api/articles/${filename}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });
      if (!response.ok) throw new Error('Failed to update article');
      await fetchArticles(); // Refresh articles list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article');
    }
  };

  // Publish article
  const publishArticle = async (filename: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/articles/${filename}/publish`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to publish article');
      await fetchArticles(); // Refresh articles list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish article');
    }
  };

  // Update article status
  const updateArticleStatus = async (filename: string, status: string, wpId?: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/articles/${filename}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, wpId }),
      });
      if (!response.ok) throw new Error('Failed to update article status');
      await fetchArticles(); // Refresh articles list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article status');
    }
  };

  // Create new article
  const createArticle = async (title: string, category: string, tags: string[]) => {
    try {
      const response = await fetch(`${API_BASE}/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, category, tags }),
      });
      if (!response.ok) throw new Error('Failed to create article');
      await fetchArticles(); // Refresh articles list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
    }
  };

  // Delete article
  const deleteArticle = async (filename: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/articles/${filename}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete article');
      await fetchArticles(); // Refresh articles list
      if (selectedArticle === filename) {
        setSelectedArticle(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSelectArticle = (filename: string) => {
    setSelectedArticle(filename);
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading articles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error">
          Error: {error}
          <button onClick={() => { setError(null); fetchArticles(); }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 Medical Content Pipeline</h1>
        <p>Manage and publish medical content to WordPress</p>
      </header>

      <main className="App-main">
        {selectedArticle ? (
          <ArticleEditor
            filename={selectedArticle}
            onBack={handleBackToList}
            onFetchContent={fetchArticleContent}
            onUpdateContent={updateArticleContent}
            onPublish={publishArticle}
            onUpdateStatus={updateArticleStatus}
          />
        ) : (
          <ArticleList
            articles={articles}
            onSelectArticle={handleSelectArticle}
            onCreateArticle={createArticle}
            onDeleteArticle={deleteArticle}
            onPublishArticle={publishArticle}
            onUpdateStatus={updateArticleStatus}
          />
        )}
      </main>
    </div>
  );
}

export default App;
