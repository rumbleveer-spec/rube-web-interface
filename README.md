# 🤖 Rube Web Interface

> A beautiful web interface to interact with Rube AI automation platform

[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-4.18-blue)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

- 🎨 **Beautiful UI** - Modern, responsive interface
- ⚡ **Real-time Execution** - Execute Rube commands instantly
- 📊 **Result Display** - View formatted results
- 🚀 **Quick Commands** - Pre-built command shortcuts
- 💡 **Examples** - Learn with built-in examples

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS) → Backend (Node.js/Express) → Rube API
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ installed
- Rube API key
- Hostinger VPS or any server

### Installation

```bash
# Clone repository
git clone https://github.com/rumbleveer-spec/rube-web-interface.git
cd rube-web-interface

# Install backend dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your RUBE_API_KEY

# Start server
npm start
```

Visit: http://localhost:3000

## 📁 Project Structure

```
rube-web-interface/
├── backend/
│   ├── index.js          # Express server
│   ├── package.json      # Dependencies
│   └── .env             # Configuration
├── frontend/
│   ├── index.html       # UI
│   ├── style.css        # Styling
│   └── script.js        # Logic
├── .gitignore
└── README.md
```

## 🌐 Hostinger Deployment

### Step 1: Upload Files

```bash
# Via FTP or SSH
rsync -avz . user@your-server:/var/www/rube-web
```

### Step 2: Install Dependencies

```bash
ssh user@your-server
cd /var/www/rube-web/backend
npm install --production
```

### Step 3: Configure Environment

```bash
nano .env
# Add:
# RUBE_API_KEY=your_actual_api_key
# PORT=3000
```

### Step 4: Start with PM2

```bash
npm install -g pm2
pm2 start backend/index.js --name rube-web
pm2 save
pm2 startup
```

### Step 5: Configure Nginx (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Configuration

### Backend (.env)

```env
RUBE_API_KEY=your_rube_api_key_here
RUBE_SESSION_ID=web-interface
PORT=3000
NODE_ENV=production
```

## 📊 API Endpoints

### POST /api/execute

Execute a Rube command

**Request:**
```json
{
  "command": "send a slack message to #general"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Command executed successfully"
}
```

### GET /api/health

Check server health

**Response:**
```json
{
  "status": "OK",
  "message": "Backend is running"
}
```

## 💡 Usage Examples

### Email Automation
```
Send an email to john@example.com with subject "Meeting" and body "Tomorrow at 3 PM"
```

### Slack Integration
```
Post a message to #general: Team standup in 10 minutes
```

### Data Analysis
```
Fetch my Google Analytics data for last week and summarize
```

### Web Search
```
Search the web for latest AI news and summarize top 3 articles
```

## 🛠️ Development

```bash
# Install dev dependencies
npm install

# Run with auto-reload
npm run dev
```

## 🐛 Troubleshooting

### Backend not starting?
- Check if port 3000 is available
- Verify .env file exists with valid API key

### CORS errors?
- Ensure frontend and backend are on same domain
- Or configure CORS in backend/index.js

### Commands not executing?
- Verify RUBE_API_KEY is correct
- Check backend logs for errors

## 📝 License

MIT License - see LICENSE file

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

- GitHub Issues: [Report Bug](https://github.com/rumbleveer-spec/rube-web-interface/issues)
- Email: support@rube.app
- Documentation: [Rube Docs](https://rube.app/docs)

## 🙏 Acknowledgments

- Powered by [Rube](https://rube.app)
- Built with ❤️ by rumbleveer-spec

---

**Made with 🧠 Brain = Rube AI | 💪 Body = Your Code | 🌐 Server = Hostinger**
