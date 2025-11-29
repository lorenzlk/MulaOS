# Domain-Channel Mappings

This system manages the mapping between domains and Slack channels for Mula reports. Instead of hardcoded mappings, these are now stored in a database and can be managed via Slack commands.

## Database Schema

The `domain_channel_mappings` table contains:
- `domain`: The domain name (e.g., `brit.co`, `spotcovery.com`)
- `channelId`: The Slack channel ID where the command was executed
- `channelName`: The Slack channel name (e.g., `#proj-mula-brit`)
- `displayName`: Optional display name for the domain (e.g., `DeepAI.org` for `mula-usage-example.vercel.app`)

## Slack Commands

### Add a Domain-Channel Mapping

**Command:** `/mula-domain-channels-add <domain> [displayName]`

**Description:** Adds a mapping between a domain and the current Slack channel.

**Parameters:**
- `domain` (required): The domain name to map
- `displayName` (optional): A display name for the domain

**Examples:**
```
/mula-domain-channels-add brit.co
/mula-domain-channels-add mula-usage-example.vercel.app DeepAI.org
```

**Response:**
- Success: `✅ Added mapping: 'brit.co' → #proj-mula-brit`
- Error if mapping already exists: `❌ Mapping for domain 'brit.co' already exists`

### List All Domain-Channel Mappings

**Command:** `/mula-domain-channels-list`

**Description:** Lists all current domain-channel mappings with their display names.

**Response:**
```
Domain-Channel Mappings:
• 'brit.co' → #proj-mula-brit
• 'mula-usage-example.vercel.app' → #proj-mula-deepai (display: 'DeepAI.org')
• 'spotcovery.com' → #proj-mula-spotcovery
```

### Remove a Domain-Channel Mapping

**Command:** `/mula-domain-channels-rm <domain>`

**Description:** Removes a mapping between a domain and its associated channel.

**Parameters:**
- `domain` (required): The domain name to remove

**Examples:**
```
/mula-domain-channels-rm brit.co
```

**Response:**
- Success: `✅ Removed mapping for 'brit.co'`
- Not found: `❌ No mapping found for 'brit.co'`

### Generate Performance Report

**Command:** `/mula-performance-report [domains|network|lookback] [lookback]`

**Description:** Generates a performance report with time series charts for specified domains, network-wide aggregation, or all domains.

**Parameters:**
- `domains` (optional): Comma-separated list of domains (e.g., `brit.co,spotcovery.com`)
- `network` or `all` (optional): Sentinel value to indicate network-wide aggregation across all domains
- `lookback` (optional): Number of days to look back (default: 7, max: 365)

**Examples:**
```
/mula-performance-report
/mula-performance-report brit.co
/mula-performance-report brit.co,spotcovery.com
/mula-performance-report brit.co,spotcovery.com 14
/mula-performance-report network
/mula-performance-report network 14
/mula-performance-report all 30
/mula-performance-report 30
```

**Response:**
- Success: `📊 Generating performance report for all domains (7 days). I'll send you the results when it's complete.`
- Error: `❌ Invalid domain format. Please provide valid domains (e.g., example.com)`

## Setup Instructions

### 1. Run Database Migration

First, run the Sequelize migration to create the table:

```bash
npx sequelize-cli db:migrate
```

### 2. Migrate Existing Mappings

Run the migration script to populate the database with existing hardcoded mappings:

```bash
node scripts/migrate-domain-mappings.js
```

### 3. Configure Slack Commands

Add the following slash commands to your Slack app:

- **Command:** `/mula-domain-channels-add`
  - **Request URL:** `https://your-domain.com/slack/commands/domain-channels-add`
  - **Short Description:** Add a domain-channel mapping

- **Command:** `/mula-domain-channels-list`
  - **Request URL:** `https://your-domain.com/slack/commands/domain-channels-list`
  - **Short Description:** List all domain-channel mappings

- **Command:** `/mula-domain-channels-rm`
  - **Request URL:** `https://your-domain.com/slack/commands/domain-channels-rm`
  - **Short Description:** Remove a domain-channel mapping

- **Command:** `/mula-performance-report`
  - **Request URL:** `https://your-domain.com/slack/commands/performance-report`
  - **Short Description:** Generate performance report with charts

### 4. Update Existing Mappings

After setting up the commands, you should update the existing mappings with proper channel IDs:

1. Go to each channel where you want reports to be sent
2. Run `/mula-domain-channels-add <domain>` to update the mapping with the correct channel ID
3. The system will automatically replace the existing mapping

## Usage in Reports

The reports system now automatically loads mappings from the database instead of using hardcoded values. The `loadMappingsFromDatabase()` function is called at the start of each report run.

## Error Handling

- If the database is unavailable, the system falls back to empty mappings
- The network mapping (`network` → `#proj-mula-reports`) remains hardcoded as it's a special case
- All commands include proper error handling and user-friendly error messages

## Security

- All commands verify Slack signatures before processing
- Channel information is retrieved from Slack API to ensure accuracy
- Only users with access to the channel can add mappings for that channel 