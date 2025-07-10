# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup
```bash
# Install all dependencies (backend and frontend)
npm run setup
```

### Development
```bash
# Start development server (both backend and frontend)
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client
```

### Build and Production
```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run frontend tests
cd client && npm test

# Test WordPress posting functionality
node wp-poster.js test-article.json
```

## Architecture Overview

This is a **medical content publishing pipeline** with three main components:

1. **Express Backend** (`server.js`): RESTful API server that manages articles and serves the React frontend
2. **WordPress Publisher** (`wp-poster.js`): Command-line tool that publishes articles to WordPress via REST API
3. **React Frontend** (`client/`): Web UI for managing articles with TypeScript and React

### Key Architecture Patterns

- **File-based Content Storage**: Articles stored as JSON files in `content/` directory
- **Local Database**: `data/articles.json` tracks publishing status and WordPress IDs
- **Dual Interface**: Web UI + command-line publishing
- **Status Tracking**: Articles have states (draft, published, updated, error, publishing)

### Data Flow

1. Articles created as JSON files in `content/` directory
2. Backend API reads/writes these files and updates tracking database
3. Frontend communicates with backend via REST API (proxy: `http://localhost:3001`)
4. Publishing happens via `wp-poster.js` which calls WordPress REST API

## File Structure

```
├── server.js              # Express backend API
├── wp-poster.js           # WordPress publishing utility
├── config.js              # Configuration management
├── content/               # Article content (JSON files)
├── data/articles.json     # Local article tracking database
├── client/                # React frontend
│   ├── src/components/    # React components
│   └── package.json       # Frontend dependencies
└── public/                # Built frontend assets
```

## Environment Setup

Required `.env` variables:
- `WORDPRESS_API_URL`: WordPress site URL
- `WORDPRESS_USERNAME`: WordPress username
- `WORDPRESS_APP_PASSWORD`: WordPress application password
- `PORT`: Server port (default: 3001)

## API Endpoints

- `GET /api/articles` - List all articles
- `GET /api/articles/:filename` - Get article content
- `POST /api/articles` - Create new article
- `PUT /api/articles/:filename` - Update article content
- `PATCH /api/articles/:filename/status` - Update article status
- `POST /api/articles/:filename/publish` - Publish article
- `DELETE /api/articles/:filename` - Delete article

## Article Data Format

Articles are JSON files with structure:
```json
{
  "title": "Article Title",
  "content": "# Markdown Content",
  "tags": ["health", "medical"],
  "category": "Medical Conditions",
  "metaDescription": "SEO description",
  "featuredImage": "https://example.com/image.jpg",
  "author": "Medical Content Team",
  "dateCreated": "2025-07-10",
  "wordCount": 450
}
```

## Development Notes

- Backend serves on port 3001, frontend proxies API requests
- Uses `concurrently` to run both servers in development
- Frontend uses Create React App with TypeScript
- No linting or type checking commands are configured in package.json
- Testing is minimal (frontend has basic React testing setup)
- Uses WordPress Application Passwords for authentication