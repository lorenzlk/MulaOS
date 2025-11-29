# Natural Language Slack Interface with Permissions Layer

## Overview

This feature enables users to interact with MulaBot using natural language instead of remembering specific slash commands. The system parses natural language requests, maps them to existing slash commands, and enforces domain-based permissions based on user email addresses.

## Design Goals

1. **Natural Language Processing**: Parse conversational requests and map to slash commands
2. **Permission Enforcement**: Verify user access to domains before executing commands
3. **Seamless Integration**: Work alongside existing slash commands without breaking changes
4. **User-Friendly**: Provide helpful error messages and suggestions when permissions fail

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Slack Message Flow                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Natural Language Parser (LLM)                              │
│  - Parse user intent                                        │
│  - Extract command type                                     │
│  - Extract parameters (domain, URL, days, etc.)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Command Mapper                                              │
│  - Map parsed intent to slash command                       │
│  - Validate required parameters                              │
│  - Format command structure                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Permissions Middleware                                     │
│  - Fetch user email from Slack API                          │
│  - Extract domain from command parameters                    │
│  - Check user access to domain                              │
│  - Allow/deny execution                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Command Executor                                            │
│  - Execute mapped slash command                              │
│  - Return results to user                                    │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Natural Language Parser

**Purpose**: Use LLM to parse natural language and extract structured command data.

**Implementation**:
- Use OpenAI GPT-4 (already integrated via `openai` package)
- Structured output with JSON schema for consistent parsing
- Extract: command type, parameters, domain/URL, optional flags

**Example Prompts**:
```
User: "Can you show me performance for usmagazine.com for the last 7 days?"
Parsed: {
  command: "mula-performance-report",
  domain: "usmagazine.com",
  days_back: 7
}

User: "Generate a report for example.com"
Parsed: {
  command: "mula-performance-report",
  domain: "example.com",
  days_back: 7  // default
}
```

**LLM Prompt Structure**:
```javascript
const parsePrompt = `
You are a command parser for MulaBot, a publisher monetization tool.

Available commands:
- mula-performance-report: Generate performance reports (requires: domain, optional: days_back)
- mula-product-performance: Show product performance (requires: domain, optional: days_back)
- mula-engagement-report: Generate engagement reports (requires: domain, optional: days_back)
- mula-health-check: Check site health (requires: domain or URL)
- mulaize: Create page and trigger product recommendations (requires: URL, credential_id)
- mula-site-targeting-add: Add site targeting rules (requires: domain, targeting_type, targeting_value, search_phrase)
- mula-site-targeting-list: List site targeting rules (requires: domain)
- mula-site-targeting-rm: Remove site targeting rules (requires: domain, targeting_id)

Parse the following user message and return a JSON object with:
- command: The slash command name
- parameters: Object with extracted parameters
- confidence: Float 0-1 indicating parsing confidence
- needs_clarification: Boolean if parameters are missing or ambiguous

User message: "{userMessage}"

Return only valid JSON, no additional text.
`;
```

### 2. Command Mapper

**Purpose**: Map parsed intent to actual slash command structure and validate parameters.

**Implementation**:
- Command registry with parameter schemas
- Parameter validation and defaults
- Error handling for missing required parameters

**Command Registry**:
```javascript
const commandRegistry = {
  'mula-performance-report': {
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
  'mulaize': {
    required: ['url', 'credential_id'],
    optional: [],
    validator: (params) => {
      try {
        new URL(params.url);
      } catch {
        throw new Error('Invalid URL format');
      }
    }
  },
  // ... other commands
};
```

### 3. Permissions Middleware

**Purpose**: Verify user has access to domains before command execution.

**Implementation**:
- Fetch user email from Slack API using `user_id`
- Extract domain from command parameters
- Check permissions against Account model (when implemented) or domain-user mapping
- Return clear error messages for denied access

**Permission Check Flow**:
```javascript
async function checkDomainPermission(userEmail, domain) {
  // 1. Check if user is Offline Studio admin (can access all domains)
  if (userEmail && userEmail.endsWith('@offlinestudio.com')) {
    return { allowed: true, reason: 'offline_studio_admin' };
  }
  
  // 2. Check if user is Mula admin (can access all domains)
  const isMulaAdmin = await MulaAdminUser.findOne({
    where: { email: userEmail, isActive: true }
  });
  
  if (isMulaAdmin) {
    return { allowed: true, reason: 'mula_admin' };
  }
  
  // 3. Get account for domain
  const account = await AccountHelpers.getAccountByDomain(domain);
  if (!account) {
    return { allowed: false, reason: 'domain_not_found' };
  }
  
  // 4. Check if user is account user with access
  const accountUser = await AccountUser.findOne({
    where: {
      accountId: account.id,
      email: userEmail,
      isActive: true
    }
  });
  
  if (!accountUser) {
    return { allowed: false, reason: 'no_account_access' };
  }
  
  // 5. Check role-based permissions for specific commands
  // (Some commands may require higher permissions)
  
  return { allowed: true, reason: 'account_user', role: accountUser.role };
}
```

