const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
require('dotenv').config();

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME;
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

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

// Helper function to update article in database
async function updateArticleInDB(filename, updates) {
  const articles = await readArticlesDB();
  const articleIndex = articles.findIndex(article => article.filename === filename);
  
  if (articleIndex !== -1) {
    articles[articleIndex] = { ...articles[articleIndex], ...updates };
    await writeArticlesDB(articles);
    return articles[articleIndex];
  }
  
  return null;
}

// Convert markdown to HTML (basic conversion)
function markdownToHtml(markdown) {
  return markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    
    // Bold and italic
    .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
    
    // Lists
    .replace(/^\\s*\\* (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\\/li>)/gs, '<ul>$1</ul>')
    
    // Links
    .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href=\"$2\">$1</a>')
    
    // Line breaks
    .replace(/\\n\\n/g, '</p><p>')
    .replace(/^(?!<[h|u|l])(.+)$/gm, '<p>$1</p>')
    
    // Clean up empty paragraphs
    .replace(/<p><\\/p>/g, '')
    .replace(/<p>(<[h|u])/g, '$1')
    .replace(/(<\\/[h|u]>)<\\/p>/g, '$1');
}

// Create WordPress post
async function createWordPressPost(content) {
  const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');
  
  const postData = {
    title: content.title,
    content: markdownToHtml(content.content),
    excerpt: content.metaDescription || '',
    status: 'publish',
    categories: [], // Will be set based on category name
    tags: content.tags || [],
    meta: {
      _yoast_wpseo_metadesc: content.metaDescription || '',
      _yoast_wpseo_title: content.title
    }
  };

  // Get or create category
  if (content.category) {
    try {
      const categoriesResponse = await axios.get(`${WORDPRESS_API_URL}/wp-json/wp/v2/categories`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        params: {
          search: content.category
        }
      });

      let categoryId;
      if (categoriesResponse.data.length > 0) {
        categoryId = categoriesResponse.data[0].id;
      } else {
        // Create new category
        const newCategoryResponse = await axios.post(`${WORDPRESS_API_URL}/wp-json/wp/v2/categories`, {
          name: content.category,
          slug: content.category.toLowerCase().replace(/\\s+/g, '-')
        }, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });
        categoryId = newCategoryResponse.data.id;
      }
      
      postData.categories = [categoryId];
    } catch (error) {
      console.warn('Could not set category:', error.message);
    }
  }

  // Set featured image if provided
  if (content.featuredImage) {
    try {
      // This is a simplified approach - in a real implementation,
      // you'd want to upload the image to WordPress media library first
      postData.featured_media = content.featuredImage;
    } catch (error) {
      console.warn('Could not set featured image:', error.message);
    }
  }

  const response = await axios.post(`${WORDPRESS_API_URL}/wp-json/wp/v2/posts`, postData, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

// Update WordPress post
async function updateWordPressPost(postId, content) {
  const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');
  
  const postData = {
    title: content.title,
    content: markdownToHtml(content.content),
    excerpt: content.metaDescription || '',
    status: 'publish',
    tags: content.tags || [],
    meta: {
      _yoast_wpseo_metadesc: content.metaDescription || '',
      _yoast_wpseo_title: content.title
    }
  };

  // Update category if changed
  if (content.category) {
    try {
      const categoriesResponse = await axios.get(`${WORDPRESS_API_URL}/wp-json/wp/v2/categories`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        params: {
          search: content.category
        }
      });

      let categoryId;
      if (categoriesResponse.data.length > 0) {
        categoryId = categoriesResponse.data[0].id;
      } else {
        // Create new category
        const newCategoryResponse = await axios.post(`${WORDPRESS_API_URL}/wp-json/wp/v2/categories`, {
          name: content.category,
          slug: content.category.toLowerCase().replace(/\\s+/g, '-')
        }, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });
        categoryId = newCategoryResponse.data.id;
      }
      
      postData.categories = [categoryId];
    } catch (error) {
      console.warn('Could not update category:', error.message);
    }
  }

  const response = await axios.put(`${WORDPRESS_API_URL}/wp-json/wp/v2/posts/${postId}`, postData, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

// Main function to publish or update article
async function publishArticle(filename) {
  try {
    console.log(`Starting publication process for: ${filename}`);
    
    // Validate environment variables
    if (!WORDPRESS_API_URL || !WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
      throw new Error('Missing WordPress configuration. Please check your .env file.');
    }

    // Read article content
    const content = await readContentFile(filename);
    if (!content) {
      throw new Error(`Could not read content file: ${filename}`);
    }

    // Read articles database
    const articles = await readArticlesDB();
    const article = articles.find(a => a.filename === filename);
    
    if (!article) {
      throw new Error(`Article not found in database: ${filename}`);
    }

    let wordPressPost;
    let status = 'published';
    
    if (article.wpId) {
      // Update existing post
      console.log(`Updating existing WordPress post (ID: ${article.wpId})`);
      wordPressPost = await updateWordPressPost(article.wpId, content);
      status = 'updated';
    } else {
      // Create new post
      console.log('Creating new WordPress post');
      wordPressPost = await createWordPressPost(content);
    }

    // Update article in database
    const updatedArticle = await updateArticleInDB(filename, {
      wpId: wordPressPost.id,
      status: status,
      lastUpdated: moment().toISOString()
    });

    console.log(`Successfully ${article.wpId ? 'updated' : 'published'} article:`);
    console.log(`- Title: ${wordPressPost.title.rendered}`);
    console.log(`- WordPress ID: ${wordPressPost.id}`);
    console.log(`- URL: ${wordPressPost.link}`);
    console.log(`- Status: ${status}`);

    return {
      success: true,
      wpId: wordPressPost.id,
      url: wordPressPost.link,
      status: status
    };

  } catch (error) {
    console.error('Error publishing article:', error.message);
    
    // Update status to error in database
    await updateArticleInDB(filename, {
      status: 'error',
      lastUpdated: moment().toISOString()
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Command line interface
if (require.main === module) {
  const filename = process.argv[2];
  
  if (!filename) {
    console.error('Usage: node wp-poster.js <filename>');
    console.error('Example: node wp-poster.js migraines.json');
    process.exit(1);
  }
  
  publishArticle(filename)
    .then(result => {
      if (result.success) {
        console.log('\\n✅ Publication completed successfully!');
        process.exit(0);
      } else {
        console.error('\\n❌ Publication failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\\n❌ Unexpected error:', error.message);
      process.exit(1);
    });
}

module.exports = { publishArticle, createWordPressPost, updateWordPressPost };