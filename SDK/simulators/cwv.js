import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const NUM_ITERATIONS = 3;

// Mobile device settings (Pixel 5)
const MOBILE_DEVICE = {
  viewport: {
    width: 393,
    height: 851,
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    isLandscape: false
  },
  userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
};

// LTE network conditions (based on Chrome DevTools presets)
const LTE_NETWORK = {
  offline: false,
  downloadThroughput: (12 * 1024 * 1024) / 8, // 12 Mbps
  uploadThroughput: (5 * 1024 * 1024) / 8, // 5 Mbps
  latency: 70 // ms
};

async function runLighthouseAudit(url, port) {
  const result = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance'],
    disableStorageReset: false,
    formFactor: 'mobile',
    throttling: {
      // Use same LTE values for Lighthouse
      throughputKbps: 12 * 1024, // 12 Mbps
      rttMs: 70,
      cpuSlowdownMultiplier: 4 // Simulate mid-tier mobile CPU
    }
  });

  const audits = result.lhr.audits;

  return {
    LCP: parseFloat(audits['largest-contentful-paint'].numericValue.toFixed(2)),
    CLS: parseFloat(audits['cumulative-layout-shift'].numericValue.toFixed(4)),
    FID: parseFloat(audits['max-potential-fid'].numericValue.toFixed(2)),
    TBT: parseFloat(audits['total-blocking-time'].numericValue.toFixed(2)),
    TTI: parseFloat(audits['interactive'].numericValue.toFixed(2)),
    Score: result.lhr.categories.performance.score,
  };
}

async function runBaselineAudit(url) {
  const chrome = await chromeLauncher.launch({ 
    chromeFlags: [
      '--headless',
      '--enable-features=NetworkService',
      '--no-sandbox'
    ]
  });
  const results = await runLighthouseAudit(url, chrome.port);
  await chrome.kill();
  return results;
}

async function runModifiedAudit(url) {
  const chrome = await chromeLauncher.launch({ 
    chromeFlags: [
      '--headless',
      '--enable-features=NetworkService',
      '--no-sandbox'
    ]
  });
  const browser = await puppeteer.connect({ browserURL: `http://localhost:${chrome.port}` });
  const page = await browser.newPage();

  // Set mobile device emulation
  await page.emulate(MOBILE_DEVICE);

  // Enable network interception for throttling
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', LTE_NETWORK);

  let mulaScripts = new Map();

  client.on('Network.responseReceived', (event) => {
    const url = event.response.url;
    if (url.includes('cdn.makemula.ai')) {
      mulaScripts.set(event.requestId, {
        url,
        uncompressedSize: 0,
        transferSize: 0,
        encoding: event.response.headers['content-encoding'] || 'none'
      });
    }
  });

  client.on('Network.loadingFinished', (event) => {
    if (mulaScripts.has(event.requestId)) {
      const script = mulaScripts.get(event.requestId);
      script.transferSize = event.encodedDataLength;
      mulaScripts.set(event.requestId, script);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('cdn.makemula.ai')) {
      try {
        const request = response.request();
        const requestId = request._requestId;
        
        if (mulaScripts.has(requestId)) {
          const script = mulaScripts.get(requestId);
          const buffer = await response.buffer();
          script.uncompressedSize = buffer.length;
          mulaScripts.set(requestId, script);
        }
      } catch (e) {
        console.error('Error measuring script size:', e.message);
      }
    }
  });

  // Add Mula script to the page before navigation
  await page.evaluateOnNewDocument(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.makemula.ai/js/mula.js';
    script.defer = true;
    document.head.appendChild(script);
  });

  await page.goto(url, { waitUntil: 'networkidle0' });

  const results = await runLighthouseAudit(page.url(), chrome.port);
  
  await client.detach();
  await browser.disconnect();
  await chrome.kill();
  
  return { metrics: results, scripts: mulaScripts };
}

function averageResults(results) {
  const sum = {};
  const count = results.length;
  
  // Initialize sum object with first result's keys
  for (const key of Object.keys(results[0])) {
    sum[key] = 0;
  }
  
  // Sum all values
  for (const result of results) {
    for (const [key, value] of Object.entries(result)) {
      sum[key] += value;
    }
  }
  
  // Calculate averages
  const averages = {};
  for (const [key, value] of Object.entries(sum)) {
    averages[key] = parseFloat((value / count).toFixed(2));
  }
  
  return averages;
}

