const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const ARTICLES_DB_PATH = path.join(__dirname, 'data', 'articles.json');
const CONTENT_DIR = path.join(__dirname, 'content');

// Helper function to read articles database
async function readArticlesDB() {
  try {
    const data = await fs.readFile(ARTICLES_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading articles database:', error);
    return [];
  }
}

// Helper function to write articles database
async function writeArticlesDB(articles) {
  try {
    await fs.writeFile(ARTICLES_DB_PATH, JSON.stringify(articles, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing articles database:', error);
    return false;
  }
}

// Helper function to read content file
async function readContentFile(filename) {
  try {
    const filePath = path.join(CONTENT_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading content file:', error);
    return null;
  }
}

// Helper function to write content file
async function writeContentFile(filename, content) {
  try {
    const filePath = path.join(CONTENT_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(content, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing content file:', error);
    return false;
  }
}

// API Routes

// Get all articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await readArticlesDB();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get specific article content
app.get('/api/articles/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const content = await readContentFile(filename);
    if (!content) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch article content' });
  }
});

// Update article content
app.put('/api/articles/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const updatedContent = req.body;
    
    // Update content file
    const success = await writeContentFile(filename, updatedContent);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update content file' });
    }
    
    // Update articles database
    const articles = await readArticlesDB();
    const articleIndex = articles.findIndex(article => article.filename === filename);
    
    if (articleIndex !== -1) {
      articles[articleIndex].title = updatedContent.title;
      articles[articleIndex].lastUpdated = moment().toISOString();
      articles[articleIndex].tags = updatedContent.tags || articles[articleIndex].tags;
      articles[articleIndex].category = updatedContent.category || articles[articleIndex].category;
      
      await writeArticlesDB(articles);
    }
    
    res.json({ message: 'Article updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Update article status
app.patch('/api/articles/:filename/status', async (req, res) => {
  try {
    const { filename } = req.params;
    const { status, wpId } = req.body;
    
    const articles = await readArticlesDB();
    const articleIndex = articles.findIndex(article => article.filename === filename);
    
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    articles[articleIndex].status = status;
    articles[articleIndex].lastUpdated = moment().toISOString();
    
    if (wpId) {
      articles[articleIndex].wpId = wpId;
    }
    
    const success = await writeArticlesDB(articles);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update article status' });
    }
    
    res.json({ message: 'Article status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update article status' });
  }
});

// Publish article to WordPress
app.post('/api/articles/:filename/publish', async (req, res) => {
  try {
    const { filename } = req.params;
    const { spawn } = require('child_process');
    
    // Update status to 'publishing'
    const articles = await readArticlesDB();
    const articleIndex = articles.findIndex(article => article.filename === filename);
    
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    articles[articleIndex].status = 'publishing';
    await writeArticlesDB(articles);
    
    // Run wp-poster.js
    const wpPoster = spawn('node', ['wp-poster.js', filename], {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    let output = '';
    let error = '';
    
    wpPoster.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    wpPoster.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    wpPoster.on('close', async (code) => {
      if (code === 0) {
        // Success - update status to published
        const updatedArticles = await readArticlesDB();
        const updatedIndex = updatedArticles.findIndex(article => article.filename === filename);
        if (updatedIndex !== -1) {
          updatedArticles[updatedIndex].status = 'published';
          await writeArticlesDB(updatedArticles);
        }
        res.json({ message: 'Article published successfully', output });
      } else {
        // Error - update status to error
        const updatedArticles = await readArticlesDB();
        const updatedIndex = updatedArticles.findIndex(article => article.filename === filename);
        if (updatedIndex !== -1) {
          updatedArticles[updatedIndex].status = 'error';
          await writeArticlesDB(updatedArticles);
        }
        res.status(500).json({ error: 'Failed to publish article', details: error });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish article' });
  }
});

// Create new article
app.post('/api/articles', async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    
    // Generate filename
    const filename = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-') + '.json';
    
    // Create content file
    const contentData = {
      title,
      content: content || `# ${title}\n\nContent goes here...`,
      tags: tags || [],
      category: category || 'Uncategorized',
      metaDescription: '',
      featuredImage: '',
      author: 'Medical Content Team',
      dateCreated: moment().format('YYYY-MM-DD'),
      wordCount: 0
    };
    
    const success = await writeContentFile(filename, contentData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to create content file' });
    }
    
    // Add to articles database
    const articles = await readArticlesDB();
    const newArticle = {
      title,
      filename,
      status: 'draft',
      wpId: null,
      lastUpdated: moment().toISOString(),
      tags: tags || [],
      category: category || 'Uncategorized'
    };
    
    articles.push(newArticle);
    await writeArticlesDB(articles);
    
    res.json({ message: 'Article created successfully', article: newArticle });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Delete article
app.delete('/api/articles/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Remove from articles database
    const articles = await readArticlesDB();
    const filteredArticles = articles.filter(article => article.filename !== filename);
    
    if (filteredArticles.length === articles.length) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    await writeArticlesDB(filteredArticles);
    
    // Remove content file
    const filePath = path.join(CONTENT_DIR, filename);
    await fs.remove(filePath);
    
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the web UI at: http://localhost:${PORT}`);
});