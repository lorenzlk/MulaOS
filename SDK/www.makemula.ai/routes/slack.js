const express = require('express');
const crypto = require('crypto');
const { Page, Search } = require('../models');
const Bull = require('bull');

const { uploadJsonToS3, getFile } = require('../helpers/S3Helpers');
const { sendSlackMessage, sendSlackReply } = require('../helpers/SlackHelpers');
const { WebClient } = require('@slack/web-api');
const { parseNaturalLanguage } = require('../helpers/NaturalLanguageParser');
const { mapCommandToSlashCommand } = require('../helpers/CommandMapper');
const { executeCommand } = require('../helpers/CommandExecutor');
const { approvePageSearch } = require('../helpers/PageApprovalHelpers');
const { approveSearch } = require('../helpers/SearchApprovalHelpers');
const { 
  addDomainChannelMapping, 
  listDomainChannelMappings, 
  removeDomainChannelMapping 
} = require('../helpers/DomainChannelHelpers');
const { 
  addSiteTargeting, 
  listSiteTargeting, 
  removeSiteTargeting 
} = require('../helpers/SiteTargetingHelpers');
const { 
  addNextPageTargeting, 
  listNextPageTargeting, 
  removeNextPageTargeting,
  generateSectionName
} = require('../helpers/NextPageTargetingHelpers');
const { createSHA256Hash } = require('../helpers/URLHelpers');
const { getCredentialIds, getCredentialNames } = require('../config/credentials');

const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const performanceReportQueue = new Bull('performanceReportQueue', redisUrl);
const healthCheckQueue = new Bull('healthCheckQueue', redisUrl);
const searchQueue = new Bull('searchQueue', redisUrl);
const keywordFeedbackQueue = new Bull('keywordFeedbackQueue', redisUrl);
const encoreQueue = new Bull('encoreQueue', redisUrl); // Added encoreQueue
const productPerformanceQueue = new Bull('productPerformanceQueue', redisUrl);
const engagementReportQueue = new Bull('engagementReportQueue', redisUrl);
const taxonomyAnalysisQueue = new Bull('taxonomyAnalysisQueue', redisUrl); // Added taxonomyAnalysisQueue
const clickUrlsQueue = new Bull('clickUrlsQueue', redisUrl); // Added clickUrlsQueue
const siteSearchQueue = new Bull('siteSearchQueue', redisUrl); // Added siteSearchQueue
const nextPageBuildQueue = new Bull('nextPageBuildQueue', redisUrl); // Added nextPageBuildQueue

const router = express.Router();

// Middleware to verify Slack signature
const verifySlackRequest = (req, res, next) => {
  console.log('🔍 Starting Slack verification:', {
    url: req.url,
    hasBody: !!req.body,
    hasRawBody: !!req.rawBody,
    bodyType: typeof req.body,
    rawBodyType: req.rawBody ? typeof req.rawBody : 'undefined',
    headers: {
      signature: req.headers['x-slack-signature'],
      timestamp: req.headers['x-slack-request-timestamp'],
      hasSigningSecret: !!process.env.SLACK_SIGNING_SECRET
    }
  });

  // Skip signature verification for URL verification
  if (req.body && req.body.type === 'url_verification') {
    console.log('🔍 Skipping verification for URL verification request');
    return next();
  }

  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signature || !timestamp || !signingSecret) {
    console.error('❌ Missing required headers or signing secret:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hasSigningSecret: !!signingSecret
    });
    return res.status(400).send('Missing required headers or signing secret');
  }

  // Verify timestamp is within 5 minutes
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
  if (timestamp < fiveMinutesAgo) {
    console.error('❌ Request too old:', {
      timestamp,
      fiveMinutesAgo,
      difference: fiveMinutesAgo - timestamp
    });
    return res.status(400).send('Request too old');
  }

  // Create the signature base string using raw body
  if (!req.rawBody) {
    console.error('❌ No raw body available for signature verification');
    return res.status(400).send('No raw body available for signature verification');
  }

  const sigBasestring = `v0:${timestamp}:${req.rawBody.toString()}`;
  console.log('🔍 Signature base string:', {
    timestamp,
    rawBodyLength: req.rawBody.length,
    sigBasestringLength: sigBasestring.length
  });

  // Create the signature
  const mySignature = `v0=${crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex')}`;

  console.log('🔍 Signature comparison:', {
    received: signature,
    calculated: mySignature,
    match: crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature)
    )
  });

  // Verify the signature
  if (crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  )) {
    console.log('✅ Signature verified successfully');
    next();
  } else {
    console.error('❌ Invalid signature received');
    res.status(400).send('Invalid signature');
  }
};

// Events endpoint for Slack Event Subscriptions (app_mentions, etc.)
// This must be BEFORE verifySlackRequest middleware to handle url_verification
router.post('/events', async (req, res) => {
  console.log('🔍 Processing Slack event:', {
    type: req.body?.type,
    event: req.body?.event?.type,
    hasText: !!req.body?.event?.text
  });

  try {
    // Handle URL verification challenge (required for Event Subscriptions)
    // This happens BEFORE signature verification, so we handle it directly
    if (req.body.type === 'url_verification') {
      console.log('✅ URL verification challenge received');
      return res.json({ challenge: req.body.challenge });
    }

    // For event_callback, we need signature verification
    // So we'll use the middleware for those, but handle url_verification here
    // Actually, we need to verify signature for event_callback too
    // Let's verify signature manually for events endpoint
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    if (req.body.type === 'event_callback') {
      // Verify signature for event callbacks
      if (!signature || !timestamp || !signingSecret) {
        console.error('❌ Missing required headers for event callback');
        return res.status(400).send('Missing required headers');
      }

      // Verify timestamp
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
      if (timestamp < fiveMinutesAgo) {
        console.error('❌ Request too old');
        return res.status(400).send('Request too old');
      }

      // Verify signature
      if (!req.rawBody) {
        console.error('❌ No raw body available for signature verification');
        return res.status(400).send('No raw body available');
      }

      const sigBasestring = `v0:${timestamp}:${req.rawBody.toString()}`;
      const mySignature = `v0=${crypto
        .createHmac('sha256', signingSecret)
        .update(sigBasestring)
        .digest('hex')}`;

      if (!crypto.timingSafeEqual(
        Buffer.from(mySignature),
        Buffer.from(signature)
      )) {
        console.error('❌ Invalid signature for event callback');
        return res.status(400).send('Invalid signature');
      }

      // Signature verified, process event
      const event = req.body.event;

      // Handle app_mention (when someone @mentions MulaBot)
      // Note: Slack sends 'app_mention' (singular), not 'app_mentions'
      if (event.type === 'app_mention') {
        console.log('📨 App mention received:', {
          user: event.user,
          text: event.text,
          channel: event.channel,
          ts: event.ts
        });

        // Extract the message text (remove the @MulaBot mention)
        const botUserId = req.body.authorizations?.[0]?.user_id || event.text.match(/<@([A-Z0-9]+)>/)?.[1];
        const messageText = event.text
          .replace(/<@[A-Z0-9]+>/g, '') // Remove @mentions
          .trim();

        if (!messageText) {
          return res.status(200).json({ ok: true }); // Acknowledge but don't respond
        }

        // Acknowledge the event immediately (Slack requires response within 3 seconds)
        res.status(200).json({ ok: true });

        // Process the message asynchronously
        processNaturalLanguageMessage(messageText, event.user, event.channel, event.ts)
          .catch(error => {
            console.error('Error processing natural language message:', error);
            // Send error message to user (error handling is already in processNaturalLanguageMessage)
          });
        
        return;
      }

      // Handle other event types if needed in the future
      console.log('ℹ️ Unhandled event type:', event.type);
      return res.status(200).json({ ok: true });
    }

    // Unknown event type
    console.log('⚠️ Unknown event type:', req.body.type);
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('❌ Error processing Slack event:', error);
    // Always return 200 to acknowledge receipt (Slack will retry if we return error)
    return res.status(200).json({ ok: true });
  }
});

