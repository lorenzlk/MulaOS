const { WebClient } = require('@slack/web-api');

const slackClient = new WebClient(process.env.SLACK_TOKEN);

// Cache for user emails (TTL: 1 hour)
const userEmailCache = new Map();

/**
 * Get user email from Slack API
 * @param {string} userId - Slack user ID
 * @returns {Promise<string|null>} User email or null if not available
 */
async function getUserEmail(userId) {
  if (!userId) {
    return null;
  }

  // Check cache first
  if (userEmailCache.has(userId)) {
    const cached = userEmailCache.get(userId);
    if (Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.email;
    }
  }

  // Fetch from Slack API
  try {
    const response = await slackClient.users.info({ user: userId });
    const email = response.user?.profile?.email;
    
    if (email) {
      userEmailCache.set(userId, { email, timestamp: Date.now() });
      return email;
    }
  } catch (error) {
    console.error('Error fetching user email from Slack:', error);
  }

  return null;
}

/**
 * Clear cache for a specific user (useful for testing or updates)
 * @param {string} userId - Slack user ID
 */
function clearUserCache(userId) {
  if (userId) {
    userEmailCache.delete(userId);
  }
}

/**
 * Clear all cached user emails
 */
function clearAllCache() {
  userEmailCache.clear();
}

module.exports = {
  getUserEmail,
  clearUserCache,
  clearAllCache
};

