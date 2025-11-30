# Duke Web App

**Duke - Onboarding & Placement Intelligence Web Dashboard**

A user-friendly web interface for Duke's technical onboarding and placement intelligence analysis.

## Features

- **SDK Health Check** - Verify Mula SDK deployment status
- **Traffic Distribution** - Analyze site traffic by category/sport
- **URL Pattern Discovery** - Automatically discover targeting patterns
- **SmartScroll Placement Intelligence** - Find optimal DOM placement for SmartScroll
- **Competitor Intelligence** - Detect competing native ad networks (Taboola, Outbrain, etc.)
- **Deployment Readiness** - Score and timeline for deployment

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Server runs on http://localhost:3002
```

## Usage

1. Open http://localhost:3002 in your browser
2. Enter a domain (e.g., `on3.com`)
3. Click "Analyze"
4. Review the results:
   - SDK Health Check
   - Traffic Distribution
   - URL Patterns
   - Placement Intelligence
   - Competitor Intelligence
   - Deployment Readiness Score

## API Endpoints

### `POST /api/analyze`

Analyze a domain for onboarding and placement intelligence.

**Request:**
```json
{
  "domain": "on3.com",
  "maxUrls": 15000
}
```

**Response:**
```json
{
  "domain": "on3.com",
  "analyzed_at": "2025-11-29T...",
  "health_check": { ... },
  "traffic_estimate": { ... },
  "url_patterns": [ ... ],
  "placement_intelligence": { ... },
  "competitor_intelligence": { ... },
  "deployment_readiness": { ... },
  "recommendations": [ ... ]
}
```

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "cache_size": 0,
  "agent": "Duke - Onboarding & Placement Intelligence"
}
```

### `POST /api/cache/clear`

Clear the analysis cache.

## Architecture

- **Backend**: Express.js server (`server.js`)
- **Frontend**: HTML + Tailwind CSS + Alpine.js (`public/index.html`)
- **Core Logic**: Uses `DukeOnboarding` from `../duke/src/onboard.js`

## Port

Default port: **3002** (configurable via `PORT` environment variable)

## Caching

Analysis results are cached for 1 hour to avoid re-analyzing the same domain.

## Related

- **Duke CLI**: `../duke/` - Command-line interface for Duke
- **Granny Web**: `../granny-web/` - Granny's web dashboard (port 3000)

