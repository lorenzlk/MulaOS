# Database Integration Guide

**Status**: 🟡 **Database integration code ready but DISABLED** (no database access yet)

---

## Current State

Granny works **without database access**:
- ✅ SDK detection via script tag checking
- ✅ Traffic analysis via sitemap/RSS
- ✅ URL pattern discovery
- ✅ All functionality works for new prospects

## When Database Access is Available

### Step 1: Install Database Dependencies

```bash
cd /Users/loganlorenz/MulaOS/granny
npm install sequelize pg pg-hstore
```

### Step 2: Set DATABASE_URL

```bash
# Option A: Environment variable
export DATABASE_URL="postgres://user:pass@host:5432/mula_production"

# Option B: .env file (recommended)
echo "DATABASE_URL=postgres://user:pass@host:5432/mula_production" > .env
npm install dotenv

# Add to src/index.js (top of file):
require('dotenv').config();
```

### Step 3: Enable Database Code

**File**: `src/healthcheck/SdkHealthCheck.js`

**Uncomment lines 20-43** (the database check block):

```javascript
// Change from:
/*
if (process.env.DATABASE_URL) {
  const DatabaseHelper = require('../helpers/DatabaseHelper');
  // ... database check code
}
*/

// To:
if (process.env.DATABASE_URL) {
  const DatabaseHelper = require('../helpers/DatabaseHelper');
  // ... database check code
}
```

### Step 4: Test

```bash
node src/onboard.js on3.com

# Expected output:
# ✅ SDK deployed (verified via database)
# 📅 Deployment date: 9/15/2024
# 💬 Slack channel: #proj-mula-on3
```

---

## Database Schema

### Tables Granny Queries

#### 1. `domain_channel_mappings`
**Purpose**: Tracks which domains have Mula deployed

```sql
CREATE TABLE domain_channel_mappings (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL UNIQUE,
  "channelId" VARCHAR(255) NOT NULL,
  "channelName" VARCHAR(255) NOT NULL,
  "displayName" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);
```

**Example data**:
```
domain          | channelName        | displayName | createdAt
----------------|-------------------|-------------|------------
www.on3.com     | #proj-mula-on3    | ON3         | 2024-09-15
brit.co         | #proj-mula-brit   | Brit + Co   | 2024-08-20
```

#### 2. `site_targeting` (Future use)
**Purpose**: Targeting rules for each domain

```sql
CREATE TABLE site_targeting (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  path_type VARCHAR(50),
  match_value TEXT NOT NULL,
  search_phrase TEXT NOT NULL,
  status VARCHAR(50),
  "deletedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);
```

**Example data**:
```
domain      | path_type      | match_value                     | search_phrase
------------|----------------|--------------------------------|---------------------------
www.on3.com | path_substring | /teams/ohio-state-buckeyes/news| Ohio State Buckeyes Football
www.on3.com | path_substring | /teams/michigan-wolverines/news| Michigan Wolverines Football
```

---

## Files Ready for Database Integration

### ✅ Already Built

1. **`src/helpers/DatabaseHelper.js`**
   - Sequelize setup matching Mula SDK
   - `checkDeployment(domain)` - Query domain_channel_mappings
   - `getExistingTargeting(domain)` - Query site_targeting (for optimize mode)
   - Connection pooling, SSL handling
   - Error handling

2. **`src/healthcheck/SdkHealthCheck.js`**
   - Database check is first method (commented out)
   - Falls back to script tag checking
   - Returns deployment metadata when available

### 🔄 Future Enhancements

**`src/onboard.js`** - Could use database for:
- Traffic distribution (if site already deployed, use Mula event data)
- Existing targeting rules (show what's currently configured)
- Performance baselines (CTR, revenue from actual data)

**`src/context.js`** - Could use database for:
- Historical performance comparison
- A/B test results
- Seasonal trends from past years

---

## Benefits of Database Integration

### Without Database (Current)
- ❌ Can't detect GTM-deployed sites (false negatives)
- ❌ No deployment history (when was it deployed?)
- ❌ No existing targeting rules (what's already configured?)
- ❌ No performance data (how is it performing?)

### With Database (Future)
- ✅ **100% accurate SDK detection** (query domain_channel_mappings)
- ✅ **Deployment metadata** (date, Slack channel, display name)
- ✅ **Existing targeting** (see current rules, suggest improvements)
- ✅ **Performance insights** (query Mula event data for real metrics)
- ✅ **Optimization mode** (compare current vs optimal targeting)

---

## Alternative: Google Sheets

If Postgres access remains blocked, could use Google Sheets as read-only cache:

### Setup
1. **Create Google Sheet** with domain tracking
2. **Sync script** exports domain_channel_mappings to Sheets daily
3. **Granny reads from Sheets** via Google Sheets API

### Implementation
```javascript
// src/helpers/GoogleSheetsHelper.js
const { google } = require('googleapis');

class GoogleSheetsHelper {
  async checkDeployment(domain) {
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Deployments!A:D',
    });
    
    const rows = response.data.values;
    const deployment = rows.find(row => row[0] === domain);
    
    if (deployment) {
      return {
        deployed: true,
        deployment_date: deployment[1],
        slack_channel: deployment[2],
        display_name: deployment[3]
      };
    }
    
    return { deployed: false };
  }
}
```

**Pros**: Works without direct database access  
**Cons**: Not real-time, requires sync script, more complex

---

## Recommendation

**Keep current approach**:
- ✅ Works independently (no database required)
- ✅ Database code ready to enable (1 line uncomment)
- ✅ Same Sequelize setup as Mula SDK (easy integration)
- ✅ Focus on new prospects (database not needed yet)

**When to enable database**:
- You get Postgres credentials
- You want to build "optimize" mode for deployed sites
- You need real performance data in reports

---

## Testing Without Database

```bash
# Should work fine:
node src/onboard.js essentiallysports.com  # New prospect
node src/onboard.js any-new-site.com       # New prospect

# Will show "not deployed" (expected without DB):
node src/onboard.js on3.com                # Already deployed (GTM)

# To test database integration:
1. Get DATABASE_URL
2. Uncomment database code
3. Run: node src/onboard.js on3.com
4. Should show: "✅ SDK deployed (verified via database)"
```

---

## Summary

- 🟢 **Granny works without database** (for new prospects)
- 🟡 **Database integration ready** (just needs credentials)
- 🔵 **Easy to enable** (uncomment 1 block, set 1 env var)
- 🟣 **Same tech as Mula SDK** (Sequelize + Postgres)

**Database is optional, not required. Integration is ready when you are!** ✅