/**
 * Process natural language message asynchronously
 * @param {string} messageText - The natural language message
 * @param {string} userId - Slack user ID
 * @param {string} channelId - Slack channel ID
 * @param {string} messageTs - Message timestamp (for threading)
 */
async function processNaturalLanguageMessage(messageText, userId, channelId, messageTs) {
  console.log('💬 Processing natural language message:', { messageText, userId, channelId });

  try {
    // 1. Get user's domains first to provide context to LLM
    const { getUserEmail } = require('../helpers/SlackUserEmail');
    const { getUserDomains } = require('../helpers/SlackPermissions');
    const userEmail = await getUserEmail(userId);
    const userDomains = await getUserDomains(userEmail);
    console.log('👤 User domains:', userDomains);

    // 2. Parse natural language with user's domain context
    const parsed = await parseNaturalLanguage(messageText, userDomains);
    console.log('📝 Parsed command:', parsed);

    // 3. Check if clarification is needed
    if (parsed.needs_clarification || !parsed.command) {
      const clarificationText = parsed.clarification_questions?.length > 0
        ? parsed.clarification_questions.join('\n')
        : 'I need more information to help you. Could you clarify what you\'d like to do?';
      
      await sendSlackReply(channelId, `❓ ${clarificationText}`, messageTs);
      return;
    }

    // 4. Map to slash command format
    const mappedCommand = mapCommandToSlashCommand(parsed);
    console.log('🗺️ Mapped command:', mappedCommand);

    if (!mappedCommand.canExecute) {
      const clarificationText = mappedCommand.clarificationQuestions?.length > 0
        ? mappedCommand.clarificationQuestions.join('\n')
        : 'I need more information to help you.';
      
      await sendSlackReply(channelId, `❓ ${clarificationText}`, messageTs);
      return;
    }

    // 5. Execute the command
    const result = await executeCommand(mappedCommand, userId, channelId);
    console.log('✅ Command execution result:', result);

    // 6. Send response to user
    await sendSlackReply(channelId, result.message, messageTs);

  } catch (error) {
    console.error('❌ Error in processNaturalLanguageMessage:', error);
    await sendSlackReply(
      channelId,
      `❌ Sorry, I encountered an error processing your request: ${error.message}`,
      messageTs
    );
  }
}

// Apply verification to all other Slack routes (commands, actions)
router.use(verifySlackRequest);

