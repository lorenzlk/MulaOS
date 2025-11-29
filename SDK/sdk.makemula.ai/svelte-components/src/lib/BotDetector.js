/**
 * Bot Detection Module for Mula SDK
 * 
 * Comprehensive bot detection that identifies common bots, crawlers, and automated tools
 * to prevent unnecessary resource usage and analytics pollution.
 * 
 * Detection methods:
 * - User agent pattern matching
 * - Browser feature analysis
 * - Automation framework detection
 * - Headless browser identification
 * - Behavioral pattern analysis
 * - Query parameter detection
 */

/**
 * Comprehensive bot detection function
 * Detects common bots, crawlers, and automated tools
 * @param {Function} log - Logger function for debugging
 * @returns {Object} {isBot: boolean, botName: string|null} - Detection result and bot name
 */
export const isBot = (log = console.log) => {
  try {
    // Check user agent for common bot patterns
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Define bot patterns with their names
    const botPatterns = [
      // Search engine bots
      { pattern: 'googlebot', name: 'Googlebot' },
      { pattern: 'bingbot', name: 'Bingbot' },
      { pattern: 'slurp', name: 'Yahoo Slurp' },
      { pattern: 'duckduckbot', name: 'DuckDuckGo Bot' },
      { pattern: 'baiduspider', name: 'Baidu Spider' },
      { pattern: 'yandexbot', name: 'Yandex Bot' },
      { pattern: 'facebookexternalhit', name: 'Facebook External Hit' },
      // Social media crawlers
      { pattern: 'twitterbot', name: 'Twitter Bot' },
      { pattern: 'linkedinbot', name: 'LinkedIn Bot' },
      { pattern: 'whatsapp', name: 'WhatsApp Bot' },
      { pattern: 'telegrambot', name: 'Telegram Bot' },
      { pattern: 'discordbot', name: 'Discord Bot' },
      { pattern: 'slackbot', name: 'Slack Bot' },
      // SEO and analytics tools
      { pattern: 'ahrefsbot', name: 'Ahrefs Bot' },
      { pattern: 'semrushbot', name: 'SEMrush Bot' },
      { pattern: 'mj12bot', name: 'MJ12 Bot' },
      { pattern: 'dotbot', name: 'DotBot' },
      { pattern: 'sistrixcrawler', name: 'Sistrix Crawler' },
      { pattern: 'screaming frog', name: 'Screaming Frog' },
      // Monitoring and testing tools
      { pattern: 'pingdom', name: 'Pingdom' },
      { pattern: 'uptimerobot', name: 'UptimeRobot' },
      { pattern: 'statuscake', name: 'StatusCake' },
      { pattern: 'gtmetrix', name: 'GTmetrix' },
      { pattern: 'pagespeed', name: 'PageSpeed Insights' },
      { pattern: 'lighthouse', name: 'Lighthouse' },
      // Headless browsers and automation
      { pattern: 'headlesschrome', name: 'Headless Chrome' },
      { pattern: 'phantomjs', name: 'PhantomJS' },
      { pattern: 'selenium', name: 'Selenium' },
      { pattern: 'webdriver', name: 'WebDriver' },
      { pattern: 'puppeteer', name: 'Puppeteer' },
      { pattern: 'playwright', name: 'Playwright' },
      // AI and ML tools
      { pattern: 'openai', name: 'OpenAI Bot' },
      { pattern: 'gpt', name: 'GPT Bot' },
      { pattern: 'claude', name: 'Claude Bot' },
      { pattern: 'bard', name: 'Bard Bot' },
      { pattern: 'copilot', name: 'Copilot Bot' },
      { pattern: 'chatgpt', name: 'ChatGPT Bot' },
      // Generic bot indicators (check these last)
      { pattern: 'bot', name: 'Generic Bot' },
      { pattern: 'crawler', name: 'Generic Crawler' },
      { pattern: 'spider', name: 'Generic Spider' },
      { pattern: 'scraper', name: 'Generic Scraper' },
      { pattern: 'scanner', name: 'Generic Scanner' },
      { pattern: 'monitor', name: 'Generic Monitor' },
      { pattern: 'checker', name: 'Generic Checker' },
      { pattern: 'validator', name: 'Generic Validator' }
    ];

    // Check if user agent contains any bot patterns and get the bot name
    let detectedBot = null;
    let hasBotPattern = false;
    
    for (const bot of botPatterns) {
      if (userAgent.includes(bot.pattern)) {
        detectedBot = bot.name;
        hasBotPattern = true;
        break; // Use the first match (more specific patterns should come first)
      }
    }
    
    // Check for missing or suspicious browser features that bots often lack
    const hasSuspiciousFeatures = (
      // Missing common browser APIs (but be more lenient)
      (!window.chrome && !userAgent.includes('firefox') && !userAgent.includes('safari')) || 
      // Missing or minimal screen properties
      !screen.width || screen.width < 50 ||
      !screen.height || screen.height < 50 ||
      // Missing or suspicious navigator properties
      !navigator.language ||
      !navigator.platform ||
      navigator.webdriver === true ||
      // Missing common event listeners capability
      typeof window.addEventListener !== 'function'
    );

    // Check for automation indicators and identify specific automation tools
    let automationBot = null;
    const hasAutomationIndicators = (
      // WebDriver properties
      navigator.webdriver === true ||
      window.webdriver === true ||
      // Automation frameworks
      window.phantom || window.callPhantom ||
      window._phantom || window.__phantom ||
      // Selenium indicators
      window.domAutomation || window.domAutomationController ||
      // Playwright indicators
      window.playwright || window.__playwright ||
      // Puppeteer indicators
      window.puppeteer || window.__puppeteer
    );

    // Identify specific automation tool
    if (hasAutomationIndicators) {
      if (window.phantom || window.callPhantom || window._phantom || window.__phantom) {
        automationBot = 'PhantomJS';
      } else if (window.playwright || window.__playwright) {
        automationBot = 'Playwright';
      } else if (window.puppeteer || window.__puppeteer) {
        automationBot = 'Puppeteer';
      } else if (window.domAutomation || window.domAutomationController) {
        automationBot = 'Selenium';
      } else if (navigator.webdriver === true || window.webdriver === true) {
        automationBot = 'WebDriver';
      }
    }

    // Check for headless browser indicators
    const isHeadless = (
      // Missing plugins that real browsers have (but allow for privacy-focused browsers)
      (navigator.plugins.length === 0 && !userAgent.includes('firefox')) ||
      // Missing WebGL context (more reliable indicator)
      !document.createElement('canvas').getContext('webgl') ||
      // Missing or suspicious timezone
      !Intl.DateTimeFormat().resolvedOptions().timeZone
    );

    // Check for suspicious behavior patterns
    const hasSuspiciousBehavior = (
      // Very fast page load (bots often load instantly) - but only if extremely fast
      performance.now() < 1 ||
      // Missing touch events capability (but only on mobile devices)
      (!('ontouchstart' in window) && navigator.maxTouchPoints === 0 && /mobile|android|iphone|ipad/i.test(userAgent)) ||
      // Missing or minimal viewport
      window.innerWidth < 50 || window.innerHeight < 50
    );

    // Check for common bot headers or properties
    let headerBot = null;
    const hasBotHeaders = (
      // Check for bot-specific headers if available
      (window.location.search.includes('bot=1') || 
       window.location.search.includes('crawler=1') ||
       window.location.search.includes('spider=1')) ||
      // Check for bot-specific window properties
      window.bot === true ||
      window.crawler === true ||
      window.spider === true
    );

    // Identify bot from headers/properties
    if (hasBotHeaders) {
      if (window.location.search.includes('bot=1') || window.bot === true) {
        headerBot = 'Query Parameter Bot';
      } else if (window.location.search.includes('crawler=1') || window.crawler === true) {
        headerBot = 'Query Parameter Crawler';
      } else if (window.location.search.includes('spider=1') || window.spider === true) {
        headerBot = 'Query Parameter Spider';
      }
    }

    // Combine all detection methods
    const botDetected = hasBotPattern || 
                       hasSuspiciousFeatures || 
                       hasAutomationIndicators || 
                       isHeadless || 
                       hasSuspiciousBehavior || 
                       hasBotHeaders;

    // Determine the most specific bot name
    let finalBotName = null;
    if (detectedBot) {
      finalBotName = detectedBot;
    } else if (automationBot) {
      finalBotName = automationBot;
    } else if (headerBot) {
      finalBotName = headerBot;
    } else if (hasSuspiciousFeatures) {
      finalBotName = 'Suspicious Browser';
    } else if (isHeadless) {
      finalBotName = 'Headless Browser';
    } else if (hasSuspiciousBehavior) {
      finalBotName = 'Suspicious Behavior';
    }

    if (botDetected) {
      log(`Bot detected: ${finalBotName || 'Unknown Bot'} - UserAgent: ${userAgent}, Features: ${hasSuspiciousFeatures}, Automation: ${hasAutomationIndicators}, Headless: ${isHeadless}, Behavior: ${hasSuspiciousBehavior}, Headers: ${hasBotHeaders}`);
    }

    return { isBot: botDetected, botName: finalBotName };
  } catch (error) {
    // If bot detection fails, assume it's a real user to avoid false positives
    log(`Bot detection error: ${error.message}, assuming real user`);
    return { isBot: false, botName: null };
  }
};

