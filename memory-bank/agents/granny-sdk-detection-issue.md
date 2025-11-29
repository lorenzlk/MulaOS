# SDK Detection Issue - ON3

**Problem**: Granny cannot detect Mula SDK on ON3 even though it IS deployed.

## Evidence
- **Visual confirmation**: DevTools shows `cdn.makemula.ai` loading
- **Article URL tested**: `/teams/ohio-state-buckeyes/news/ohio-state-flips-lsu-legacy...`
- **Granny result**: ❌ "SDK not found"

## Root Cause

### ON3's GTM Deployment
ON3 deploys Mula SDK via **Google Tag Manager (GTM)**:
1. GTM loads on page
2. GTM conditionally injects Mula script
3. Script is added **dynamically** (not in initial HTML)

### Granny's Detection Method
Granny uses **cheerio** (static HTML parser):
1. Fetches page HTML
2. Parses with cheerio (like jQuery)
3. Looks for `<script src="*makemula*">`

**Problem**: GTM-injected scripts aren't in the initial HTML that cheerio parses.

## Why This Happens

```javascript
// What Granny sees (initial HTML):
<script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXX"></script>

// What actually loads (after GTM executes):
<script src="https://cdn.makemula.ai/sdk/1.5.9/js/mula.js"></script>  ← Added by JavaScript
```

Cheerio can't execute JavaScript, so it never sees the dynamically-added script tag.

## Solutions

### Option 1: Use Puppeteer (Browser Automation)
**Pro**: Can detect dynamically-loaded scripts  
**Con**: Slower (~5-10 seconds per check), requires Chrome

```javascript
const puppeteer = require('puppeteer');

async checkWithBrowser(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Wait for scripts to load
  await page.waitForTimeout(2000);
  
  // Check if Mula script loaded
  const mulaScript = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script'))
      .find(s => s.src.includes('makemula'));
  });
  
  await browser.close();
  return !!mulaScript;
}
```

### Option 2: Check for Mula Widget Elements
**Pro**: Fast, works with cheerio  
**Con**: Only works if widget actually renders

```javascript
// Look for Mula-specific elements instead of script tag
const mulaWidgets = $(
  '.mula-widget, ' +
  '[data-mula], ' +
  '[id*="mula"], ' +
  '.smartscroll-container'
);

if (mulaWidgets.length > 0) {
  return { sdk_present: true, method: 'widget_detected' };
}
```

### Option 3: Check Mula's Database
**Pro**: 100% accurate, instant  
**Con**: Requires database access, only works for known deployments

```javascript
const deployment = await db.query(`
  SELECT * FROM deployments
  WHERE domain = :domain
    AND status = 'active'
`, { domain });

if (deployment) {
  return {
    sdk_present: true,
    method: 'database',
    deployment_date: deployment.created_at
  };
}
```

### Option 4: Network Request Detection
**Pro**: Catches actual SDK loads  
**Con**: Requires browser automation or proxy

```javascript
// Monitor network requests for makemula.ai
const requests = await page.on('request', request => {
  if (request.url().includes('makemula')) {
    sdkDetected = true;
  }
});
```

## Recommendation

**Short-term**: Combine Options 2 + 3
1. Check for widget elements (fast, works often)
2. Fall back to database check (accurate for known sites)
3. If both fail, assume not deployed

**Long-term**: Add Puppeteer as optional enhancement
- Flag: `--deep-check` enables browser automation
- Use for new prospects (where accuracy matters most)
- Skip for known deployments (use database)

## Implementation

```javascript
async checkSdkDeployment(domain, options = {}) {
  // Method 1: Check database (instant, 100% accurate for known sites)
  const dbResult = await this.checkDatabase(domain);
  if (dbResult.deployed) {
    return { ...dbResult, method: 'database' };
  }
  
  // Method 2: Check for widget elements (fast, works ~60% of time)
  const widgetResult = await this.checkForWidgets(domain);
  if (widgetResult.deployed) {
    return { ...widgetResult, method: 'widget_elements' };
  }
  
  // Method 3: Check script tags (fast, works for direct deployment)
  const scriptResult = await this.checkScriptTag(domain);
  if (scriptResult.deployed) {
    return { ...scriptResult, method: 'script_tag' };
  }
  
  // Method 4: Deep check with browser (slow, use only if requested)
  if (options.deepCheck) {
    const browserResult = await this.checkWithBrowser(domain);
    if (browserResult.deployed) {
      return { ...browserResult, method: 'browser_automation' };
    }
  }
  
  // Not found
  return {
    deployed: false,
    methods_tried: ['database', 'widgets', 'script_tag'],
    note: 'SDK may be deployed via GTM (requires --deep-check to verify)'
  };
}
```

## Status

- [x] Identified root cause (GTM dynamic loading)
- [x] Documented solutions
- [ ] Implement database check (Option 3) - **RECOMMENDED NEXT**
- [ ] Implement widget element check (Option 2)
- [ ] Add Puppeteer deep-check (Option 1) - Optional

## Notes

This is a **common issue** for any static HTML parser trying to detect dynamically-loaded scripts. The solution depends on our priorities:
- **Speed**: Use database + widget checks
- **Accuracy**: Use Puppeteer (slower but catches everything)
- **Balance**: Database → Widgets → Script → (optional) Browser

For ON3 specifically: We KNOW it's deployed, so we should just check the database first.

