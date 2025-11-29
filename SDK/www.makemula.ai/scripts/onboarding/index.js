require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { uploadJsonToS3 } = require('../../services/encore.js');

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

// Site configuration
const SITES = {
  'brit.co': '#proj-mula-brit',
  'spotcovery.com': '#proj-mula-spotcovery',
  'gritdaily.com': '#proj-mula-gritdaily',
  'defpen.com': '#proj-mula-defpen',
  'reviews.allwomenstalk.com': '#proj-mula-allwomenstalk'
};

async function checkSite(url) {
  console.log('🔍 Starting health check for:', url);
  
  const browser = await puppeteer.launch({
    headless: process.env.NODE_ENV !== 'development',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36');
    
    // Intercept and ignore image requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (resourceType === 'image') {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // If url is a string (domain), add https://, otherwise use as is
    const fullUrl = typeof url === 'string' && !url.startsWith('http') 
      ? `https://${url}?mulaAuto=1`
      : `${url}?mulaAuto=1`;
      
    console.log('🔍 Navigating to:', fullUrl);
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for either the mula.js script to load or timeout
    try {
      await page.waitForFunction(() => {
        const scripts = Array.from(document.getElementsByTagName('script'));
        return scripts.some(script => script.src.includes('cdn.makemula.ai/js/mula.js'));
      }, { timeout: 30000 });
    } catch (error) {
      // If the script doesn't load within 30 seconds, continue with the check
      console.log(`Timeout waiting for mula.js on ${url}`);
    }

    // Check for mula.js script
    const mulaScriptLoaded = await page.evaluate(() => {
      const scripts = Array.from(document.getElementsByTagName('script'));
      return scripts.some(script => script.src.includes('cdn.makemula.ai/js/mula.js'));
    });
    
    let adTagPresent = false;
    let skimLinksIdPresent = false;
    let organicConfigAuto = false;

    if (mulaScriptLoaded) {
      // Wait up to 10s for window.Mula.adTag
      try {
        await page.waitForFunction(() => window.Mula && window.Mula.adTag, { timeout: 20000 });
        adTagPresent = true;
      } catch (e) {
        adTagPresent = false;
      }

      // Wait up to 10s for window.Mula.SkimLinksId
      try {
        await page.waitForFunction(() => window.Mula && window.Mula.SkimLinksId, { timeout: 20000 });
        skimLinksIdPresent = true;
      } catch (e) {
        skimLinksIdPresent = false;
      }

      // Wait up to 10s for window.Mula.organicConfig?.auto
      try {
        await page.waitForFunction(() => window.Mula && window.Mula.organicConfig && window.Mula.auto, { timeout: 20000 });
        organicConfigAuto = true;
      } catch (e) {
        organicConfigAuto = false;
      }
    }

    return {
      url,
      mulaScriptLoaded,
      adTagPresent,
      skimLinksIdPresent,
      poweredOn: organicConfigAuto
    };
  } catch (error) {
    console.error(`Error checking ${url}:`, error);
    return {
      url,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const results = [];
  
  for (const [domain, channel] of Object.entries(SITES)) {
    const siteResult = await checkSite(domain);
    console.log("siteResult", JSON.stringify(siteResult));
    results.push(siteResult);
    
    // Write individual site report to S3
    if(!siteResult.error) {
      const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
      let s3Key = `fakehost/health-reports/${domain}/${today}.json`;
      if(process.env.NODE_ENV !== 'production') {
        s3Key = `fakehost/data/health-reports/${domain}/${today}.json`;
      }

      // uploadJsonToS3 expects a URL string for the key, so fake a URL
      await uploadJsonToS3(`s3://${s3Key}`, siteResult);
    }
  }
}

// Only run main() if this file is being run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkSite }; 