// Health check command endpoint
router.post('/commands/health-check', async (req, res) => {
  console.log('🔍 Processing health check command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      console.log('❌ No input provided');
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a domain or URL to check. Usage: `/mula-health-check example.com` or `/mula-health-check https://example.com`'
      });
    }

    // Try to parse as URL first
    let url;
    try {
      // If input doesn't start with http:// or https://, add https://
      const urlInput = input.startsWith('http://') || input.startsWith('https://') 
        ? input 
        : `https://${input}`;
      url = new URL(urlInput);
      console.log('✅ Parsed URL:', { input, url: url.href });
    } catch (e) {
      console.error('❌ Error parsing URL:', e);
      return res.json({
        response_type: 'ephemeral',
        text: 'Invalid URL or domain provided. Please provide a valid domain or URL.'
      });
    }

    console.log('✅ Queueing health check job for URL:', url.href);
    await healthCheckQueue.add('checkSite', { 
      url: url.href,
      channelId: req.body.channel_id
    });
    
    return res.json({
      response_type: 'ephemeral',
      text: `Starting health check for ${url.href}. I'll send you the results when it's complete.`
    });
  } catch (error) {
    console.error('❌ Error processing health check command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Domain-channel mapping commands
router.post('/commands/domain-channels-add', async (req, res) => {
  console.log('🔍 Processing domain-channels-add command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      console.log('❌ No input provided');
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a domain. Usage: `/mula-domain-channels-add example.com [displayName]`'
      });
    }

    // Parse domain and optional display name
    const parts = input.split(' ');
    const domain = parts[0].trim();
    const displayName = parts.slice(1).join(' ').trim() || null;

    // Validate domain format
    if (!domain || domain.length === 0) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a valid domain name.'
      });
    }

    // Add the mapping
    const mapping = await addDomainChannelMapping(domain, req.body.channel_id, req.body.channel_name, displayName);
    
    const successMessage = displayName 
      ? `✅ Added mapping: \`${domain}\` → ${mapping.channelName} (display: \`${displayName}\`)`
      : `✅ Added mapping: \`${domain}\` → ${mapping.channelName}`;

    return res.json({
      response_type: 'ephemeral',
      text: successMessage
    });
  } catch (error) {
    console.error('❌ Error processing domain-channels-add command:', error);
    
    if (error.message.includes('already exists')) {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ ${error.message}`
      });
    }
    
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

router.post('/commands/domain-channels-list', async (req, res) => {
  console.log('🔍 Processing domain-channels-list command');

  try {
    const mappings = await listDomainChannelMappings();
    
    if (mappings.length === 0) {
      return res.json({
        response_type: 'ephemeral',
        text: 'No domain-channel mappings found.'
      });
    }

    const mappingLines = mappings.map(mapping => {
      const displayInfo = mapping.displayName ? ` (display: \`${mapping.displayName}\`)` : '';
      return `• \`${mapping.domain}\` → ${mapping.channelName}${displayInfo}`;
    });

    const message = `*Domain-Channel Mappings:*\n${mappingLines.join('\n')}`;

    return res.json({
      response_type: 'ephemeral',
      text: message
    });
  } catch (error) {
    console.error('❌ Error processing domain-channels-list command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

router.post('/commands/domain-channels-rm', async (req, res) => {
  console.log('🔍 Processing domain-channels-rm command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const domain = req.body.text?.trim();
    if (!domain) {
      console.log('❌ No domain provided');
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a domain to remove. Usage: `/mula-domain-channels-rm example.com`'
      });
    }

    // Remove the mapping
    const wasRemoved = await removeDomainChannelMapping(domain);
    
    if (wasRemoved) {
      return res.json({
        response_type: 'ephemeral',
        text: `✅ Removed mapping for \`${domain}\``
      });
    } else {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ No mapping found for \`${domain}\``
      });
    }
  } catch (error) {
    console.error('❌ Error processing domain-channels-rm command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Performance report command
router.post('/commands/performance-report', async (req, res) => {
  console.log('🔍 Processing performance-report command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim() || '';
    const parts = input.split(' ');
    
    let domains = [];
    let lookbackDays = 7; // default
    let networkWide = false; // flag for network-wide aggregation
    
    // Parse input
    if (parts.length > 0 && parts[0].trim()) {
      // First argument could be domains, lookback days, or network sentinel
      const firstArg = parts[0].trim();
      
      // Check if it's a network sentinel value
      if (firstArg.toLowerCase() === 'network' || firstArg.toLowerCase() === 'all') {
        networkWide = true;
        // Check if second argument is lookback days
        if (parts.length > 1) {
          const lookbackArg = parts[1].trim();
          if (!isNaN(lookbackArg) && parseInt(lookbackArg) > 0 && parseInt(lookbackArg) <= 365) {
            lookbackDays = parseInt(lookbackArg);
          }
        }
      } else if (firstArg.includes(',')) {
        // Parse comma-separated domains
        domains = firstArg.split(',').map(d => d.trim()).filter(d => d);
        
        // Check if second argument is lookback days
        if (parts.length > 1) {
          const lookbackArg = parts[1].trim();
          if (!isNaN(lookbackArg) && parseInt(lookbackArg) > 0 && parseInt(lookbackArg) <= 365) {
            lookbackDays = parseInt(lookbackArg);
          }
        }
      } else if (!isNaN(firstArg) && parseInt(firstArg) > 0 && parseInt(firstArg) <= 365) {
        // First argument is lookback days (no domains specified)
        lookbackDays = parseInt(firstArg);
      } else {
        // Single domain
        domains = [firstArg];
        
        // Check if second argument is lookback days
        if (parts.length > 1) {
          const lookbackArg = parts[1].trim();
          if (!isNaN(lookbackArg) && parseInt(lookbackArg) > 0 && parseInt(lookbackArg) <= 365) {
            lookbackDays = parseInt(lookbackArg);
          }
        }
      }
    }
    
    // Validate domains if provided (and not network-wide)
    if (domains.length > 0 && !networkWide) {
      // Basic domain validation
      const validDomains = domains.filter(domain => {
        return domain.includes('.') && domain.length > 3;
      });
      
      if (validDomains.length !== domains.length) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Invalid domain format. Please provide valid domains (e.g., example.com) or use "network" for network-wide aggregation'
        });
      }
    }
    
    // Queue the performance report job
    await performanceReportQueue.add('generateReport', {
      domains: networkWide ? null : (domains.length > 0 ? domains : null),
      lookbackDays,
      networkWide,
      channelId: req.body.channel_id,
      channelName: `#${req.body.channel_name}`
    });
    
    let domainText;
    if (networkWide) {
      domainText = ' for network-wide aggregation';
    } else if (domains.length > 0) {
      domainText = ` for ${domains.join(', ')}`;
    } else {
      domainText = ' for all domains';
    }
    
    const responseText = `📊 Generating performance report${domainText} (${lookbackDays} days). I'll send you the results when it's complete.`;
    
    return res.json({
      response_type: 'ephemeral',
      text: responseText
    });
    
  } catch (error) {
    console.error('❌ Error processing performance-report command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Mulaize command - create page and trigger product recommendations
router.post('/commands/mulaize', async (req, res) => {
  console.log('🔍 Processing mulaize command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      console.log('❌ No input provided');
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a URL and credentials. Usage: `/mulaize https://example.com/article --creds <credential_id>`'
      });
    }

    // Parse URL and --creds parameter
    const parts = input.split(' --creds ');
    if (parts.length !== 2) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide both URL and credentials. Usage: `/mulaize https://example.com/article --creds <credential_id>`'
      });
    }

    const urlInput = parts[0].trim();
    const credentialId = parts[1].trim();

    if (!credentialId) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a valid credential ID. Usage: `/mulaize https://example.com/article --creds <credential_id>`'
      });
    }

    // Try to parse as URL
    let url;
    try {
      // If input doesn't start with http:// or https://, add https://
      const fullUrl = urlInput.startsWith('http://') || urlInput.startsWith('https://') 
        ? urlInput 
        : `https://${urlInput}`;
      url = new URL(fullUrl);
      console.log('✅ Parsed URL:', { urlInput, url: url.href });
    } catch (e) {
      console.error('❌ Error parsing URL:', e);
      return res.json({
        response_type: 'ephemeral',
        text: 'Invalid URL provided. Please provide a valid URL (e.g., https://example.com/article).'
      });
    }

    // Validate credentialId
    const { getCredentialIds } = require('../config/credentials');
    const SearchOrchestrator = require('../helpers/SearchOrchestrator');
    const orchestrator = new SearchOrchestrator();
    const hostname = url.hostname;
    const platform = orchestrator.getPlatformForDomain(hostname);
    // Map platform to credential platform (fanatics uses impact credentials)
    const credentialPlatform = platform === 'fanatics' ? 'impact' : platform;
    const availableCreds = getCredentialIds(credentialPlatform);
    
    if (!availableCreds.includes(credentialId)) {
      return res.json({
        response_type: 'ephemeral',
        text: `Invalid credential ID '${credentialId}' for platform '${platform}'. Available credentials: ${availableCreds.join(', ')}`
      });
    }

    // Check if page already exists
    let pageRef = await Page.findOne({ where: { url: url.href } });

    if (pageRef) {
      console.log('✅ Page already exists:', { pageId: pageRef.id, url: url.href });
      return res.json({
        response_type: 'ephemeral',
        text: `Page already exists for ${url.href}. You can view it at: ${process.env.BASE_URL || 'https://www.makemula.ai'}/pages/${pageRef.id}`
      });
    }

    // Create new page
    pageRef = await Page.create({ url: url.href });
    console.log('✅ Created new page:', { pageId: pageRef.id, url: url.href });

    // Queue encore job to trigger product recommendations
    await encoreQueue.add('encore', { pageId: pageRef.id, credentialId });
    console.log('✅ Queued encore job for page:', { pageId: pageRef.id, credentialId });

    const pageUrl = `${process.env.BASE_URL || 'https://www.makemula.ai'}/pages/${pageRef.id}`;
    
    return res.json({
      response_type: 'ephemeral',
      text: `✅ Started mulaizing ${url.href}! I'll begin generating product recommendations. You can track progress at: ${pageUrl}`
    });
  } catch (error) {
    console.error('❌ Error processing mulaize command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Product performance command
router.post('/commands/product-performance', async (req, res) => {
  console.log('🔍 Processing product-performance command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim() || '';
    const parts = input.split(/\s+/).filter(p => p.trim());
    
    let daysBack = 1; // default to 1 day
    let domain = null;
    
    // Parse input - format: [domain] [days] (domain is first, days is optional second)
    if (parts.length > 0) {
      const firstPart = parts[0].trim();
      
      // Check if first part is a domain (contains a dot)
      if (firstPart.includes('.')) {
        domain = firstPart;
        
        // Check if second part is days
        if (parts.length > 1) {
          const secondPart = parts[1].trim();
          if (!isNaN(secondPart) && parseInt(secondPart) > 0 && parseInt(secondPart) <= 30) {
            daysBack = parseInt(secondPart);
          } else {
            return res.json({
              response_type: 'ephemeral',
              text: '❌ Invalid number of days. Usage: `/mula-product-performance [domain] [days]` where days is 1-30'
            });
          }
        }
      } else {
        // First part is not a domain - could be days (for network-wide) or invalid
        if (!isNaN(firstPart) && parseInt(firstPart) > 0 && parseInt(firstPart) <= 30) {
          daysBack = parseInt(firstPart);
          // No domain = network-wide
        } else {
          return res.json({
            response_type: 'ephemeral',
            text: '❌ Invalid format. Usage: `/mula-product-performance [domain] [days]` or `/mula-product-performance [days]` for network-wide'
          });
        }
      }
    }
    
    // Queue the product performance report job
    await productPerformanceQueue.add('generateReport', {
      daysBack,
      domain, // null = network-wide
      channelId: req.body.channel_id,
      channelName: req.body.channel_name ? `#${req.body.channel_name}` : undefined
    });
    
    const daysText = daysBack === 1 ? '1 day' : `${daysBack} days`;
    const domainText = domain ? ` for ${domain}` : ' (network-wide)';
    
    return res.json({
      response_type: 'ephemeral',
      text: `📊 Generating product performance report${domainText} for the past ${daysText}. I'll send you the results when it's complete.`
    });
  } catch (error) {
    console.error('❌ Error processing product-performance command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Remulaize command (force new search)
router.post('/commands/remulaize', async (req, res) => {
  console.log('🔍 Processing remulaize command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      console.log('❌ No input provided');
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a URL and credentials. Usage: `/remulaize https://example.com/article --creds <credential_id>`'
      });
    }

    // Parse URL and --creds parameter
    const parts = input.split(' --creds ');
    if (parts.length !== 2) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide both URL and credentials. Usage: `/remulaize https://example.com/article --creds <credential_id>`'
      });
    }

    const urlInput = parts[0].trim();
    const credentialId = parts[1].trim();

    if (!credentialId) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a valid credential ID. Usage: `/remulaize https://example.com/article --creds <credential_id>`'
      });
    }

    // Try to parse as URL first
    let url;
    try {
      // If input doesn't start with http:// or https://, add https://
      const fullUrl = urlInput.startsWith('http://') || urlInput.startsWith('https://') 
        ? urlInput 
        : `https://${urlInput}`;
      url = new URL(fullUrl);
      console.log('✅ Parsed URL:', { urlInput, url: url.href });
    } catch (e) {
      console.error('❌ Error parsing URL:', e);
      return res.json({
        response_type: 'ephemeral',
        text: 'Invalid URL provided. Please provide a valid URL.'
      });
    }

    // Validate credentialId
    const { getCredentialIds } = require('../config/credentials');
    const SearchOrchestrator = require('../helpers/SearchOrchestrator');
    const orchestrator = new SearchOrchestrator();
    const hostname = url.hostname;
    const platform = orchestrator.getPlatformForDomain(hostname);
    // Map platform to credential platform (fanatics uses impact credentials)
    const credentialPlatform = platform === 'fanatics' ? 'impact' : platform;
    const availableCreds = getCredentialIds(credentialPlatform);
    
    if (!availableCreds.includes(credentialId)) {
      return res.json({
        response_type: 'ephemeral',
        text: `Invalid credential ID '${credentialId}' for platform '${platform}'. Available credentials: ${availableCreds.join(', ')}`
      });
    }

    // Find the page
    const page = await Page.findOne({ where: { url: url.href } });
    if (!page) {
      return res.json({
        response_type: 'ephemeral',
        text: `Page not found: ${url.href}. Please use \`/mulaize ${url.href} --creds ${credentialId}\` to create the page first.`
      });
    }

    // Reset page search state to force a new search
    await page.update({
      searchId: null,
      searchIdStatus: 'pending',
      searchStatus: 'pending',
      searchAttempts: [],
      keywordFeedback: null // Clear any previous feedback
    });

    // Queue a new search
    await searchQueue.add('search', { pageId: page.id, credentialId });

    console.log('✅ Queued new search for page:', { pageId: page.id, url: url.href });
    
    return res.json({
      response_type: 'ephemeral',
      text: `🔄 Remulaizing ${url.href}. The system will now generate fresh keywords and products. You can track progress at: https://www.makemula.ai/pages/${page.id}`
    });
  } catch (error) {
    console.error('❌ Error processing remulaize command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

router.post('/actions', async (req, res) => {
  console.log('🔍 Processing Slack action:', {
    actionId: req.body?.actions?.[0]?.action_id,
    hasPayload: !!req.body?.payload
  });
  
  try {
    const payload = JSON.parse(req.body.payload);
    // Handle modal submission (view_submission)
    if (payload.type === 'view_submission') {
      if (payload.view.callback_id === 'product_feedback_modal') {
        const { searchId, pageId, url, channelId, messageTs } = JSON.parse(payload.view.private_metadata);
        const feedback = payload.view.state.values.feedback_block.feedback_input.value;
        
        // Enqueue product feedback processing job
        await keywordFeedbackQueue.add('processProductFeedback', {
          searchId,
          pageId,
          url,
          feedback,
          userId: payload.user.id,
          channelId,
          messageTs
        });
        
        // Respond to Slack to close the modal
        return res.json({ response_action: 'clear' });
      }
    }
    // Handle block actions (buttons, etc)
    const action = payload.actions[0];
    const actionId = action.action_id;
    const value = JSON.parse(action.value);
    // Product approval workflow
    if (actionId === 'approve_products') {
      const { searchId, pageId, url } = value;
      console.log('🔍 Approving products for search:', searchId);
      
      try {
        await approvePageSearch(pageId);
        // Update the original Slack message to show who approved
        const slackClient = new WebClient(process.env.SLACK_TOKEN);
        const newBlocks = payload.message.blocks.filter(block => block.type !== 'actions');
        newBlocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `:white_check_mark: *Products approved by <@${payload.user.id}>* - Content is now live!`
            }
          ]
        });
        await slackClient.chat.update({
          channel: payload.channel.id,
          ts: payload.message.ts,
          text: 'Products approved',
          blocks: newBlocks
        });

        // Send notification about new content being available
        if (process.env.NODE_ENV !== "development") {
          const { Page } = require('../models');
          const page = await Page.findByPk(pageId);
          if (page) {
            const hostname = new URL(url).hostname;
            const viewUrl1 = new URL(url);
            viewUrl1.searchParams.set('mulaAuto', '1');
            viewUrl1.searchParams.set('mulaSlotA', 'topshelf');
            viewUrl1.searchParams.set('mulaSlotB', 'smartscroll');
            viewUrl1.searchParams.set('no_preview', '1');

            const viewUrl2 = new URL(url);
            viewUrl2.searchParams.set('mulaAuto', '1');
            viewUrl2.searchParams.set('mulaSlotA', 'topshelf');
            viewUrl2.searchParams.set('mulaSlotB', 'qa');
            viewUrl2.searchParams.set('no_preview', '1');

            const notificationBlocks = [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '🎉 New Mula Content Available',
                  emoji: true
                }
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `New content has been generated for:\n• <${viewUrl1.toString()}|${hostname}> (topshelf + smartscroll)\n• <${viewUrl2.toString()}|${hostname}> (topshelf + QA)`
                }
              }
            ];
            
            await sendSlackMessage('proj-mula-notifications', 'New Mula content available', notificationBlocks);
          }
        }

        res.json({
          response_type: 'ephemeral',
          text: 'Products approved and content is now live!'
        });
      } catch (error) {
        console.error('Error approving products:', error);
        res.json({
          response_type: 'ephemeral',
          text: 'Error approving products. Please try again.'
        });
      }
    }
    else if (actionId === 'approve_site_targeting_search') {
      const { searchId } = value;
      console.log('🔍 Approving site targeting search:', searchId);
      
      try {
        // Approve search (copies temp file to results.json)
        await approveSearch(searchId);
        
        // Update the original Slack message to show who approved
        const slackClient = new WebClient(process.env.SLACK_TOKEN);
        const newBlocks = payload.message.blocks.filter(block => block.type !== 'actions');
        newBlocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `:white_check_mark: *Site targeting search approved by <@${payload.user.id}>* - Search is now available for targeting!`
            }
          ]
        });
        await slackClient.chat.update({
          channel: payload.channel.id,
          ts: payload.message.ts,
          text: 'Site targeting search approved',
          blocks: newBlocks
        });

        res.json({
          response_type: 'ephemeral',
          text: 'Site targeting search approved and is now available for use!'
        });
      } catch (error) {
        console.error('Error approving site targeting search:', error);
        res.json({
          response_type: 'ephemeral',
          text: 'Error approving site targeting search. Please try again.'
        });
      }
    }
    else if (actionId === 'reject_site_targeting_search') {
      const { searchId } = value;
      console.log('🔍 Rejecting site targeting search:', searchId);
      
      try {
        // Update search status to rejected
        const { Search } = require('../models');
        const search = await Search.findByPk(searchId);
        if (!search) {
          throw new Error(`Search not found: ${searchId}`);
        }
        
        await search.update({ status: 'rejected' });
        
        // Update the original Slack message to show who rejected
        const slackClient = new WebClient(process.env.SLACK_TOKEN);
        const newBlocks = payload.message.blocks.filter(block => block.type !== 'actions');
        newBlocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `:x: *Site targeting search rejected by <@${payload.user.id}>*`
            }
          ]
        });
        await slackClient.chat.update({
          channel: payload.channel.id,
          ts: payload.message.ts,
          text: 'Site targeting search rejected',
          blocks: newBlocks
        });

        res.json({
          response_type: 'ephemeral',
          text: 'Site targeting search rejected.'
        });
      } catch (error) {
        console.error('Error rejecting site targeting search:', error);
        res.json({
          response_type: 'ephemeral',
          text: 'Error rejecting site targeting search. Please try again.'
        });
      }
    }
    else if (actionId === 'reject_products') {
      const { searchId, pageId, url } = value;
      console.log('🔍 Rejecting products for search:', searchId);
      
              try {
          // Get search details for the modal
          const { Search } = require('../models');
          const search = await Search.findByPk(searchId);
          if (!search) {
            throw new Error(`Search not found: ${searchId}`);
          }
          
          // Open feedback modal
          const slackClient = new WebClient(process.env.SLACK_TOKEN);
          await slackClient.views.open({
            trigger_id: payload.trigger_id,
            view: {
              type: 'modal',
              callback_id: 'product_feedback_modal',
              private_metadata: JSON.stringify({ searchId, pageId, url, channelId: payload.channel.id, messageTs: payload.message.ts }),
              title: {
                type: 'plain_text',
                text: 'Product Feedback'
              },
              submit: {
                type: 'plain_text',
                text: 'Submit'
              },
              close: {
                type: 'plain_text',
                text: 'Cancel'
              },
              blocks: [
                {
                  type: 'context',
                  elements: [
                    {
                      type: 'mrkdwn',
                      text: `*Rejected Products for:* ${url}\n*Keywords:* ${search.phrase}\n*Platform:* ${search.platform}\n*Search Index:* ${search.platformConfig?.searchIndex || 'N/A'}\n*Credentials:* ${search.credentialId || 'N/A'}`
                    }
                  ]
                },
              {
                type: 'input',
                block_id: 'feedback_block',
                element: {
                  type: 'plain_text_input',
                  action_id: 'feedback_input',
                  multiline: true,
                  placeholder: {
                    type: 'plain_text',
                    text: 'Enter your feedback here... Consider both keyword quality and product relevance.'
                  }
                },
                label: {
                  type: 'plain_text',
                  text: 'Feedback',
                  emoji: true
                }
              }
            ]
          }
        });

        // Update the original Slack message to show who rejected
        const newBlocks = payload.message.blocks.filter(block => block.type !== 'actions');
        newBlocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `:x: *Products rejected by <@${payload.user.id}>*`
            }
          ]
        });
        await slackClient.chat.update({
          channel: payload.channel.id,
          ts: payload.message.ts,
          text: 'Products rejected',
          blocks: newBlocks
        });

        res.json({
          response_type: 'ephemeral',
          text: 'Please provide feedback for the rejected products.'
        });
      } catch (error) {
        console.error('Error rejecting products:', error);
        res.json({
          response_type: 'ephemeral',
          text: 'Error rejecting products. Please try again.'
        });
      }
    }
    // Legacy keyword approval workflow (kept for backward compatibility)
    else if (actionId === 'approve_keywords' || actionId === 'reject_keywords') {
      res.json({
        response_type: 'ephemeral',
        text: 'Keyword approval workflow has been removed. Keywords are now auto-approved and products are fetched automatically.'
      });
    }
    else {
      console.error('❌ Invalid action type:', actionId);
      res.status(400).json({ error: 'Invalid action type' });
    }
  } catch (error) {
    console.error('❌ Error processing Slack action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// A/B Test Performance command
router.post('/commands/mula-ab-test-performance', async (req, res) => {
  console.log('🔍 Processing mula-ab-test-performance command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim() || '';
    const parts = input.split(' ');
    
    let daysBack = 7; // default
    let experimentName = 'smartscroll_button_variant'; // default
    let useCached = false;
    
    // Parse input arguments
    for (let i = 0; i < parts.length; i++) {
      const arg = parts[i].trim();
      
      if (arg === '--use-cached' || arg === '--cached') {
        useCached = true;
      } else if (arg === '--days-back' && i + 1 < parts.length) {
        const daysArg = parts[i + 1].trim();
        if (!isNaN(daysArg) && parseInt(daysArg) > 0 && parseInt(daysArg) <= 365) {
          daysBack = parseInt(daysArg);
        }
        i++; // Skip next argument
      } else if (arg === '--experiment' && i + 1 < parts.length) {
        experimentName = parts[i + 1].trim();
        i++; // Skip next argument
      }
    }
    
    // Queue the A/B test report job
    const abTestQueue = new Bull('abTestQueue', redisUrl);
    await abTestQueue.add('generateABTestReport', {
      daysBack,
      experimentName,
      useCached,
      channelId: req.body.channel_id,
      channelName: `#${req.body.channel_name}`
    });
    
    const responseText = `🧪 Generating SmartScroll A/B test performance report (${daysBack} days, experiment: ${experimentName}). I'll send the results to this channel when complete.`;
    
    return res.json({
      response_type: 'ephemeral',
      text: responseText
    });
    
  } catch (error) {
    console.error('❌ Error processing mula-ab-test-performance command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your A/B test performance request.'
    });
  }
});

// Subid Performance Report command
router.post('/commands/mula-impact-on3-subid-report', async (req, res) => {
  console.log('🔍 Processing mula-impact-on3-subid-report command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim() || '';
    const parts = input.split(' ');
    
    let daysBack = 7; // default to 7 days
    let filterMula = false; // default to show all subids
    
    // Parse input arguments
    for (let i = 0; i < parts.length; i++) {
      const arg = parts[i].trim();
      
      if (arg === '--mula-only' || arg === '--mula') {
        filterMula = true;
      } else if (arg === '--days-back' && i + 1 < parts.length) {
        const daysArg = parts[i + 1].trim();
        if (!isNaN(daysArg) && parseInt(daysArg) > 0 && parseInt(daysArg) <= 30) {
          daysBack = parseInt(daysArg);
        } else {
          return res.json({
            response_type: 'ephemeral',
            text: '❌ Invalid number of days. Please provide a number between 1 and 30. Usage: `/mula-impact-on3-subid-report [--days-back N] [--mula-only]`'
          });
        }
        i++; // Skip next argument
      } else if (!isNaN(arg) && parseInt(arg) > 0 && parseInt(arg) <= 30) {
        // Handle case where user just sends a number directly (e.g., "1" or "7")
        daysBack = parseInt(arg);
      }
    }
    
    // Queue the subid report job
    const subidReportQueue = new Bull('subidReportQueue', redisUrl);
    await subidReportQueue.add('generateSubidReport', {
      daysBack,
      filterMula,
      channelId: req.body.channel_id,
      channelName: `#${req.body.channel_name}`
    });
    
    const daysText = daysBack === 1 ? '1 day' : `${daysBack} days`;
    const filterText = filterMula ? ' (Mula subids only)' : '';
    
    return res.json({
      response_type: 'ephemeral',
      text: `📊 Generating Impact subid performance report for the past ${daysText}${filterText}. I'll send you the results when it's complete.`
    });
    
  } catch (error) {
    console.error('❌ Error processing mula-impact-on3-subid-report command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your subid report request.'
    });
  }
});