**Domain Extraction**:
```javascript
function extractDomainFromCommand(command, parameters) {
  // Direct domain parameter
  if (parameters.domain) {
    return parameters.domain;
  }
  
  // Extract from URL
  if (parameters.url) {
    try {
      const url = new URL(parameters.url);
      return url.hostname;
    } catch {
      return null;
    }
  }
  
  // Extract from other parameters that might contain domains
  // (e.g., health-check might accept domain or URL)
  
  return null;
}
```

### 4. Slack User Email Fetching

**Purpose**: Get user email from Slack API for permission checks.

**Implementation**:
- Use Slack Web API to fetch user info
- Cache user emails to reduce API calls
- Handle cases where email is not available

```javascript
const { WebClient } = require('@slack/web-api');
const slackClient = new WebClient(process.env.SLACK_TOKEN);

// Cache for user emails (TTL: 1 hour)
const userEmailCache = new Map();

async function getUserEmail(userId) {
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
    const email = response.user.profile?.email;
    
    if (email) {
      userEmailCache.set(userId, { email, timestamp: Date.now() });
      return email;
    }
  } catch (error) {
    console.error('Error fetching user email from Slack:', error);
  }
  
  return null;
}
```

## Database Schema

### Domain-User Permissions (Interim Solution)

Until the full Account model is implemented, we can use a simple domain-user mapping:

```sql
CREATE TABLE domain_user_permissions (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'editor', 'viewer') DEFAULT 'viewer',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(domain, user_email)
);

CREATE INDEX idx_domain_user_permissions_domain ON domain_user_permissions(domain);
CREATE INDEX idx_domain_user_permissions_email ON domain_user_permissions(user_email);
```

**Special Access Rule**: Users with `@offlinestudio.com` email addresses automatically have access to all domains without needing entries in the permissions table. This is checked first before querying the permissions table.

### Migration to Account Model

When Account model is implemented, this table can be deprecated in favor of:
- `account_domains` (domain → account mapping)
- `account_users` (account → user mapping)
- Combined query: `account_domains` JOIN `account_users` to get domain permissions

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. **Create Natural Language Parser Helper**
   - File: `helpers/NaturalLanguageParser.js`
   - LLM integration for parsing
   - Command registry structure
   - Parameter extraction logic

2. **Create Permissions Helper**
   - File: `helpers/SlackPermissions.js`
   - User email fetching from Slack API
   - Domain permission checking
   - Interim domain-user mapping table

3. **Database Migration**
   - Create `domain_user_permissions` table
   - Add indexes for performance

### Phase 2: Command Integration (Week 1-2)
1. **Create Natural Language Command Handler**
   - New route: `/commands/mula` (or handle @mentions)
   - Integrate parser, mapper, and permissions
   - Execute mapped commands

2. **Update Existing Commands**
   - Add permission checks to existing slash commands
   - Extract domain and verify access
   - Return helpful error messages

3. **Testing**
   - Test natural language parsing accuracy
   - Test permission enforcement
   - Test error handling and edge cases

### Phase 3: Account Model Integration (When Available)
1. **Migrate Permissions**
   - Update permission checks to use Account model
   - Deprecate `domain_user_permissions` table
   - Maintain backward compatibility

2. **Enhanced Role-Based Permissions**
   - Command-specific permission requirements
   - Role-based command access (e.g., only admins can add targeting)

## API Design

### Natural Language Command Endpoint

**Route**: `POST /slack/commands/mula`

**Request Body** (from Slack):
```javascript
{
  token: "...",
  team_id: "...",
  team_domain: "...",
  channel_id: "...",
  channel_name: "...",
  user_id: "U123456",
  user_name: "john",
  command: "/mula",
  text: "show me performance for usmagazine.com for the last 7 days",
  response_url: "...",
  trigger_id: "..."
}
```

**Response**:
```javascript
{
  response_type: "ephemeral",
  text: "✅ Generating performance report for usmagazine.com (7 days). I'll send you the results when it's complete."
}
```

**Error Response**:
```javascript
{
  response_type: "ephemeral",
  text: "❌ You don't have access to example.com. Contact your account admin to request access."
}
```

