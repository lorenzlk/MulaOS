const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Command registry with parameter schemas
 */
const commandRegistry = {
  'mula-performance-report': {
    required: ['domain', 'days_back'],
    optional: [],
    defaults: { days_back: 7 },
    validator: (params) => {
      // Allow "network" as a special domain value for network-wide reports
      if (params.domain !== 'network' && (!params.domain || !params.domain.includes('.'))) {
        throw new Error('Invalid domain format. Use a domain (e.g., example.com) or "network" for network-wide reports.');
      }
      if (!params.days_back || params.days_back < 1 || params.days_back > 365) {
        throw new Error('days_back must be between 1 and 365');
      }
    }
  },
  'mula-product-performance': {
    required: ['domain', 'days_back'],
    optional: [],
    defaults: { days_back: 1 },
    validator: (params) => {
      if (!params.domain || !params.domain.includes('.')) {
        throw new Error('Invalid domain format');
      }
      if (!params.days_back || params.days_back < 1 || params.days_back > 365) {
        throw new Error('days_back must be between 1 and 365');
      }
    }
  },
  'mula-engagement-report': {
    required: ['domain'],
    optional: ['days_back'],
    defaults: { days_back: 7 },
    validator: (params) => {
      if (!params.domain || !params.domain.includes('.')) {
        throw new Error('Invalid domain format');
      }
      if (params.days_back && (params.days_back < 1 || params.days_back > 365)) {
        throw new Error('days_back must be between 1 and 365');
      }
    }
  },
  'mula-health-check': {
    required: ['domain'],
    optional: [],
    validator: (params) => {
      if (!params.domain) {
        throw new Error('Domain or URL is required');
      }
    }
  },
  'mulaize': {
    required: ['url', 'credential_id'],
    optional: [],
    validator: (params) => {
      try {
        new URL(params.url.startsWith('http') ? params.url : `https://${params.url}`);
      } catch {
        throw new Error('Invalid URL format');
      }
      if (!params.credential_id) {
        throw new Error('Credential ID is required');
      }
    }
  },
  'mula-site-targeting-add': {
    required: ['domain', 'targeting_type', 'targeting_value', 'search_phrase', 'credential_id'],
    optional: [],
    validator: (params) => {
      if (!params.domain || !params.domain.includes('.')) {
        throw new Error('Invalid domain format');
      }
      const validTypes = ['path_substring', 'url_pattern', 'ld_json', 'keyword_substring'];
      if (!validTypes.includes(params.targeting_type)) {
        throw new Error(`targeting_type must be one of: ${validTypes.join(', ')}`);
      }
    }
  },
  'mula-site-targeting-list': {
    required: ['domain'],
    optional: [],
    validator: (params) => {
      if (!params.domain || !params.domain.includes('.')) {
        throw new Error('Invalid domain format');
      }
    }
  },
  'mula-site-targeting-rm': {
    required: ['targeting_id'],
    optional: [],
    validator: (params) => {
      if (!params.targeting_id || isNaN(parseInt(params.targeting_id))) {
        throw new Error('targeting_id must be a number');
      }
    }
  },
  'mula-click-urls': {
    required: ['domain'],
    optional: ['days_back'],
    defaults: { days_back: 7 },
    validator: (params) => {
      if (!params.domain || !params.domain.includes('.')) {
        throw new Error('Invalid domain format');
      }
      if (params.days_back && (params.days_back < 1 || params.days_back > 365)) {
        throw new Error('days_back must be between 1 and 365');
      }
    }
  }
};

/**
 * Parse natural language message and extract command intent
 * @param {string} message - The natural language message from user
 * @param {Array<string>} userDomains - Optional array of domains the user has access to
 * @returns {Promise<Object>} Parsed command with parameters
 */