// Site targeting commands
router.post('/commands/mula-site-targeting-add', async (req, res) => {
  console.log('🔍 Processing mula-site-targeting-add command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      console.log('❌ No input provided');
    return res.json({
      response_type: 'in_channel',
      text: `Please provide targeting parameters. Usage: \`/mula-site-targeting-add <top-level-domain> <path_substring|url_pattern|ld_json|keyword_substring> <targeting_value> <search_phrase> --creds <credential_id>\`\n\nAvailable credentials: ${getCredentialIds().map(id => `\`${id}\` (${getCredentialNames()[id]})`).join(', ')}`
    });
    }

    // Parse input: <top-level-domain> <targeting_type> <targeting_value> <search_phrase> --creds <credential_id>
    // Handle quoted strings properly
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }
      
      if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        continue;
      }
      
      if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          args.push(current.trim());
          current = '';
        }
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    if (args.length < 4) {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ Insufficient parameters. Usage: \`/mula-site-targeting-add <top-level-domain> <path_substring|url_pattern|ld_json|keyword_substring> <targeting_value> <search_phrase> --creds <credential_id>\`\n\nAvailable credentials: ${getCredentialIds().map(id => `\`${id}\` (${getCredentialNames()[id]})`).join(', ')}`
      });
    }

    // Extract credential ID (required)
    const credsIndex = args.findIndex(arg => arg === '--creds');
    if (credsIndex === -1) {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ Credential ID is required. Usage: \`/mula-site-targeting-add <top-level-domain> <path_substring|url_pattern|ld_json|keyword_substring> <targeting_value> <search_phrase> --creds <credential_id>\`\n\nAvailable credentials: ${getCredentialIds().map(id => `\`${id}\` (${getCredentialNames()[id]})`).join(', ')}`
      });
    }
    
    if (credsIndex + 1 >= args.length) {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ Credential ID value is missing. Usage: \`/mula-site-targeting-add <top-level-domain> <path_substring|url_pattern|ld_json|keyword_substring> <targeting_value> <search_phrase> --creds <credential_id>\`\n\nAvailable credentials: ${getCredentialIds().map(id => `\`${id}\` (${getCredentialNames()[id]})`).join(', ')}`
      });
    }
    
    const credentialId = args[credsIndex + 1];
    
    // Remove --creds and credential_id from args to get clean arguments
    const cleanArgs = [...args];
    cleanArgs.splice(credsIndex, 2);
    
    // Extract the main arguments
    const topLevelDomain = cleanArgs[0];
    const targetingType = cleanArgs[1];
    const targetingValue = cleanArgs[2];
    let searchPhrase = cleanArgs.slice(3).join(' ');
    
    // Determine platform for credential validation
    const SearchOrchestrator = require('../helpers/SearchOrchestrator');
    const searchOrchestrator = new SearchOrchestrator();
    const platform = searchOrchestrator.getPlatformForDomain(topLevelDomain);
    
    // Map platform to credential platform (fanatics uses impact credentials)
    const credentialPlatform = platform === 'fanatics' ? 'impact' : platform;
    
    // Validate credential ID
    const validCredentials = getCredentialIds(credentialPlatform);
    if (!validCredentials.includes(credentialId)) {
      const credentialNames = getCredentialNames(credentialPlatform);
      const availableCreds = validCredentials.map(id => `\`${id}\` (${credentialNames[id]})`).join(', ');
      
      return res.json({
        response_type: 'ephemeral',
        text: `❌ Invalid credential ID: \`${credentialId}\` for platform \`${platform}\`. Available credentials: ${availableCreds}`
      });
    }
    
    // Remove all quotes from search phrase
    searchPhrase = searchPhrase.replace(/['"]/g, '').trim();

    // Validate targeting type
    const validTypes = ['path_substring', 'url_pattern', 'ld_json', 'keyword_substring'];
    if (!validTypes.includes(targetingType)) {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ Invalid targeting type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Check if search already exists, create if it doesn't
    let search = await Search.findOne({ where: { phrase: searchPhrase } });
    let searchCreated = false;
    
    if (!search) {
      console.log(`🔍 Search phrase "${searchPhrase}" not found, creating new search...`);
      
      // Determine platform based on domain
      const SearchOrchestrator = require('../helpers/SearchOrchestrator');
      const searchOrchestrator = new SearchOrchestrator();
      const platform = searchOrchestrator.getPlatformForDomain(topLevelDomain);
      
      // Use platform-appropriate configuration
      const platformConfig = platform === 'fanatics' ? {} : { searchIndex: 'All' };
      
      // Check if search already exists
      const existingSearch = await Search.findOne({
        where: {
          phrase: searchPhrase,
          platform: platform,
          platformConfig: platformConfig
        }
      });

      if (existingSearch) {
        // Use existing search
        search = existingSearch;
        searchCreated = false;
        console.log(`✅ Found existing search record: ${search.id} with phraseID: ${search.phraseID}`);
      } else {
        // Create new search record
        const phraseIdInput = [
          searchPhrase.toLowerCase(),
          platform,
          JSON.stringify(platformConfig)
        ].join('|');
        const phraseID = await createSHA256Hash(phraseIdInput);
        
        search = await Search.create({
          phrase: searchPhrase,
          phraseID: phraseID,
          status: 'pending',
          platform: platform,
          platformConfig: platformConfig,
          credentialId: credentialId
        });
        
        // Queue the search job only for new searches
        await searchQueue.add('search', {
          searchId: search.id
        });
        
        searchCreated = true;
        console.log(`✅ Created new search record: ${search.id} with phraseID: ${phraseID}`);
        console.log(`🚀 Queued search job for immediate processing`);
      }
    }

    // Add the targeting record
    const targeting = await addSiteTargeting(
      topLevelDomain,
      targetingType,
      targetingValue,
      searchPhrase,
      req.body.channel_id,
      `#${req.body.channel_name}`
    );

    let responseText = `✅ Added site targeting record for ${topLevelDomain}:\n• Type: ${targetingType}\n• Value: ${targetingValue}\n• Search Phrase: ${searchPhrase}\n• ID: ${targeting.id}`;
    
    if (searchCreated) {
      responseText += `\n\n🆕 Created new search record (ID: ${search.id}) and queued search job for immediate processing.`;
    } else {
      responseText += `\n\n✅ Using existing search record (ID: ${search.id}).`;
    }

    return res.json({
      response_type: 'in_channel',
      text: responseText
    });

  } catch (error) {
    console.error('❌ Error processing mula-site-targeting-add command:', error);
    return res.status(500).json({
      response_type: 'in_channel',
      text: `❌ Error adding site targeting: ${error.message}`
    });
  }
});

