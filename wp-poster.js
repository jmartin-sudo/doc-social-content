const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const { marked } = require('marked');
require('dotenv').config();

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME;
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;
const WORDPRESS_DEFAULT_CATEGORY_ID = process.env.WORDPRESS_DEFAULT_CATEGORY_ID;

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

// Convert markdown to HTML using marked library
function markdownToHtml(markdown) {
  return marked(markdown);
}

// Create WordPress post
async function createWordPressPost(content) {
  const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');
  
  const postData = {
    title: content.title,
    content: markdownToHtml(content.content),
    excerpt: content.metaDescription || '',
    status: 'publish',
    categories: WORDPRESS_DEFAULT_CATEGORY_ID ? [parseInt(WORDPRESS_DEFAULT_CATEGORY_ID)] : [], // Use default category ID
    // Note: Tags will be converted to IDs or created if they don't exist
    // Note: Meta fields (Yoast SEO) may need to be set separately via different API endpoint
  };

  // Handle tags - convert tag names to tag IDs
  if (content.tags && content.tags.length > 0) {
    try {
      const tagIds = [];
      for (const tagName of content.tags) {
        // First, try to find existing tag
        const existingTagResponse = await axios.get(`${WORDPRESS_API_URL}/wp-json/wp/v2/tags`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          params: {
            search: tagName
          }
        });

        let tagId;
        if (existingTagResponse.data.length > 0) {
          // Use existing tag
          tagId = existingTagResponse.data[0].id;
        } else {
          // Create new tag
          const newTagResponse = await axios.post(`${WORDPRESS_API_URL}/wp-json/wp/v2/tags`, {
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-')
          }, {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          });
          tagId = newTagResponse.data.id;
        }
        tagIds.push(tagId);
      }
      postData.tags = tagIds;
    } catch (error) {
      console.warn('Could not process tags:', error.message);
      postData.tags = []; // Fallback to no tags
    }
  } else {
    postData.tags = [];
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

  console.log('Post data being sent:', JSON.stringify(postData, null, 2));

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
    categories: WORDPRESS_DEFAULT_CATEGORY_ID ? [parseInt(WORDPRESS_DEFAULT_CATEGORY_ID)] : [],
    tags: content.tags || []
    // Note: Meta fields (Yoast SEO) may need to be set separately via different API endpoint
  };

  // Category is already set using default category ID

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
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
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