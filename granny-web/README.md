# 🏄‍♂️ Granny Web App

**Publisher Intelligence Dashboard** - Analyze any publisher in 2 minutes

---

## Quick Start

```bash
# 1. Install dependencies
cd /Users/loganlorenz/MulaOS/granny-web
npm install

# 2. Start server
npm start

# 3. Open browser
open http://localhost:3000
```

---

## Features

### ✅ Built
- **Domain Input** - Simple text field, instant analysis
- **SDK Health Check** - Detect Mula deployment
- **Traffic Distribution** - Visual bar charts of sport/category breakdown
- **URL Pattern Discovery** - Automatic targeting rule generation
- **Business Intelligence** - Publisher type, revenue model, tech stack
- **Ready-to-Deploy Commands** - Copy/paste Slack commands
- **JSON Export** - Download full analysis results
- **Caching** - 1-hour cache to avoid re-analysis
- **URL Sharing** - `?domain=example.com` for shareable links

### 🎨 UI/UX
- Clean, modern design (Tailwind CSS)
- Loading states with spinner
- Error handling with messages
- Responsive (works on mobile)
- Interactive charts (animated bars)
- One-click copy commands
- Quick example domains

---

## API Endpoints

### `POST /api/analyze`
Analyze a publisher domain

**Request:**
```json
{
  "domain": "essentiallysports.com"
}
```

**Response:**
```json
{
  "domain": "essentiallysports.com",
  "analyzed_at": "2025-11-28T23:00:00.000Z",
  "health_check": {
    "sdk_present": false,
    "detection_method": "script_tag",
    "errors": ["SDK not found"],
    "warnings": []
  },
  "traffic_estimate": {
    "distribution": {
      "nfl": { "percentage": 26, "rank": 1 },
      "boxing": { "percentage": 19, "rank": 2 }
    },
    "confidence": 77
  },
  "url_patterns": [
    {
      "pattern": "/nfl-news/*",
      "confidence": 75,
      "search_phrase": "NFL merchandise"
    }
  ],
  "business_intelligence": {
    "publisher_type": ["sports_focused"],
    "revenue_model": ["display_ads", "affiliate"]
  },
  "recommendations": [],
  "slack_commands": "/mula-site-targeting-add..."
}
```

### `GET /api/health`
Check server status

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "cache_size": 3
}
```

---

## Architecture

```
granny-web/
├── server.js              # Express server
├── public/
│   └── index.html         # Frontend (Alpine.js)
└── package.json

Dependencies:
├── express                # Web server
├── cors                   # CORS support
└── ../granny/             # Granny analysis engine
```

---

## Caching

**Strategy**: In-memory cache with 1-hour TTL

**Benefits:**
- ✅ Instant results for repeated analyses
- ✅ Reduces load on sitemap/RSS parsing
- ✅ Saves bandwidth

**Cache Key**: `analysis:{domain}`

**Clear cache:**
```bash
curl -X POST http://localhost:3000/api/cache/clear
```

---

## Deployment

### Option 1: Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd granny-web
vercel

# 3. Follow prompts
# Result: https://granny-web.vercel.app
```

### Option 2: Railway
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Deploy
railway login
railway init
railway up

# Result: https://granny-web.up.railway.app
```

### Option 3: Docker
```bash
# 1. Build image
docker build -t granny-web .

# 2. Run container
docker run -p 3000:3000 granny-web

# 3. Access
open http://localhost:3000
```

---

## Environment Variables

```bash
PORT=3000                    # Server port (default: 3000)
DATABASE_URL=postgres://...  # Optional: for DB-enabled features
NODE_ENV=production          # Environment
```

---

## Development

```bash
# Install dev dependencies
npm install

# Run with auto-reload
npm run dev

# The server will restart on file changes
```

---

## Usage Examples

### Web Interface
1. Open http://localhost:3000
2. Enter domain: `essentiallysports.com`
3. Click "Analyze"
4. View results (takes 30-60 seconds)
5. Copy Slack commands or download JSON

### Direct API Call
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"domain":"essentiallysports.com"}'
```

### Shareable URL
```
http://localhost:3000/?domain=essentiallysports.com
```

---

## Performance

**Typical Analysis Time:**
- SDK Check: 3-5 seconds
- Traffic Analysis: 20-40 seconds (depends on sitemap size)
- Pattern Discovery: 5-10 seconds
- Context Analysis: 3-5 seconds
- **Total: 30-60 seconds**

**With Cache:**
- Subsequent requests: <100ms (instant)

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### Analysis Times Out
```bash
# Increase timeout in server.js
# Or try with smaller domain (fewer URLs)
```

### Cache Issues
```bash
# Clear cache
curl -X POST http://localhost:3000/api/cache/clear

# Or restart server
npm start
```

---

## Future Enhancements

### Phase 2 (Next Week)
- [ ] PDF export
- [ ] Compare multiple domains
- [ ] Historical analysis tracking
- [ ] Email results

### Phase 3 (Next Month)
- [ ] Real-time progress updates (WebSocket)
- [ ] Interactive charts (Chart.js)
- [ ] Pattern visualization
- [ ] Opportunity scoring

---

## Tech Stack

**Frontend:**
- HTML5
- Tailwind CSS (utility-first styling)
- Alpine.js (reactive components)

**Backend:**
- Node.js 18+
- Express.js 4.x
- Granny SDK (analysis engine)

**Deployment:**
- Vercel / Railway / Docker
- Zero-config deployment

---

## Security

**Considerations:**
- ✅ Input sanitization (domain validation)
- ✅ CORS enabled (configurable)
- ✅ Rate limiting (TODO)
- ✅ No sensitive data stored

**Future:**
- Add rate limiting (express-rate-limit)
- Add authentication (optional)
- Add API keys for public deployment

---

## License

Part of Mula SDK - Internal tool

---

## Support

Issues? Contact @loganlorenz or post in #mula-internal

---

**Built with 🏄‍♂️ by the Mula team**