router.post('/commands/mula-site-targeting-list', async (req, res) => {
  console.log('🔍 Processing mula-site-targeting-list command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    
    // Parse input to check for --show-deleted flag
    let topLevelDomain = null;
    let includeDeleted = false;
    
    if (input) {
      const parts = input.split(' ');
      if (parts.includes('--show-deleted')) {
        includeDeleted = true;
        // Remove the flag from the parts array
        const filteredParts = parts.filter(part => part !== '--show-deleted');
        topLevelDomain = filteredParts.length > 0 ? filteredParts.join(' ') : null;
      } else {
        topLevelDomain = input;
      }
    }

    // List targeting records
    const targetingRecords = await listSiteTargeting(topLevelDomain, includeDeleted);

    if (targetingRecords.length === 0) {
      const domainText = topLevelDomain ? ` for ${topLevelDomain}` : '';
      const deletedText = includeDeleted ? ' (including deleted)' : '';
      return res.json({
        response_type: 'in_channel',
        text: `📋 No site targeting records found${domainText}${deletedText}.`
      });
    }

    // Format the response
    const domainText = topLevelDomain ? ` for ${topLevelDomain}` : '';
    const deletedText = includeDeleted ? ' (including deleted)' : '';
    let responseText = `📋 Site targeting records${domainText}${deletedText}:\n\n`;
    
    targetingRecords.forEach((record, index) => {
      const status = record.deletedAt ? '🗑️ DELETED' : '✅ ACTIVE';
      const deletedText = record.deletedAt ? ` (deleted ${record.deletedAt.toLocaleDateString()})` : '';
      
      responseText += `${index + 1}. **ID: ${record.id}** - ${record.topLevelDomain} ${status}${deletedText}\n`;
      responseText += `   • Type: \`${record.targetingType}\`\n`;
      responseText += `   • Value: \`${record.targetingValue}\`\n`;
      
      // Format search phrase as clickable link if search_id exists
      if (record.search && record.search.id) {
        const searchUrl = `https://app.makemula.ai/searches/${record.search.id}`;
        responseText += `   • Search: <${searchUrl}|${record.searchPhrase}>\n`;
      } else {
        responseText += `   • Search: \`${record.searchPhrase}\`\n`;
      }
      
      responseText += `   • Created: ${record.createdAt.toLocaleDateString()}\n\n`;
    });

    return res.json({
      response_type: 'in_channel',
      text: responseText
    });

  } catch (error) {
    console.error('❌ Error processing mula-site-targeting-list command:', error);
    return res.status(500).json({
      response_type: 'in_channel',
      text: `❌ Error listing site targeting: ${error.message}`
    });
  }
});

