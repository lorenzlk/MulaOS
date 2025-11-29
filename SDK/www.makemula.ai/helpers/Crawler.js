const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { Readability } = require('@mozilla/readability');
const { JSDOM, VirtualConsole } = require('jsdom');
const { createLogger } = require('./LoggingHelpers');
const { withRetry } = require('./ProductHelpers');
const config = require('../config');

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

const logger = createLogger('Crawler');

/**
 * Crawl a URL and return the DOM for further processing
 * @param {string} url - The URL to crawl
 * @param {Object} options - Crawling options
 * @returns {Promise<Object>} The JSDOM object
 */
async function crawlDOM(url, options = {}) {
  logger.info('Starting DOM crawl', { url, options });

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
    await page.setUserAgent(config.crawler.userAgent);

    // Navigate to the URL with retry logic
    await withRetry(
      async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      },
      {
        maxAttempts: config.crawler.maxRetries,
        delay: config.crawler.retryDelay
      }
    );

    // Disable JavaScript to get clean HTML
    await page.setJavaScriptEnabled(false);
    
    // Wait for content to settle
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Get the cleaned-up HTML
    const htmlContent = await page.content();

    // Use JSDOM with a virtual console to suppress CSS parsing errors
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", () => {}); // Ignore JSDOM warnings

    const dom = new JSDOM(htmlContent, { url, virtualConsole });

    logger.info('DOM crawl completed', { url });

    return dom;
  } catch (error) {
    logger.error('DOM crawl failed', error, { url });
    throw error;
  } finally {
    await browser.close();
    logger.info('Browser closed', { url });
  }
}

/**
 * Crawl a URL and extract its content using Readability
 * @param {string} url - The URL to crawl
 * @param {Object} options - Crawling options
 * @returns {Promise<Object>} The crawled content
 */
async function crawl(url, options = {}) {
  logger.info('Starting crawl', { url, options });

  try {
    // Use the new crawlDOM method to get the DOM
    const dom = await crawlDOM(url, options);

    // Use Readability.js to extract article content
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to parse article content');
    }

    logger.info('Crawl completed', {
      url,
      title: article.title,
      contentLength: article.textContent.length
    });

    return article;
  } catch (error) {
    logger.error('Crawl failed', error, { url });
    throw error;
  }
}

/**
 * Helper function to auto-scroll the page to the bottom
 * @param {Page} page - Puppeteer page object
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const heightKillSwitch = 10000;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        totalHeight += distance;
        window.scrollBy(0, totalHeight);
        if (totalHeight >= scrollHeight || totalHeight >= heightKillSwitch) {
          window.scrollTo(0, 0); //scroll back to top to ensure you get the right article
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

module.exports = {
  crawl,
  crawlDOM,
  autoScroll
};