/**
 * Quick bot detection for performance-critical scenarios
 * Uses only the most reliable detection methods
 * @param {Function} log - Logger function for debugging
 * @returns {Object} {isBot: boolean, botName: string|null} - Detection result and bot name
 */
export const isBotQuick = (log = console.log) => {
  try {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Quick bot patterns with names
    const quickBotPatterns = [
      { pattern: 'googlebot', name: 'Googlebot' },
      { pattern: 'bingbot', name: 'Bingbot' },
      { pattern: 'slurp', name: 'Yahoo Slurp' },
      { pattern: 'webdriver', name: 'WebDriver' },
      { pattern: 'selenium', name: 'Selenium' },
      { pattern: 'puppeteer', name: 'Puppeteer' },
      { pattern: 'playwright', name: 'Playwright' },
      { pattern: 'bot', name: 'Generic Bot' },
      { pattern: 'crawler', name: 'Generic Crawler' },
      { pattern: 'spider', name: 'Generic Spider' }
    ];
    
    // Check for user agent patterns
    let detectedBot = null;
    const hasBotPattern = quickBotPatterns.some(bot => {
      if (userAgent.includes(bot.pattern)) {
        detectedBot = bot.name;
        return true;
      }
      return false;
    });
    
    const hasWebDriver = navigator.webdriver === true || window.webdriver === true;
    let webDriverBot = null;
    if (hasWebDriver) {
      webDriverBot = 'WebDriver';
    }
    
    const botDetected = hasBotPattern || hasWebDriver;
    const botName = detectedBot || webDriverBot;
    
    if (botDetected) {
      log(`Quick bot detection: ${botName || 'Unknown Bot'} - UserAgent: ${userAgent}, WebDriver: ${hasWebDriver}`);
    }
    
    return { isBot: botDetected, botName };
  } catch (error) {
    log(`Quick bot detection error: ${error.message}, assuming real user`);
    return { isBot: false, botName: null };
  }
};

/**
 * Test bot detection with various scenarios
 * Useful for debugging and validation
 * @param {Function} log - Logger function for debugging
 * @returns {Object} Test results
 */
export const testBotDetection = (log = console.log) => {
  const botDetection = isBot(log);
  const results = {
    botDetection,
    userAgent: navigator.userAgent,
    webdriver: navigator.webdriver,
    plugins: navigator.plugins.length,
    languages: navigator.languages.length,
    screenSize: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    performanceTime: performance.now()
  };
  
  log('Bot detection test results:', results);
  return results;
};