router.post('/commands/mula-site-targeting-rm', async (req, res) => {
  console.log('🔍 Processing mula-site-targeting-rm command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      console.log('❌ No input provided');
      return res.json({
        response_type: 'in_channel',
        text: 'Please provide a targeting record ID to remove. Usage: `/mula-site-targeting-rm <site_targeting_record_id>`'
      });
    }

    const targetingId = parseInt(input);
    if (isNaN(targetingId)) {
      return res.json({
        response_type: 'in_channel',
        text: '❌ Invalid targeting record ID. Please provide a valid number.'
      });
    }

    // Remove the targeting record
    const removed = await removeSiteTargeting(targetingId);

    if (removed) {
      return res.json({
        response_type: 'in_channel',
        text: `✅ Soft deleted site targeting record ${targetingId}. It will be removed from manifests on the next build.`
      });
    } else {
      return res.json({
        response_type: 'in_channel',
        text: `❌ Site targeting record ${targetingId} not found.`
      });
    }

  } catch (error) {
    console.error('❌ Error processing mula-site-targeting-rm command:', error);
    return res.status(500).json({
      response_type: 'in_channel',
      text: `❌ Error removing site targeting: ${error.message}`
    });
  }
});

// Engagement report command
router.post('/commands/mula-engagement-report', async (req, res) => {
  console.log('🔍 Processing mula-engagement-report command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim() || '';
    const parts = input.split(' ');
    
    if (parts.length < 1) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Please provide a domain. Usage: `/mula-engagement-report <domain> [days_back]`'
      });
    }

    const domain = parts[0].trim();
    let lookbackDays = 7; // default to 7 days
    
    // Parse optional days back parameter
    if (parts.length > 1) {
      const daysArg = parts[1].trim();
      if (!isNaN(daysArg) && parseInt(daysArg) > 0 && parseInt(daysArg) <= 365) {
        lookbackDays = parseInt(daysArg);
      } else {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Invalid number of days. Please provide a number between 1 and 365. Usage: `/mula-engagement-report <domain> [days_back]`'
        });
      }
    }
    
    // Basic domain validation
    if (!domain || !domain.includes('.') || domain.length < 3) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Invalid domain format. Please provide a valid domain (e.g., example.com)'
      });
    }
    
    // Queue the engagement report job
    await engagementReportQueue.add('generateReport', {
      domain,
      lookbackDays,
      channelId: req.body.channel_id,
      channelName: `#${req.body.channel_name}`
    });
    
    const daysText = lookbackDays === 1 ? '1 day' : `${lookbackDays} days`;
    
    return res.json({
      response_type: 'ephemeral',
      text: `📊 Generating engagement report for ${domain} (${daysText}). I'll send you the results when it's complete.`
    });
    
  } catch (error) {
    console.error('❌ Error processing mula-engagement-report command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Site taxonomy analysis command
router.post('/commands/mula-site-taxonomy', async (req, res) => {
  console.log('🔍 Processing mula-site-taxonomy command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim() || '';
    const parts = input.split(' ');
    
    if (parts.length < 2) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Please provide both domain and lookback days. Usage: `/mula-site-taxonomy <domain> <lookback_days>`'
      });
    }

    const domain = parts[0].trim();
    const lookbackDays = parseInt(parts[1].trim());
    
    // Validate lookback days
    if (isNaN(lookbackDays) || lookbackDays < 1 || lookbackDays > 365) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Invalid lookback days. Please provide a number between 1 and 365. Usage: `/mula-site-taxonomy <domain> <lookback_days>`'
      });
    }
    
    // Basic domain validation
    if (!domain || !domain.includes('.') || domain.length < 3) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Invalid domain format. Please provide a valid domain (e.g., example.com)'
      });
    }
    
    // Queue the taxonomy analysis job
    await taxonomyAnalysisQueue.add('analyzeTaxonomy', {
      domain,
      lookback_days: lookbackDays,
      channelId: req.body.channel_id,
      channelName: `#${req.body.channel_name}`
    });
    
    const daysText = lookbackDays === 1 ? '1 day' : `${lookbackDays} days`;
    
    return res.json({
      response_type: 'ephemeral',
      text: `🏛️ Starting site taxonomy analysis for ${domain} (${daysText}). I'll send you the results when the analysis is complete.`
    });
    
  } catch (error) {
    console.error('❌ Error processing mula-site-taxonomy command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Click URLs command
router.post('/commands/mula-click-urls', async (req, res) => {
  console.log('🔍 Processing mula-click-urls command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim() || '';
    const parts = input.split(' ');
    
    if (parts.length < 1) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Please provide a domain. Usage: `/mula-click-urls <domain> [days_back]`'
      });
    }

    const domain = parts[0].trim();
    let lookbackDays = 7; // default to 7 days
    
    // Parse optional days back parameter
    if (parts.length > 1) {
      const daysArg = parts[1].trim();
      if (!isNaN(daysArg) && parseInt(daysArg) > 0 && parseInt(daysArg) <= 365) {
        lookbackDays = parseInt(daysArg);
      } else {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Invalid number of days. Please provide a number between 1 and 365. Usage: `/mula-click-urls <domain> [days_back]`'
        });
      }
    }
    
    // Basic domain validation
    if (!domain || !domain.includes('.') || domain.length < 3) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Invalid domain format. Please provide a valid domain (e.g., example.com)'
      });
    }
    
    // Queue the click URLs report job
    await clickUrlsQueue.add('generateClickUrlsReport', {
      domain,
      lookbackDays,
      channelId: req.body.channel_id,
      channelName: `#${req.body.channel_name}`
    });
    
    const daysText = lookbackDays === 1 ? '1 day' : `${lookbackDays} days`;
    
    return res.json({
      response_type: 'ephemeral',
      text: `📊 Generating click URLs report for ${domain} (${daysText}). I'll send you the results when it's complete.`
    });
    
  } catch (error) {
    console.error('❌ Error processing mula-click-urls command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Site Search Traffic Analysis Command
router.post('/commands/mula-site-search', verifySlackRequest, async (req, res) => {
  try {
    const { text, response_url } = req.body;
    
    // Parse arguments: domain lookback_days
    const args = text.trim().split(/\s+/);
    if (args.length < 1) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Usage: `/mula-site-search <domain> [lookback_days]`\nExample: `/mula-site-search on3.com 7`'
      });
    }
    
    const domain = args[0];
    const lookbackDays = parseInt(args[1]) || 7;
    
    if (lookbackDays < 1 || lookbackDays > 90) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Lookback days must be between 1 and 90'
      });
    }
    
    // Queue the job
    await siteSearchQueue.add('site-search', {
      domain,
      lookbackDays,
      channelId: req.body.channel_id
    });
    
    res.json({
      response_type: 'ephemeral',
      text: `🔍 Analyzing search traffic for ${domain} (${lookbackDays} days)... This may take a moment.`
    });
    
  } catch (error) {
    console.error('❌ Error in mula-site-search command:', error);
    res.json({
      response_type: 'ephemeral',
      text: `❌ Error: ${error.message}`
    });
  }
});

