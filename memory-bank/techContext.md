# Technology Context

## Technology Stack

### Core Languages & Runtimes

**JavaScript/Node.js**
- Primary language for Mula SDK and migration workflows
- Async/await patterns for I/O operations
- ES6+ features throughout codebase

**Python**
- Used for data analysis scripts
- Example: `review-database.py` for data validation

**Google Apps Script**
- JavaScript variant for Google Workspace automation
- Client-side and server-side capabilities
- HTML service for custom dialogs

### Mula SDK Technologies

#### Infrastructure

**Redis (Bull Queues)**
- Job queue management
- Worker orchestration backbone
- Retry logic and failure handling
- Job status tracking

**PostgreSQL**
- Search phrase storage
- Model persistence
- Relational data for product catalogs

**AWS Athena + S3**
- Event data storage (S3)
- SQL queries over event logs (Athena)
- Analytics and reporting foundation

#### External APIs

**OpenAI API**
- LLM-guided search strategy
- Product recommendation generation
- Keyword optimization

**Impact API**
- Affiliate SubID sales data
- Revenue attribution
- RPM calculations

**Slack API**
- Report delivery
- Human-in-the-loop approvals
- Team notifications
- Editorial feedback loops

### MulaOS Technologies

#### Data Sources

**Notion (Export Only)**
- CSV exports as data source
- No live API integration
- Historical data preservation

**Google Sheets**
- Target database for operational data
- Built-in collaboration features
- Formula-based relationships
- Data validation for integrity

#### Development Tools

**Google Apps Script**
- Custom UI components
- Automation scripts
- Business logic layer
- Bound to Google Sheets

**Node.js Scripts**
- Migration workflows
- Data transformation
- Validation utilities

## Development Setup

### MulaOS (This Repository)

#### Prerequisites

```bash
# Node.js (version not specified - check package.json)
node --version

# npm for package management
npm --version

# Google Cloud account with Sheets API access
# Google Apps Script access
```

#### Repository Structure

```
MulaOS/
├── memory-bank/          # Context documentation (this folder)
├── workflows/
│   └── notion-migration/ # Migration scripts
│       ├── *.js          # Node.js workflow scripts
│       ├── *.html        # Apps Script UI components
│       └── *.py          # Python utilities
├── docs/
│   └── notion-to-google-workspace-migration/
│       └── *.md          # Migration documentation
├── Notion Export/        # Source CSV files
└── package.json          # Dependencies
```

#### Key Files

**Migration Workflow Scripts**:
- `import-notion-data.js` - Main import logic
- `fix-relationships.js` - Relationship mapping (currently open)
- `fix-remaining-issues.js` - Additional fixes
- `setup-google-sheets.js` - Sheet structure creation
- `verify-setup.js` - Validation checks

**Apps Script Files**:
- `apps-script-functions.js` - Core automation functions
- `AddProjectDialog.html` - UI for adding projects
- `widgets-helper.js` - UI helper functions
- `platform-helper.js` - Platform-specific utilities

**Documentation**:
- `docs/notion-to-google-workspace-migration/` - Complete migration guide
- `README.md` - Project overview
- `CONTRIBUTING.md` - Contribution guidelines

### Mula SDK (Reference)

**Note**: SDK code is in a separate repository. This section documents the known tech stack.

#### Dependencies

**Core**:
- Redis (Bull) - Job queues
- PostgreSQL - Data persistence
- AWS SDK - S3/Athena integration

**APIs**:
- OpenAI Node.js SDK
- Impact API client
- Slack SDK

**Workers**:
- Bull workers for async processing
- Individual workers per agent function

## Technical Constraints

### Google Sheets Limitations

**Scale**:
- 10 million cells per spreadsheet
- 5 million cells per sheet
- 18,278 columns per sheet
- Formula complexity limits

**Performance**:
- Slow with many VLOOKUP/INDEX formulas
- Apps Script 6-minute execution timeout
- API rate limits apply

**Data Types**:
- Limited validation options
- No true foreign key constraints
- Formula-based relationships can break

### Apps Script Constraints

**Execution**:
- 6-minute maximum runtime
- Daily quotas on API calls
- Memory limitations

**Capabilities**:
- Cannot access local filesystem
- Limited third-party library support
- Bound to Google Workspace ecosystem

### Migration Constraints

**Data Source**:
- Static CSV exports (no live sync)
- Notion export format may change
- Manual export process required

**Target**:
- Google Sheets not a true database
- No transactions or rollbacks
- Manual relationship management

