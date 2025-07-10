require('dotenv').config();

module.exports = {
  wordpress: {
    apiUrl: process.env.WORDPRESS_API_URL,
    username: process.env.WORDPRESS_USERNAME,
    appPassword: process.env.WORDPRESS_APP_PASSWORD
  },
  server: {
    port: process.env.PORT || 3001,
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001'
  },
  paths: {
    articlesDb: './data/articles.json',
    contentDir: './content',
    publicDir: './public'
  }
};