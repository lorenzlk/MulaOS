const { checkDomainPermissionForUser } = require('./SlackPermissions');

/**
 * Execute a mapped command
 * @param {Object} mappedCommand - Mapped command from CommandMapper
 * @param {string} userId - Slack user ID
 * @param {string} channelId - Slack channel ID
 * @returns {Promise<Object>} Execution result
 */
async function executeCommand(mappedCommand, userId, channelId) {
  const { command, parameters, domain } = mappedCommand;
  
  // Get user's email and domains for default domain logic
  const userEmail = await require('./SlackUserEmail').getUserEmail(userId);
  const userDomains = await require('./SlackPermissions').getUserDomains(userEmail);
  
  // Check if this command requires a domain
  const { getCommandRegistry } = require('./NaturalLanguageParser');
  const commandRegistry = getCommandRegistry();
  const commandDef = commandRegistry[command];
  const requiresDomain = commandDef && commandDef.required && commandDef.required.includes('domain');
  
  // If domain is not specified but command requires it, try to infer from user's single domain
  // Note: "network" is a special domain value that should not be inferred
  let domainToUse = domain || parameters.domain;
  if (!domainToUse && requiresDomain) {
    // Check if user has exactly one domain they can access
    if (userDomains.length === 1) {
      domainToUse = userDomains[0];
      parameters.domain = domainToUse;
      console.log(`✅ Inferred domain from user's single access: ${domainToUse}`);
    } else if (userDomains.length === 0 && userEmail && userEmail.endsWith('@offlinestudio.com')) {
      // Offline Studio admins have access to all domains, but we can't infer a default
      return {
        success: false,
        message: '❌ Please specify a domain or "network" for network-wide reports. You have access to all domains, so I need to know which one you want to query.'
      };
    } else if (userDomains.length > 1) {
      return {
        success: false,
        message: `❓ Which domain would you like to query? You have access to: ${userDomains.join(', ')}`
      };
    } else {
      return {
        success: false,
        message: '❌ Please specify a domain. Contact your account admin to request domain access.'
      };
    }
  }
  
  // For commands with optional domain (like product-performance), if domain is specified, check permissions
  // If domain is null, allow network-wide access (no permission check needed)

  // Check permissions if domain is required (but skip for "network" - handled in executePerformanceReport)
  if (domainToUse && domainToUse !== 'network') {
    const permission = await checkDomainPermissionForUser(userId, domainToUse);
    if (!permission.allowed) {
      let errorMessage = `❌ You don't have access to ${domainToUse}.`;
      if (userDomains.length > 0) {
        errorMessage += ` You have access to: ${userDomains.join(', ')}`;
      } else {
        errorMessage += ' Contact your account admin to request access.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
    
    // Update the mapped command domain for use in execution
    mappedCommand.domain = domainToUse;
  } else if (domainToUse === 'network') {
    // Update the mapped command domain for use in execution
    mappedCommand.domain = domainToUse;
  }

  // Execute the command based on type
  try {
    switch (command) {
      case 'mula-performance-report':
        return await executePerformanceReport(parameters, channelId, userId);
      
      case 'mula-product-performance':
        return await executeProductPerformance(parameters, channelId);
      
      case 'mula-engagement-report':
        return await executeEngagementReport(parameters, channelId);
      
      case 'mula-health-check':
        return await executeHealthCheck(parameters, channelId);
      
      case 'mula-click-urls':
        return await executeClickUrls(parameters, channelId);
      
      default:
        return {
          success: false,
          message: `❌ Command "${command}" is not yet supported via natural language. Please use the slash command instead.`
        };
    }
  } catch (error) {
    console.error('Error executing command:', error);
    return {
      success: false,
      message: `❌ Error executing command: ${error.message}`
    };
  }
}

async function executePerformanceReport(parameters, channelId, userId) {
  const Bull = require('bull');
  const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
  const performanceReportQueue = new Bull('performanceReportQueue', redisUrl);
  const domain = parameters.domain;
  const lookbackDays = parameters.days_back || 7;
  
  // Check if user is requesting network-wide report
  const networkWide = domain === 'network';
  
  // Only @offlinestudio.com users can request network-wide reports
  if (networkWide) {
    const userEmail = await require('./SlackUserEmail').getUserEmail(userId);
    if (!userEmail || !userEmail.endsWith('@offlinestudio.com')) {
      return {
        success: false,
        message: '❌ Network-wide reports are only available to Offline Studio team members. Please specify a domain (e.g., example.com).'
      };
    }
  } else {
    // Check domain permission for specific domain requests
    const permission = await checkDomainPermissionForUser(userId, domain);
    if (!permission.allowed) {
      const userEmail = await require('./SlackUserEmail').getUserEmail(userId);
      const userDomains = await require('./SlackPermissions').getUserDomains(userEmail);
      return {
        success: false,
        message: `❌ You don't have access to ${domain}. ${userDomains.length > 0 ? `You have access to: ${userDomains.join(', ')}` : 'Contact your account admin to request domain access.'}`
      };
    }
  }
  
  // Use channelId as channelName - Slack API accepts both channel IDs and names
  // Note: Worker expects 'lookbackDays' not 'daysBack'
  await performanceReportQueue.add('generateReport', {
    domains: networkWide ? null : (domain ? [domain] : null),
    lookbackDays, // Worker expects this parameter name
    networkWide,
    channelId,
    channelName: channelId // Use channel ID directly (Slack API accepts it)
  });
  
  const daysText = lookbackDays === 1 ? '1 day' : `${lookbackDays} days`;
  const domainText = networkWide ? 'network-wide aggregation' : domain;
  return {
    success: true,
    message: `✅ Generating performance report for ${domainText} (${daysText}). I'll send you the results when it's complete.`
  };
}

async function executeProductPerformance(parameters, channelId) {
  const Bull = require('bull');
  const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
  const productPerformanceQueue = new Bull('productPerformanceQueue', redisUrl);
  const daysBack = parameters.days_back || 1;
  const domain = parameters.domain || null; // Optional domain filter
  
  await productPerformanceQueue.add('generateReport', {
    daysBack,
    domain, // Pass domain for filtering (null = network-wide)
    channelId,
    channelName: channelId // Use channel ID directly
  });
  
  const daysText = daysBack === 1 ? '1 day' : `${daysBack} days`;
  const domainText = domain ? ` for ${domain}` : ' (network-wide)';
  return {
    success: true,
    message: `✅ Generating product performance report${domainText} for the past ${daysText}. I'll send you the results when it's complete.`
  };
}

async function executeEngagementReport(parameters, channelId) {
  const Bull = require('bull');
  const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
  const engagementReportQueue = new Bull('engagementReportQueue', redisUrl);
  const domain = parameters.domain;
  const lookbackDays = parameters.days_back || 7;
  
  await engagementReportQueue.add('generateReport', {
    domain,
    lookbackDays,
    channelId,
    channelName: channelId // Use channel ID directly
  });
  
  const daysText = lookbackDays === 1 ? '1 day' : `${lookbackDays} days`;
  return {
    success: true,
    message: `✅ Generating engagement report for ${domain} (${daysText}). I'll send you the results when it's complete.`
  };
}

async function executeHealthCheck(parameters, channelId) {
  const Bull = require('bull');
  const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
  const healthCheckQueue = new Bull('healthCheckQueue', redisUrl);
  let url = parameters.domain;
  
  // If it's not a full URL, make it one
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  await healthCheckQueue.add('checkSite', {
    url,
    channelId
  });
  
  return {
    success: true,
    message: `✅ Starting health check for ${url}. I'll send you the results when it's complete.`
  };
}

async function executeClickUrls(parameters, channelId) {
  const Bull = require('bull');
  const redisUrl = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
  const clickUrlsQueue = new Bull('clickUrlsQueue', redisUrl);
  const domain = parameters.domain;
  const daysBack = parameters.days_back || 7;
  
  await clickUrlsQueue.add('generateClickUrlsReport', {
    domain,
    lookbackDays: daysBack,
    channelId,
    channelName: channelId // Use channel ID directly
  });
  
  const daysText = daysBack === 1 ? '1 day' : `${daysBack} days`;
  return {
    success: true,
    message: `✅ Generating click URLs report for ${domain} (${daysText}). I'll send you the results when it's complete.`
  };
}

module.exports = {
  executeCommand
};