## Dependencies

### Node.js Packages (package.json)

Check `package.json` for complete list. Likely includes:
- Google APIs Node.js client
- CSV parsing libraries
- Data validation utilities

### Google Services

**Required**:
- Google Sheets API
- Google Apps Script
- Google Drive (for file storage)

**Authentication**:
- OAuth 2.0 for API access
- Service account possible for automation

## Tool Usage Patterns

### CSV Processing

**Pattern**: Read → Parse → Transform → Validate → Load

```javascript
// Typical CSV processing flow
const csvData = fs.readFileSync('export.csv', 'utf8');
const records = parseCSV(csvData);
const transformed = records.map(transformRecord);
const validated = transformed.filter(isValid);
await loadToSheets(validated);
```

### Relationship Mapping

**Pattern**: Extract URLs → Match entities → Create formulas

```javascript
// Relationship mapping pattern
const sourceURL = extractNotionURL(field);
const targetEntity = findMatchingEntity(sourceURL);
const formula = `=VLOOKUP("${targetEntity}", Range, Column, FALSE)`;
```

### Apps Script Deployment

**Pattern**: Develop → Test → Deploy → Bind

1. Write functions in `apps-script-functions.js`
2. Test in Apps Script editor
3. Deploy as web app or bound script
4. Bind to specific Google Sheet

### Validation Strategy

**Pattern**: Schema → Rules → Execution → Reporting

1. Define expected schema
2. Create validation rules
3. Run validation checks
4. Report discrepancies

## Configuration Management

### Environment Variables

**Not currently used** - All configuration appears to be in code or Google Sheets.

**Future consideration**: 
- Use `.env` files for sensitive data
- Environment-specific configurations
- API keys and credentials

### Google Apps Script Properties

**Script Properties**: Store configuration in Apps Script
- `PropertiesService.getScriptProperties()`
- Key-value pairs for settings
- Accessible across executions

---

## Mula SDK Technical Infrastructure

### Backend Production (Heroku - www.makemula.ai)

#### Environment Variables
```bash
# Core Services
DATABASE_URL=postgres://... (Heroku PostgreSQL addon)
REDISCLOUD_URL=redis://... (Heroku Redis addon)

# AI & Search APIs
OPENAI_API_KEY=your_openai_key
SERPAPI_API_KEY=your_serpapi_key

# AWS Infrastructure
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1

# Slack Integration
SLACK_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret

# Multi-Credential Management
MCCLATCHY_AMAZON_ASSOC_ACCESS_KEY_ID=...
MCCLATCHY_AMAZON_ASSOC_SECRET_KEY=...
MCCLATCHY_AMAZON_ASSOC_ACCOUNT_ID=...
ON3_IMPACT_USERNAME=...
ON3_IMPACT_PASSWORD=...
ON3_IMPACT_ACCOUNT_ID=...

# Impact API (Revenue Collection)
IMPACT_ACCOUNT_ID=...
IMPACT_USERNAME=...
IMPACT_PASSWORD=...
IMPACT_BASE_URL=https://api.impact.com

# Grafana Monitoring
GRAFANA_URL=https://g-e844782f82.grafana-workspace.us-east-1.amazonaws.com
GRAFANA_API_KEY=...
GRAFANA_DASHBOARD_UID=...
```

### Multi-Credential Management System

**Centralized Configuration** (`SDK/www.makemula.ai/config/credentials.js`):
- Single source of truth for all platform credentials
- Dynamic discovery for UI and Slack commands
- Automatic platform detection (Amazon, Impact, Google Shopping)
- Publisher-specific credential support (McClatchy, ON3, default Mula)

**Credential Types**:
- `default` - Default Mula Amazon Associates
- `mcclatchy` - McClatchy Amazon Associates  
- `on3` - ON3 Impact API (Fanatics affiliate program)

**Resolution Flow**:
1. Search creation specifies `credentialId`
2. SearchOrchestrator reads from Search record
3. Runtime credential resolution via environment variables
4. Automatic platform selection based on credential type

### Slack Integration Architecture

**Signature Verification**:
- HMAC SHA-256 validation with signing secret
- 5-minute timestamp window for replay protection
- Raw body preservation required for verification
- Security-first approach to webhook processing

**Natural Language Processing**:
- `@MulaBot` mentions trigger OpenAI NLP parsing
- Intent extraction and command mapping
- Clarification loops for ambiguous requests
- Seamless conversion to slash command format