function compareMetrics(baseline, modified) {
  const diff = {};
  for (const key of Object.keys(baseline)) {
    if (key === 'Score') continue;
    const delta = modified[key] - baseline[key];
    diff[key] = {
      baseline: baseline[key],
      modified: modified[key],
      delta: parseFloat(delta.toFixed(2)),
    };
  }
  return diff;
}

function printCWVComparison(diff) {
  console.log('\n📊 Core Web Vitals Comparison (Modified - Baseline) - Averaged over', NUM_ITERATIONS, 'runs:\n');
  for (const [metric, values] of Object.entries(diff)) {
    const direction = values.delta > 0 ? '⬆️' : values.delta < 0 ? '⬇️' : '➡️';
    const sign = values.delta > 0 ? '+' : '';
    console.log(`${metric}: ${values.baseline} → ${values.modified} (${sign}${values.delta} ms) ${direction}`);
  }
}

function printTaxReport(diff) {
  console.log('\n💸 Performance Tax from `mula.js`:\n');
  for (const [metric, values] of Object.entries(diff)) {
    const percentChange = (values.delta / values.baseline) * 100;
    if (Math.abs(percentChange) < 5) {
      console.log(`⬜ ${metric} unchanged (${percentChange.toFixed(1)}% change)`);
    } else if (values.delta > 0) {
      console.log(`🟥 ${metric} worsened by ${values.delta} ms (${percentChange.toFixed(1)}% increase)`);
    } else {
      console.log(`🟩 ${metric} improved by ${Math.abs(values.delta)} ms (${Math.abs(percentChange).toFixed(1)}% decrease)`);
    }
  }
}

(async () => {
  const targetUrl = 'https://twist.win'; // Replace with your URL

  console.log(`🚀 Running ${NUM_ITERATIONS} baseline Lighthouse audits...`);
  const baselineResults = [];
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    console.log(`  Run ${i + 1}/${NUM_ITERATIONS}`);
    baselineResults.push(await runBaselineAudit(targetUrl));
  }
  const baseline = averageResults(baselineResults);
  console.log('✔️  Baseline (averaged):', baseline);

  console.log(`\n🧪 Running ${NUM_ITERATIONS} modified Lighthouse audits with Mula script...`);
  const modifiedResults = [];
  let scriptSizes;
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    console.log(`  Run ${i + 1}/${NUM_ITERATIONS}`);
    const result = await runModifiedAudit(targetUrl);
    modifiedResults.push(result.metrics);
    // Keep the last script sizes measurement
    scriptSizes = result.scripts;
  }
  const modified = averageResults(modifiedResults);
  console.log('✔️  Modified (averaged):', modified);

  const metricDiffs = compareMetrics(baseline, modified);

  // Report script sizes from the last run
  console.log('\n📦 Mula Script Sizes:\n');
  let totalTransferSize = 0;
  let totalUncompressedSize = 0;
  
  for (const script of scriptSizes.values()) {
    console.log(`${script.url}:`);
    console.log(`  Transfer Size (compressed): ${(script.transferSize / 1024).toFixed(2)} KB`);
    console.log(`  Resource Size (uncompressed): ${(script.uncompressedSize / 1024).toFixed(2)} KB`);
    console.log(`  Compression: ${script.encoding}`);
    totalTransferSize += script.transferSize;
    totalUncompressedSize += script.uncompressedSize;
  }
  
  console.log('\nTotals:');
  console.log(`  Transfer Size (compressed): ${(totalTransferSize / 1024).toFixed(2)} KB`);
  console.log(`  Resource Size (uncompressed): ${(totalUncompressedSize / 1024).toFixed(2)} KB`);
  if (totalUncompressedSize > 0) {
    console.log(`  Compression Ratio: ${(totalTransferSize / totalUncompressedSize * 100).toFixed(1)}%`);
  }

  printCWVComparison(metricDiffs);
  printTaxReport(metricDiffs);
})();