// Next Page Build command
router.post('/commands/mula-next-page-build', async (req, res) => {
  console.log('🔍 Processing mula-next-page-build command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      console.log('❌ No input provided');
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide parameters. Usage: `/mula-next-page-build <domain> <lookback_days> <category_or_path> [limit]`\nExample: `/mula-next-page-build on3.com 7 "Style Inspo" 5`'
      });
    }

    // Parse input: <domain> <lookback_days> <category_or_path> [limit]
    const parts = input.split(' ');
    if (parts.length < 3) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Insufficient parameters. Usage: `/mula-next-page-build <domain> <lookback_days> <category_or_path> [limit]`'
      });
    }

    const domain = parts[0].trim();
    const lookbackDays = parseInt(parts[1].trim());
    const categoryOrPath = parts[2].trim();
    const limit = parts.length > 3 ? parseInt(parts[3].trim()) : 5;

    // Validate parameters
    if (isNaN(lookbackDays) || lookbackDays < 1 || lookbackDays > 90) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Lookback days must be between 1 and 90'
      });
    }

    if (isNaN(limit) || limit < 1 || limit > 10) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Limit must be between 1 and 10'
      });
    }

    if (!domain || !domain.includes('.') || domain.length < 3) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Invalid domain format. Please provide a valid domain (e.g., example.com)'
      });
    }

    // Queue the next-page build job
    await nextPageBuildQueue.add('buildNextPage', {
      domain,
      lookbackDays,
      categoryOrPath,
      limit,
      channelId: req.body.channel_id,
      channelName: `#${req.body.channel_name}`
    });

    return res.json({
      response_type: 'ephemeral',
      text: `🔗 Building next-page recommendations for ${domain} (${lookbackDays} days, ${categoryOrPath}, limit: ${limit}). I'll send you the results when complete.`
    });

  } catch (error) {
    console.error('❌ Error processing mula-next-page-build command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong while processing your request.'
    });
  }
});