async function parseNaturalLanguage(message, userDomains = []) {
  const systemPrompt = `You are a command parser for MulaBot, a publisher monetization tool.

Available commands:
- mula-performance-report: Generate general performance reports with time series charts (requires: domain or "network", days_back) - Use domain like "example.com" for a specific site, or "network" for network-wide aggregation. Default days_back is 7 if not specified. Use this for "performance report" or "network wide performance report".
- mula-product-performance: Show product-specific performance (views and clicks on product cards) (requires: domain, days_back) - Default days_back is 1 if not specified. ONLY use this command when the user explicitly mentions "product" in their query (e.g., "product performance", "product views", "product clicks"). Do NOT use this for general "performance report" requests.
- mula-engagement-report: Generate engagement reports (requires: domain, optional: days_back)
- mula-health-check: Check site health (requires: domain or URL)
- mulaize: Create page and trigger product recommendations (requires: URL, credential_id)
- mula-site-targeting-add: Add site targeting rules (requires: domain, targeting_type, targeting_value, search_phrase, credential_id)
- mula-site-targeting-list: List site targeting rules (requires: domain)
- mula-site-targeting-rm: Remove site targeting rules (requires: targeting_id)
- mula-click-urls: Generate click URLs reports (requires: domain, optional: days_back)

Parse the following user message and return a JSON object with:
- command: The slash command name (exactly as listed above)
- parameters: Object with extracted parameters - ALWAYS include required parameters. For optional params, use null if missing. For required params with defaults (like days_back), include the default value if the user doesn't specify a time period.
- confidence: Float 0-1 indicating parsing confidence
- needs_clarification: Boolean if parameters are missing or ambiguous
- clarification_questions: Array of strings with questions to ask if needs_clarification is true

For domains, extract the domain exactly as specified, including www if present (e.g., "www.on3.com" stays "www.on3.com", "usmagazine.com" stays "usmagazine.com"). Only remove the protocol (https:// or http://) if present.

IMPORTANT: For mula-performance-report, if the user requests a "network-wide" or "network" report, set domain to the string "network" (not null). This is a special value that indicates network-wide aggregation.

${userDomains.length > 0 ? `\nIMPORTANT: The user has access to the following domain(s): ${userDomains.join(', ')}. If the user asks for a report without specifying a domain and they have access to exactly one domain, automatically use that domain. If they have multiple domains and don't specify one, set needs_clarification to true and ask which domain they want.` : ''}
For URLs, keep the full URL format.
For days/time periods, extract as numbers (e.g., "7 days" -> 7, "last 3 days" -> 3, "last week" -> 7, "30 days" -> 30, "past 3 days" -> 3, "3 day" -> 3). If no time period is mentioned, use the default (7 for mula-performance-report, 1 for mula-product-performance). Always extract the numeric value, never null.
For credential_id, if not mentioned, set to null and needs_clarification to true.

Return only valid JSON, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.3, // Lower temperature for more consistent parsing
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    
    // Validate the parsed result
    if (!parsed.command || !commandRegistry[parsed.command]) {
      return {
        command: null,
        parameters: {},
        confidence: 0,
        needs_clarification: true,
        clarification_questions: ['I\'m not sure what you\'d like to do. Could you clarify?']
      };
    }

    // Apply defaults and validate
    const commandDef = commandRegistry[parsed.command];
    // Merge defaults with parsed parameters, but don't override with null/undefined values
    const parameters = { 
      ...commandDef.defaults, 
      ...Object.fromEntries(
        Object.entries(parsed.parameters || {}).filter(([_, v]) => v !== null && v !== undefined)
      )
    };

    // Validate required parameters
    const missingRequired = commandDef.required.filter(param => !parameters[param]);
    if (missingRequired.length > 0) {
      return {
        command: parsed.command,
        parameters,
        confidence: parsed.confidence || 0.5,
        needs_clarification: true,
        clarification_questions: missingRequired.map(param => {
          if (param === 'domain') return 'Which domain would you like to query?';
          if (param === 'url') return 'Please provide a URL.';
          if (param === 'credential_id') return 'Which credential ID should I use?';
          return `Please provide ${param}.`;
        })
      };
    }

    // Run validator
    try {
      commandDef.validator(parameters);
    } catch (error) {
      return {
        command: parsed.command,
        parameters,
        confidence: parsed.confidence || 0.5,
        needs_clarification: true,
        clarification_questions: [error.message]
      };
    }

    return {
      command: parsed.command,
      parameters,
      confidence: parsed.confidence || 0.8,
      needs_clarification: false,
      clarification_questions: []
    };

  } catch (error) {
    console.error('Error parsing natural language:', error);
    return {
      command: null,
      parameters: {},
      confidence: 0,
      needs_clarification: true,
      clarification_questions: ['Sorry, I had trouble understanding that. Could you rephrase?']
    };
  }
}

/**
 * Get command registry (for external use)
 */
function getCommandRegistry() {
  return commandRegistry;
}

module.exports = {
  parseNaturalLanguage,
  getCommandRegistry
};