**Clarification Response**:
```javascript
{
  response_type: "ephemeral",
  text: "I need a bit more information:\n- Which domain would you like the report for?\n- How many days back? (default: 7)"
}
```

## Security Considerations

1. **Slack Signature Verification**: Already implemented via `verifySlackRequest` middleware
2. **Rate Limiting**: Consider adding rate limits for LLM calls
3. **Permission Caching**: Cache permission checks to reduce database load
4. **Error Messages**: Don't leak sensitive information in error messages
5. **Audit Logging**: Log all permission checks and command executions

## Error Handling

### Parsing Errors
- Low confidence parsing → Ask for clarification
- Missing required parameters → Request missing info
- Ambiguous intent → Suggest possible commands

### Permission Errors
- No access to domain → Clear error with suggestion to contact admin
- Missing email → Fallback to user_id-based check or deny
- Domain not found → Suggest valid domains user has access to

### Execution Errors
- Command execution failures → Forward error from original command
- Timeout errors → Inform user and suggest retry

## Example Interactions

### Success Flow
```
User: "Can you show me performance for usmagazine.com?"
Bot: "✅ Generating performance report for usmagazine.com (7 days). I'll send you the results when it's complete."
```

### Permission Denied
```
User: "Show me performance for competitor.com"
Bot: "❌ You don't have access to competitor.com. You have access to: usmagazine.com, womansworldmag.com"
```

### Clarification Needed
```
User: "Show me a report"
Bot: "I need a bit more information:\n- Which domain would you like the report for?\n- How many days back? (default: 7)"
```

### Ambiguous Intent
```
User: "Check something"
Bot: "I'm not sure what you'd like to do. Here are some things I can help with:\n- Performance reports\n- Product performance\n- Health checks\n- Site targeting management"
```

## Future Enhancements

1. **Conversation Context**: Remember previous commands in thread
2. **Command Suggestions**: Suggest commands based on user role
3. **Batch Operations**: "Show me reports for all my domains"
4. **Scheduled Reports**: "Send me weekly reports for usmagazine.com"
5. **Natural Language Responses**: Format results in conversational style
6. **Multi-Command Parsing**: "Check health for usmagazine.com and show me the performance report"

## Slack App Configuration

### Required Setup

To enable @mentions of MulaBot, you need to configure the Slack app with Event Subscriptions:

1. **Enable Event Subscriptions**
   - Go to https://api.slack.com/apps → Your MulaBot app
   - Navigate to "Event Subscriptions" in the left sidebar
   - Toggle "Enable Events" to ON

2. **Set Request URL**
   - Request URL: `https://www.makemula.ai/slack/events`
   - Slack will send a verification challenge (handled by existing `url_verification` logic)

3. **Subscribe to Bot Events**
   - Click "Subscribe to bot events"
   - Add the following event:
     - `app_mentions` - Triggered when someone @mentions MulaBot

4. **Required OAuth Scopes**
   - Ensure the app has these scopes:
     - `app_mentions:read` - Read @mentions
     - `chat:write` - Post messages (already have)
     - `users:read.email` - Read user email addresses (for permissions)
     - `commands` - Slash commands (already have)

5. **Reinstall App to Workspace**
   - After adding new scopes/events, reinstall the app to your workspace
   - Users will need to re-authorize if new scopes are added

### Event Endpoint Implementation

The `/slack/events` endpoint will handle:
- `url_verification` - Slack challenge verification (already handled)
- `app_mentions` - When someone @mentions MulaBot
- `event_callback` - Wrapper for all event types

## Integration Points

### Existing Systems
- **Slack Routes**: `www.makemula.ai/routes/slack.js`
- **OpenAI Integration**: Already available via `openai` package
- **Slack Web API**: Already available via `@slack/web-api`
- **Command Handlers**: Existing slash command implementations
- **Signature Verification**: Already implemented via `verifySlackRequest` middleware

### New Dependencies
- No new dependencies required (using existing OpenAI and Slack packages)

## Testing Strategy

1. **Unit Tests**: Parser, mapper, permission checks
2. **Integration Tests**: Full command flow with mocked Slack API
3. **Permission Tests**: Various user/domain combinations
4. **Error Handling Tests**: Invalid inputs, missing permissions, etc.
5. **LLM Parsing Tests**: Various natural language phrasings

## Rollout Plan

1. **Phase 1**: Deploy with logging only (no execution)
2. **Phase 2**: Enable for Mula admin users only
3. **Phase 3**: Enable for all users with permission checks
4. **Phase 4**: Deprecate old slash commands (optional, keep for backward compatibility)