**18+ Slash Commands** (`SDK/www.makemula.ai/routes/slack.js`):
1. `/mulaize` - Create page + trigger product search
2. `/mula-remulaize` - Force fresh search (ignores cache)
3. `/mula-performance-report` - KPI dashboard (network-wide)
4. `/mula-product-performance` - SKU-level engagement metrics
5. `/mula-engagement-report` - Cohort analysis (with vs. without Mula)
6. `/mula-site-taxonomy` - Content categorization analysis
7. `/mula-site-targeting-add/list/rm` - Dynamic placement rules
8. `/mula-next-page-targeting-*` - SmartScroll article recommendations
9. `/mula-click-urls` - Click attribution tracking
10. `/mula-site-search` - Internal search phrase analysis
11. `/mula-ab-test-performance` - A/B test results
12. `/mula-impact-on3-subid-report` - Affiliate revenue reports
13. `/mula-health-check` - Site health monitoring
14. `/mula-domain-channels-*` - Domain-channel mappings

**Human-in-the-Loop Workflows**:
- Product approval via Slack interactive buttons
- Feedback modals for rejection reasons with structured input
- Search approval for site targeting placement
- Real-time status updates and notifications

### Monitoring & Observability

**Grafana Real-Time Dashboard**:
- **Data Flow**: Lambda → CloudWatch Metrics → Grafana
- **Custom Namespace**: "Mula/SearchPhrases" with Host/SearchPhrase dimensions
- **Auto-Refresh**: 30-second intervals for real-time monitoring
- **Dynamic Updates**: `scripts/update-grafana-dashboard.js` auto-adds new search phrases
- **Dashboard URL**: `https://g-e844782f82.grafana-workspace.us-east-1.amazonaws.com`

**CloudWatch Custom Metrics**:
- Search phrase view counts by host domain
- Real-time widget view tracking
- Bot detection and filtering metrics
- Performance monitoring (p50, p95, p99 latencies)

**VPC Connectivity**:
- CloudWatch VPC endpoint for Lambda metric publishing
- Enables metrics from VPC-bound functions
- Secure internal network communication

### Revenue Collection System

**Backfill Infrastructure** (`SDK/www.makemula.ai/scripts/backfill-revenue-data.js`):
- Manual revenue collection for historical date ranges
- **Supported Platforms**: `impact`, `amazon_associates`, `other`
- **Date Chunking**: Breaks large ranges into manageable pieces (default 30 days)
- **Job Queue**: Bull queue + PostgreSQL job tracking table
- **Retry Logic**: 3 max attempts with exponential backoff

**Usage Example**:
```bash
# Single date range
node scripts/backfill-revenue-data.js www.on3.com impact 2025-09-01 2025-11-16

# With chunking (recommended for large ranges)
node scripts/backfill-revenue-data.js www.on3.com impact 2025-09-01 2025-11-16 --chunk-days 30
```

**Job Tracking**:
- `RevenueCollectionJob` model tracks status in Postgres
- Worker processes jobs asynchronously
- Detailed logging for monitoring and debugging
- Idempotent design for safe retries

**Impact API Integration** (`SDK/memory-bank/impact-api-integration.md`):
- Individual click and action record collection
- Attribution fields: subId1 (domain), subId2 (searchPhrase), subId3 (productTitle)
- Rich metadata: categories, commission amounts, action tracking values
- A/B test analysis integration via subId fields

### Operational Scripts

**API Integration Testing**:
- `scripts/check-api-endpoints.js` - Tests 13+ Impact API endpoints
- Validates authentication and connectivity
- Rate limiting aware (1 second delays between requests)
- Raw response logging for debugging

**Database Management**:
- `scripts/check-db-schema.js` - Schema inspection via Sequelize
- Validates tables, columns, constraints, indexes
- Migration management and verification
- Ensures database integrity

**Grafana Automation**:
- `scripts/update-grafana-dashboard.js` - Auto-updates dashboards
- Fetches active search phrases from `SiteTargeting` table
- Creates/updates dashboard panels dynamically
- Syncs targeting records to monitoring infrastructure

**Cron Configuration** (`scripts/cron-example.txt`):
- **Heroku Scheduler** (recommended for Heroku deployments)
- **System Cron** for VPS deployments
- **Docker Cron** for containerized environments
- **AWS EventBridge** for Lambda/ECS deployments
- Daily refresh of next-page manifests at 5 AM

### Multi-Tenancy & Permissions