// Next Page Targeting Add command
router.post('/commands/mula-next-page-targeting-add', async (req, res) => {
  console.log('🔍 Processing mula-next-page-targeting-add command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide parameters. Usage: `/mula-next-page-targeting-add <domain> <targeting_type> <targeting_value> <section_name> <lookback_days> [limit]`\nExample: `/mula-next-page-targeting-add www.on3.com path_substring "/teams/michigan-wolverines/" michigan-wolverines 7 20`'
      });
    }

    // Parse input: <domain> <targeting_type> <targeting_value> <section_name> <lookback_days> [limit]
    // Handle quoted strings properly
    const args = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }
      
      if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        continue;
      }
      
      if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          args.push(current.trim());
          current = '';
        }
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    if (args.length < 5) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Insufficient parameters. Usage: `/mula-next-page-targeting-add <domain> <targeting_type> <targeting_value> <section_name> <lookback_days> [limit]`'
      });
    }

    const domain = args[0];
    const targetingType = args[1];
    const targetingValue = args[2].replace(/['"]/g, ''); // Remove quotes
    const sectionName = args[3];
    const lookbackDays = parseInt(args[4]);
    const limit = args.length > 5 ? parseInt(args[5]) : 20;

    // Validate parameters
    const validTypes = ['path_substring', 'url_pattern', 'ld_json', 'keyword_substring'];
    if (!validTypes.includes(targetingType)) {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ Invalid targeting type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    if (isNaN(lookbackDays) || lookbackDays < 1 || lookbackDays > 90) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Lookback days must be between 1 and 90'
      });
    }

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Limit must be between 1 and 50'
      });
    }

    if (!domain || !domain.includes('.') || domain.length < 3) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Invalid domain format. Please provide a valid domain (e.g., www.on3.com)'
      });
    }

    // Validate URL pattern if targeting type is url_pattern
    if (targetingType === 'url_pattern') {
      try {
        new RegExp(targetingValue);
      } catch (error) {
        return res.json({
          response_type: 'ephemeral',
          text: '❌ Invalid regex pattern for url_pattern targeting type'
        });
      }
    }

    // Queue the next-page build job
    await nextPageBuildQueue.add('buildNextPage', {
      domain,
      targetingType,
      targetingValue,
      sectionName,
      lookbackDays,
      limit,
      channelId: req.body.channel_id,
      channelName: `#${req.body.channel_name}`,
      dryRun: false
    });

    return res.json({
      response_type: 'ephemeral',
      text: `🔗 Building next-page section manifest for ${domain}!\n\n` +
        `🎯 Targeting: ${targetingType} = "${targetingValue}"\n` +
        `📁 Section: ${sectionName}\n` +
        `📅 Lookback: ${lookbackDays} days\n` +
        `📊 Limit: ${limit} articles\n\n` +
        `I'll send you the results when complete.`
    });

  } catch (error) {
    console.error('❌ Error processing mula-next-page-targeting-add command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: `❌ Error: ${error.message}`
    });
  }
});

// Next Page Targeting List command
router.post('/commands/mula-next-page-targeting-list', async (req, res) => {
  console.log('🔍 Processing mula-next-page-targeting-list command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    const domain = input || null;
    const includeDeleted = input?.includes('--show-deleted') || false;

    const records = await listNextPageTargeting(domain, includeDeleted);

    if (records.length === 0) {
      return res.json({
        response_type: 'in_channel',
        text: domain 
          ? `No next-page targeting records found for ${domain}${includeDeleted ? ' (including deleted)' : ''}`
          : `No next-page targeting records found${includeDeleted ? ' (including deleted)' : ''}`
      });
    }

    let text = `📋 Next-Page Targeting Records${domain ? ` for ${domain}` : ''}:\n\n`;
    
    for (const record of records) {
      const status = record.deletedAt ? '🗑️ DELETED' : '✅ Active';
      text += `${status} ID: ${record.id}\n`;
      text += `• Domain: ${record.topLevelDomain}\n`;
      text += `• Type: ${record.targetingType}\n`;
      text += `• Value: ${record.targetingValue}\n`;
      text += `• Section: ${record.sectionName}\n`;
      text += `• Lookback: ${record.lookbackDays} days\n`;
      text += `• Limit: ${record.limit} articles\n`;
      text += `• Created: ${new Date(record.createdAt).toLocaleDateString()}\n`;
      if (record.deletedAt) {
        text += `• Deleted: ${new Date(record.deletedAt).toLocaleDateString()}\n`;
      }
      text += '\n';
    }

    return res.json({
      response_type: 'in_channel',
      text
    });

  } catch (error) {
    console.error('❌ Error processing mula-next-page-targeting-list command:', error);
    return res.status(500).json({
      response_type: 'in_channel',
      text: `❌ Error listing next-page targeting: ${error.message}`
    });
  }
});

// Next Page Targeting Remove command
router.post('/commands/mula-next-page-targeting-rm', async (req, res) => {
  console.log('🔍 Processing mula-next-page-targeting-rm command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a targeting record ID to remove. Usage: `/mula-next-page-targeting-rm <targeting_id>`'
      });
    }

    const targetingId = parseInt(input);
    if (isNaN(targetingId)) {
      return res.json({
        response_type: 'ephemeral',
        text: '❌ Invalid targeting ID. Please provide a valid number.'
      });
    }

    const removed = await removeNextPageTargeting(targetingId);
    
    if (removed) {
      return res.json({
        response_type: 'in_channel',
        text: `✅ Removed next-page targeting record ${targetingId}.\n\n**Note**: Run the manifest builder to update the main manifest.`
      });
    } else {
      return res.json({
        response_type: 'ephemeral',
        text: `⚠️ Targeting record ${targetingId} not found.`
      });
    }

  } catch (error) {
    console.error('❌ Error processing mula-next-page-targeting-rm command:', error);
    return res.status(500).json({
      response_type: 'in_channel',
      text: `❌ Error removing next-page targeting: ${error.message}`
    });
  }
});

// Next Page Targeting Refresh command
router.post('/commands/mula-next-page-targeting-refresh', async (req, res) => {
  console.log('🔍 Processing mula-next-page-targeting-refresh command:', {
    body: req.body,
    hasText: !!req.body?.text,
    text: req.body?.text
  });

  try {
    const input = req.body.text?.trim();
    if (!input) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a domain. Usage: `/mula-next-page-targeting-refresh <domain> [section_name]`\nExample: `/mula-next-page-targeting-refresh www.on3.com michigan-wolverines`'
      });
    }

    const parts = input.split(' ');
    const domain = parts[0];
    const sectionName = parts.length > 1 ? parts[1] : null;

    // Get all targeting records for the domain
    const { getNextPageTargetingForDomain } = require('../helpers/NextPageTargetingHelpers');
    const records = await getNextPageTargetingForDomain(domain);

    if (records.length === 0) {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ No next-page targeting records found for ${domain}`
      });
    }

    // Filter by section if provided
    const recordsToRefresh = sectionName 
      ? records.filter(r => r.sectionName === sectionName)
      : records;

    if (recordsToRefresh.length === 0) {
      return res.json({
        response_type: 'ephemeral',
        text: `❌ No matching records found${sectionName ? ` for section "${sectionName}"` : ''}`
      });
    }

    // Queue refresh jobs
    let queuedCount = 0;
    for (const record of recordsToRefresh) {
      await nextPageBuildQueue.add('buildNextPage', {
        domain: record.topLevelDomain,
        targetingType: record.targetingType,
        targetingValue: record.targetingValue,
        sectionName: record.sectionName,
        lookbackDays: record.lookbackDays,
        limit: record.limit,
        channelId: req.body.channel_id,
        channelName: `#${req.body.channel_name}`,
        dryRun: false
      });
      queuedCount++;
    }

    return res.json({
      response_type: 'ephemeral',
      text: `🔗 Queued ${queuedCount} section manifest refresh job(s) for ${domain}${sectionName ? ` (section: ${sectionName})` : ''}.\n\nI'll send you the results when complete.`
    });

  } catch (error) {
    console.error('❌ Error processing mula-next-page-targeting-refresh command:', error);
    return res.status(500).json({
      response_type: 'ephemeral',
      text: `❌ Error: ${error.message}`
    });
  }
});

module.exports = router; 