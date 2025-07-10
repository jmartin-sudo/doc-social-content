# 📚 Medical Content Pipeline

A self-contained system for managing and publishing medical content to WordPress with a modern web interface.

## 🚀 Quick Start

**New to this project?** Start here: **[Getting Started Guide](getting-started.md)**

## 🚀 Features

- **Local Database Management**: Track articles with status, WordPress IDs, and metadata
- **Modern Web UI**: React-based interface for content management
- **WordPress Integration**: Direct publishing and updating via WordPress REST API
- **Markdown Support**: Write content in Markdown format
- **Status Tracking**: Monitor draft, published, updated, and error states
- **Content Editor**: Built-in editor with metadata management
- **Batch Operations**: Publish multiple articles efficiently

## 📁 Project Structure

```
doc-social-content-pipeline/
├── content/                    # Article content files (.json)
│   ├── migraines.json
│   └── gerd.json
├── data/                      # Local database
│   └── articles.json          # Article tracking database
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArticleList.tsx
│   │   │   ├── ArticleEditor.tsx
│   │   │   └── *.css
│   │   ├── App.tsx
│   │   └── types.ts
│   └── public/
├── server.js                  # Express backend
├── wp-poster.js              # WordPress publishing logic
├── config.js                 # Configuration management
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your WordPress credentials
nano .env
```

Required environment variables:
- `WORDPRESS_API_URL`: Your WordPress site URL
- `WORDPRESS_USERNAME`: WordPress username
- `WORDPRESS_APP_PASSWORD`: WordPress application password
- `PORT`: Server port (default: 3001)

### 3. WordPress Setup

Yes, you need **both** a WordPress username and an Application Password for authentication. Here's how to set it up:

#### Creating a WordPress Application Password

1. **Log into your WordPress admin dashboard** at `https://doc.social/wp-admin`
2. **Go to Users → Profile** (or Users → All Users → [Your User])
3. **Scroll down to "Application Passwords"** section
4. **Create a new Application Password:**
   - Enter a name like "Medical Content Pipeline" in the "New Application Password Name" field
   - Click "Add New Application Password"
   - **Copy the generated password immediately** - you won't be able to see it again!

#### Authentication Method

WordPress REST API uses **Basic Authentication** with:
- **Username**: Your regular WordPress username (not email)
- **Password**: The Application Password you just created (not your regular login password)

The system creates a Base64 encoded string: `username:app_password` for API requests.

#### Security Notes

- Application Passwords are safer than regular passwords for API access
- They can be revoked individually without affecting your main login
- They work even if two-factor authentication is enabled
- Never use your regular WordPress login password for API access

### 4. Start the Application

```bash
# Development mode (runs both backend and frontend)
npm run dev

# Or start backend only
npm start

# Or build and serve production
npm run build
npm start
```

## 🎯 Usage

### Web Interface

1. Open `http://localhost:3001` in your browser
2. View, edit, and manage articles
3. Use the built-in editor to modify content
4. Click \"Publish\" to send articles to WordPress

### Command Line

```bash
# Publish a specific article
node wp-poster.js migraines.json

# Create new article (via API)
curl -X POST http://localhost:3001/api/articles \\
  -H \"Content-Type: application/json\" \\
  -d '{\"title\": \"New Article\", \"category\": \"Health\", \"tags\": [\"medical\"]}'
```

## 📊 Article Status

- **draft**: Article created but not published
- **published**: Successfully published to WordPress
- **updated**: Article updated on WordPress
- **error**: Publishing failed
- **publishing**: Currently being published

## 🔧 API Endpoints

- `GET /api/articles` - List all articles
- `GET /api/articles/:filename` - Get article content
- `POST /api/articles` - Create new article
- `PUT /api/articles/:filename` - Update article content
- `PATCH /api/articles/:filename/status` - Update article status
- `POST /api/articles/:filename/publish` - Publish article
- `DELETE /api/articles/:filename` - Delete article

## 🎨 Content Format

Articles are stored as JSON files with the following structure:

```json
{
  \"title\": \"Article Title\",
  \"content\": \"# Markdown Content\\n\\nArticle body...\",
  \"tags\": [\"health\", \"medical\"],
  \"category\": \"Medical Conditions\",
  \"metaDescription\": \"SEO description\",
  \"featuredImage\": \"https://example.com/image.jpg\",
  \"author\": \"Medical Content Team\",
  \"dateCreated\": \"2025-07-10\",
  \"wordCount\": 450
}
```

## 🔒 Security

- Use WordPress Application Passwords (not regular passwords)
- Store credentials in `.env` file (not in version control)
- Validate all API inputs
- Use HTTPS in production
- Regularly update dependencies

## 🚀 Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build client
npm run build

# Start with PM2
pm2 start server.js --name \"medical-content-pipeline\"
pm2 startup
pm2 save
```

### Using Docker

```bash
# Build image
docker build -t medical-content-pipeline .

# Run container
docker run -p 3001:3001 --env-file .env medical-content-pipeline
```

## 🛠️ Development

### Adding New Features

1. Backend changes: Edit `server.js` and `wp-poster.js`
2. Frontend changes: Edit files in `client/src/`
3. Database schema: Modify `data/articles.json` structure
4. Content format: Update article JSON structure

### Testing

```bash
# Test WordPress connection
node wp-poster.js test-article.json

# Test API endpoints
curl http://localhost:3001/api/articles

# Check logs
pm2 logs medical-content-pipeline
```

## 📝 Content Guidelines

- Use semantic HTML in Markdown
- Include proper meta descriptions
- Add relevant tags and categories
- Optimize images before linking
- Follow medical content best practices
- Include proper disclaimers

## 🔧 Troubleshooting

### Common Issues

1. **WordPress API Connection Failed**
   - Check URL and credentials
   - Verify WordPress REST API is enabled
   - Ensure Application Password is correct

2. **Article Not Publishing**
   - Check logs for specific errors
   - Verify article format is correct
   - Ensure WordPress user has publishing permissions

3. **Frontend Not Loading**
   - Check if backend is running
   - Verify API_URL in environment
   - Check browser console for errors

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm start

# Check article database
cat data/articles.json | jq '.'

# Validate article content
node -e \"console.log(JSON.parse(require('fs').readFileSync('content/migraines.json')))\"
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📜 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review WordPress REST API documentation
- Check React/Express documentation
- Create an issue in this repository

---

*This system is designed for medical content management. Always follow medical content guidelines and include appropriate disclaimers in your articles.*