**Domain-Based Access Control** (`SDK/www.makemula.ai/scripts/add-domain-permission.sql`):
```sql
CREATE TABLE domain_user_permissions (
  domain VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  role ENUM('viewer', 'editor') NOT NULL,
  isActive BOOLEAN DEFAULT true,
  PRIMARY KEY (domain, user_email)
);
```

**Roles**:
- `viewer` - Read-only access to domain data and reports
- `editor` - Can create searches, approve products, manage targeting

**Publisher Examples**:
- `www.brit.co` → `jemal@brit.co`, `matt@brit.co` (viewers)
- `www.on3.com` → `logan.lorenz@gmail.com` (editor)

**SQL Management Scripts**:
- `scripts/add-domain-permission.sql` - Add user permissions template
- `scripts/add-brit-co-permissions.sql` - Bulk permission grants example

### Bull Queue Architecture

**Queue Types** (`SDK/www.makemula.ai/worker.js`):
- `encoreQueue` - Legacy queue (deprecated)
- `searchQueue` - Product search orchestration
- `keywordFeedbackQueue` - Keyword optimization loop
- `productFeedbackQueue` - Product approval feedback
- `performanceReportQueue` - Daily/weekly KPI reports
- `engagementReportQueue` - Cohort analysis reports
- `taxonomyAnalysisQueue` - Content categorization
- `nextPageBuildQueue` - SmartScroll manifest generation
- `clickUrlsQueue` - Click attribution tracking
- `siteSearchQueue` - Internal search analysis
- `productPerformanceQueue` - SKU-level metrics
- `abTestQueue` - A/B test result analysis
- `revenueCollectionQueue` - Revenue data collection
- `subidReportQueue` - Affiliate SubID reports

**Worker Patterns**:
- Redis-backed job persistence
- Configurable concurrency per queue
- Exponential backoff on failures
- Job progress tracking
- Slack notifications for completion/errors

### Frontend SDK (sdk.makemula.ai)

**Build System**:
- Svelte 3 component framework
- Gulp 4 build pipeline
- Rollup bundler with tree-shaking
- Terser for minification
- CDN deployment (jsDelivr)

**Environments** (`SDK/sdk.makemula.ai/environments.js`):
- `development` - http://localhost:5000
- `staging` - https://www-staging-makemula-ai.herokuapp.com
- `production` - https://www.makemula.ai

**Widget Types**:
- TopShelf - Header product recommendations
- SmartScroll - Infinite scroll with products
- Listicle - Embedded product lists
- NativeLink - Inline contextual links

**A/B Testing Framework** (`SDK/sdk.makemula.ai/AB_TEST_README.md`):
- Factorial experiment support (2x2, 3x2, etc.)
- Cookie-based variant assignment
- Revenue attribution by variant
- Statistical significance testing
- Slack-based result reporting

### Cloud Infrastructure (cloud.makemula.ai)

**AWS Services**:
- **S3**: Event storage, product manifests, widget configurations
- **CloudFront**: CDN for SDK delivery
- **Kinesis Firehose**: Real-time event ingestion
- **Lambda**: Event transformation (`beacon-kinesis-firehose-transformer`)
- **Athena**: SQL queries over event data
- **CloudWatch**: Custom metrics and logs
- **VPC**: Network isolation for sensitive workloads

**Infrastructure Technical Debt**:
- Most resources manually configured in AWS Console
- Missing Infrastructure-as-Code (Terraform/CloudFormation)
- AWS account migration planned (see `SDK/memory-bank/aws-account-migration-plan.md`)

**S3 Pathing Convention**:
```
s3://mula-sdk-data/
  ├── {domain}/
  │   ├── search_results_{phraseID}.json
  │   ├── temp-recommendations.json
  │   ├── manifest.json (TopShelf/SmartScroll config)
  │   └── next-page-manifest.json (SmartScroll articles)
```

## Version Control

**Git**: Repository tracked in Git
- `.gitignore` should exclude sensitive data
- Commit migration scripts
- Track documentation changes

## Testing Approach

**Currently**: Manual validation after each migration step

**Pattern**:
1. Run migration script
2. Open Google Sheets
3. Visually verify data
4. Check relationships
5. Run `verify-setup.js` for automated checks

**Future**: Consider automated testing framework for workflows

## Debugging Tools

**Node.js**: 
- `console.log()` for tracking
- Node inspector for debugging

**Apps Script**:
- `Logger.log()` for output
- Stackdriver Logging integration
- Debugger in Apps Script editor

**Google Sheets**:
- Formula auditing tools
- Data validation indicators
- Conditional formatting for issues

