# 🚀 Getting Started

Quick setup guide to get the Medical Content Pipeline running locally.

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **WordPress site** with admin access
- **Git** (for cloning)

## Step 1: Clone the Repository

```bash
git clone https://github.com/jmartin-sudo/doc-social-content.git
cd doc-social-content
```

## Step 2: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

## Step 3: Set Up Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file with your WordPress credentials:**
   ```bash
   nano .env
   # or use your preferred editor
   ```

3. **Configure these required variables:**
   ```env
   # WordPress Configuration
   WORDPRESS_API_URL=https://your-wordpress-site.com
   WORDPRESS_USERNAME=your-wordpress-username
   WORDPRESS_APP_PASSWORD=your-app-password
   WORDPRESS_DEFAULT_CATEGORY_ID=814
   
   # Server Configuration
   PORT=3001
   REACT_APP_API_URL=http://localhost:3001
   ```

## Step 4: Create WordPress Application Password

1. **Log into your WordPress admin dashboard**
2. **Go to Users → Profile** (or Users → All Users → [Your User])
3. **Scroll down to "Application Passwords"** section
4. **Create a new Application Password:**
   - Enter name: "Medical Content Pipeline"
   - Click "Add New Application Password"
   - **Copy the generated password immediately** - you won't see it again!
5. **Use this password in your `.env` file** (not your regular login password)

## Step 5: Start the Application

```bash
# Start both backend and frontend in development mode
npm run dev
```

This command will:
- Start the Express backend on `http://localhost:3001`
- Start the React frontend on `http://localhost:3000`
- Automatically open your browser to the frontend

## Step 6: Verify Everything Works

1. **Open your browser to `http://localhost:3000`**
2. **You should see the Medical Content Pipeline interface**
3. **Click on an article to edit it**
4. **Try the "👁️ Preview" button to see markdown rendering**
5. **Test publishing** (optional - this will create a real post on your WordPress site)

## Troubleshooting

### Backend won't start
- Check that port 3001 is not in use
- Verify your `.env` file exists and has correct values
- Run `npm install` again to ensure dependencies are installed

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check that `REACT_APP_API_URL=http://localhost:3001` in your `.env`
- Try refreshing the browser

### WordPress publishing fails
- Verify your WordPress site URL is correct and accessible
- Check that your username and application password are correct
- Ensure WordPress REST API is enabled (it usually is by default)
- Make sure your WordPress user has publishing permissions

### "No articles found"
- The system comes with sample articles in the `content/` directory
- If they're not showing, check the `data/articles.json` file exists
- Restart the backend server

## Next Steps

- **Edit articles** using the markdown editor with live preview
- **Create new articles** by adding JSON files to the `content/` directory
- **Customize categories** by updating the `WORDPRESS_DEFAULT_CATEGORY_ID`
- **Deploy to production** using the deployment guides in the main README

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the [CLAUDE.md](CLAUDE.md) file for development guidelines
- Look at existing articles in `content/` for format examples

---

**🎉 You're ready to start managing medical content!**