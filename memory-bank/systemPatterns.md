# System Patterns

## Architecture Overview

### Mula SDK Architecture (Agent-Based System)

The Mula SDK is architected around six specialized AI agents, each mapping to specific workers and helpers:

```
┌─────────────────────────────────────────────────────────────┐
│                        Mula SDK                              │
├─────────────────────────────────────────────────────────────┤
│  Weston    Sally     Taka      Andy      Occy      Cal      │
│  Content   GenAI     Deploy    Analytics Monitor   Experiment│
│  Analysis  Product   Control   Reports   Revenue   A/B Tests │
└─────────────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Redis   │   │ Postgres │   │ Athena/S3│
    │  Queues  │   │  Search  │   │  Events  │
    └──────────┘   └──────────┘   └──────────┘
           │              │              │
           └──────────────┴──────────────┘
                       │
                       ▼
                 ┌──────────┐
                 │  Slack   │
                 │ Reports  │
                 └──────────┘
```

### MulaOS Architecture (Operations System)

```
┌─────────────────────────────────────────────────────────────┐
│                    Notion Exports (CSV)                      │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Migration Workflows (Node.js)                   │
│  - Data parsing and transformation                           │
│  - Relationship mapping                                      │
│  - Validation and integrity checks                           │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Google Sheets Database                     │
│  - Structured data storage                                   │
│  - Relationship preservation via formulas                    │
│  - Data validation and referential integrity                 │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Google Apps Script Layer                     │
│  - UI enhancements (dialogs, menus)                         │
│  - Automation scripts                                        │
│  - Business logic                                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### Agent-Based Design (Mula SDK)

**Decision**: Split functionality into six named agents rather than generic services.

**Rationale**: 
- Makes the system more understandable to non-technical publishers
- Each agent has clear, focused responsibilities
- Easier to communicate value proposition
- Allows for independent scaling and optimization

**Trade-offs**: 
- More conceptual overhead
- Need to maintain agent "personalities" in documentation
- Risk of confusion if boundaries overlap

### Worker-Helper Pattern (Mula SDK)

**Decision**: Use Bull queue workers for async jobs, with helper modules for shared logic.

**Rationale**:
- Decouples job scheduling from execution
- Enables retry logic and failure handling
- Workers can scale independently
- Helpers promote code reuse

**Implementation**:
- Workers in `/workers` directory
- Helpers in `/helpers` directory
- Redis as queue backend
- Slack as notification layer

### URL-Based Identity (MulaOS)

**Decision**: Use Notion URLs as primary identifiers for entities.

**Rationale**:
- Notion URLs are guaranteed unique
- Persist across exports
- Enable traceability back to source
- Human-readable for debugging

**Trade-offs**:
- Longer than numeric IDs
- External dependency on Notion URL format
- Need URL parsing/validation

### Google Sheets as Database (MulaOS)

**Decision**: Use Google Sheets instead of traditional database for operations data.

**Rationale**:
- Immediate visibility for all team members
- No separate UI needed - everyone knows Sheets
- Built-in collaboration features
- Easy to extend with Apps Script
- Low hosting/maintenance costs

**Trade-offs**:
- Performance limitations at scale
- Limited query capabilities
- Formula complexity can be brittle
- No built-in referential integrity

## Design Patterns in Use

### 1. Agent Pattern (Mula SDK)

Each agent is responsible for a domain area:
- **Autonomy**: Agents operate independently
- **Specialization**: Each has unique capabilities
- **Coordination**: Agents share data through common infrastructure
- **Communication**: Slack integration for human oversight

### 2. Queue-Based Architecture (Mula SDK)

- **Jobs**: Discrete units of work
- **Workers**: Process jobs asynchronously
- **Queues**: Bull/Redis for job management
- **Retries**: Automatic retry with exponential backoff

### 3. Helper Module Pattern (Mula SDK)

- **Separation**: Pure functions vs. stateful workers
- **Reusability**: Helpers used across multiple workers
- **Testability**: Easier to unit test pure functions
- **Organization**: Clear file structure

### 4. Agent Orchestration Pattern (Granny)

**Principle**: Don't reimplement mature systems—orchestrate and enhance them.

**Example**: Granny + `/onboard` Integration
```yaml
existing_system:
  name: "/onboard"
  location: "/Users/loganlorenz/Onboarding/"
  maturity: "Production (98% time reduction, 80%+ accuracy)"
  capabilities: ["CMS detection", "DOM selectors", "GTM detection", "Competitor analysis", ...]
  
granny_approach:
  reimplementation: ❌ "Don't duplicate mature functionality"
  orchestration: ✅ "Trigger /onboard at strategic times"
  interpretation: ✅ "Add contextual and strategic guidance"
  integration: ✅ "Combine technical + contextual + business intelligence"
  gap_filling: ✅ "Build what /onboard doesn't cover"
  
benefits:
  - Build on proven infrastructure (60 second analysis vs. 2-4 hours)
  - Focus on unique value-add (context, strategy, holistic view)
  - Reduce development time (leverage vs. rebuild)
  - Maintain single source of truth for technical discovery
```

**Pattern Application**:
- Granny's **Technical Intelligence** domain orchestrates `/onboard`
- `/onboard` remains production tool for quick technical checks
- Granny adds: timing, context, strategy, gap detection, holistic synthesis
- Future tools (site crawler, health check) follow same pattern

**Key Insight**: Agents are strategic layers that orchestrate existing capabilities, not replacements.

### 5. ETL Pipeline (MulaOS)

Migration follows Extract-Transform-Load pattern:
- **Extract**: Parse Notion CSV exports
- **Transform**: Map relationships, clean data, validate
- **Load**: Write to Google Sheets with proper structure

### 5. Relationship Mapping (MulaOS)

- **Source**: Notion URL strings
- **Transform**: Parse and match to target entities
- **Target**: VLOOKUP formulas in Google Sheets
- **Validation**: Data validation rules for integrity

## Component Relationships

### Mula SDK Components

**Workers → Helpers → External Services**

```
taxonomyAnalysisWorker
  └─> Crawler.js
  └─> SiteTargetingHelpers.js
      └─> Athena (query events)
      └─> Slack (send reports)

searchWorker
  └─> SearchOrchestrator.js
  └─> ProductHelpers.js
      └─> OpenAI API (strategy)
      └─> Postgres (search index)
      └─> Redis (orchestration state)

performanceReportWorker
  └─> AthenaUtils.js
  └─> LoggingHelpers.js
      └─> Athena (KPI queries)
      └─> Impact API (revenue data)
      └─> Slack (delivery)
```

### MulaOS Components

**Migration Scripts → Google Sheets → Apps Script**

```
import-notion-data.js
  └─> platform-helper.js
      └─> Google Sheets API

fix-relationships.js
  └─> Relationship mapping logic
      └─> Update formulas in sheets

apps-script-functions.js
  └─> AddProjectDialog.html
  └─> widgets-helper.js
      └─> Custom UI in Google Sheets
```

## Critical Implementation Paths

### Adding a New Agent Worker (Mula SDK)

1. Create worker file in `/workers`
2. Define job processing logic
3. Add helper functions as needed
4. Register with Bull queue
5. Add Slack notification
6. Document in agent mapping

### Migrating a New Entity Type (MulaOS)

1. Analyze Notion export structure
2. Design Google Sheets schema
3. Create transformation logic
4. Map relationships to other entities
5. Implement validation rules
6. Test data integrity
7. Update documentation

### Adding Apps Script Functionality (MulaOS)

1. Write function in `apps-script-functions.js`
2. Create UI components if needed (HTML)
3. Add helper functions in `widgets-helper.js`
4. Test in Google Apps Script editor
5. Deploy to production spreadsheet
6. Document usage in migration docs

## Data Flow Patterns

### Event Flow (Mula SDK)

```
Publisher Site Event
  └─> S3 (raw events)
      └─> Athena (queryable)
          └─> Worker (analysis)
              └─> Postgres (results)
                  └─> Slack (reports)
```

### Migration Flow (MulaOS)

```
Notion Export (CSV)
  └─> Parse & Validate
      └─> Transform Relationships
          └─> Load to Google Sheets
              └─> Apply Formulas
                  └─> Validate Integrity
```

## Performance Considerations

### Mula SDK

- **Queue Concurrency**: Control worker parallelism
- **Rate Limiting**: Respect API limits (OpenAI, Impact)
- **Caching**: Redis for frequently accessed data
- **Batch Processing**: Group similar operations

### MulaOS

- **Sheet Size**: Monitor row counts (Google Sheets limits)
- **Formula Complexity**: Avoid deeply nested formulas
- **Data Validation**: Use ranges, not entire columns
- **Apps Script Quotas**: Be aware of execution time limits

---

## Mula SDK Operational Patterns

### Human-in-the-Loop Approval Workflows

#### Product Approval Flow

**Entry Points**:
1. **Slack UI**: Button-based approval in domain channels
2. **Web Dashboard**: `/searches/show` page with approve/reject buttons

**Approval Logic** (`SDK/www.makemula.ai/helpers/SearchApprovalHelpers.js`):
```javascript
approveSearch(searchId, pageId = null) {
  // 1. Copy temp-recommendations.json → search_results_{phraseID}.json
  // 2. Update Search.status = 'approved'
  // 3. Update Page.searchIdStatus = 'approved' (if pageId provided)
  // 4. Idempotent - safe to call multiple times
}
```

**Process Flow**:
1. Search completes → Products stored at `tempRecommendationsUrl`
2. Slack notification with interactive buttons posted
3. User actions:
   - **Approve** → `SearchApprovalHelpers.approveSearch()`
   - **Reject** → Opens feedback modal for reasons
4. Feedback modal → Queues `productFeedbackWorker` job
5. Approved products → Widget displays on site

**Rejection Feedback Loop**:
- User provides structured rejection reasons
- System stores searchId, pageId, feedback, URL context
- Triggers new orchestrated search with feedback
- LLM uses feedback to improve product selection
- New results go through approval again

#### Search Targeting Approval Flow

**Site Targeting** (`/mula-site-targeting-add`):
1. Admin creates `SiteTargeting` record with search phrase
2. System creates `Search` record if phrase doesn't exist
3. Queues `searchQueue` job via SearchOrchestrator
4. OpenAI evaluates product relevance to target content
5. Human approval via Slack buttons
6. Only approved searches appear in `manifest._targeting`

**Approval Requirements**:
- Search must have `status = 'approved'`
- Page-Search relationship must have `searchIdStatus = 'approved'`
- SiteTargeting record must be active (not soft-deleted)

### Multi-Platform Credential Management

#### Credential Resolution Pattern

**Configuration-Driven** (`SDK/www.makemula.ai/config/credentials.js`):
```javascript
{
  default: {
    name: 'Default (Mula)',
    platform: 'amazon',
    envVars: {
      accessKeyId: 'AMAZON_ASSOC_ACCESS_KEY_ID',
      secretAccessKey: 'AMAZON_ASSOC_SECRET_KEY',
      accountId: 'AMAZON_ASSOC_ACCOUNT_ID'
    }
  },
  mcclatchy: {
    name: 'McClatchy',
    platform: 'amazon',
    envVars: { /* McClatchy-specific env vars */ }
  },
  on3: {
    name: 'ON3',
    platform: 'fanatics',
    envVars: { /* Impact API credentials */ }
  }
}
```

**Resolution Flow**:
1. Search creation specifies `credentialId` (defaults to 'default')
2. SearchOrchestrator reads credentialId from Search record
3. Strategy resolves credentials via `resolveCredentials(credentialId)`
4. Environment variables loaded at runtime
5. Credentials used for platform API calls

**UI Integration**:
- Web UI: Dropdown auto-populated from `credentials.AVAILABLE_CREDENTIALS`
- Slack: Help text shows available credential options
- Dynamic: Adding new credentials only requires config update

#### Domain-Based Platform Selection

**Automatic Detection** (`SDK/www.makemula.ai/helpers/SearchOrchestrator.js`):
```javascript
// Extract TLD from domain
const topLevelDomain = extractTopLevelDomain(domain);

// Auto-select platform for specific publishers
if (topLevelDomain === 'on3.com') {
  platform = 'fanatics';
  platformConfig = {};
}
```

**Multi-Platform Strategy Selection**:
- `amazon` → `AmazonSearchStrategy.js` (Amazon Associates API)
- `fanatics` → `FanaticsSearchStrategy.js` (Impact API)
- `google_shopping` → `GoogleShoppingStrategy.js` (SERP API)

### Revenue Collection Patterns

#### Date Range Chunking Strategy

**Problem**: Large date ranges cause API timeouts and memory issues

**Solution** (`SDK/www.makemula.ai/scripts/backfill-revenue-data.js`):
```javascript
// Break large date range into chunks
const chunks = [];
let currentDate = new Date(startDate);
while (currentDate <= endDate) {
  const chunkEnd = new Date(currentDate);
  chunkEnd.setDate(chunkEnd.getDate() + chunkDays - 1);
  
  chunks.push({
    start: currentDate.toISOString().split('T')[0],
    end: chunkEnd.toISOString().split('T')[0]
  });
  
  currentDate = new Date(chunkEnd);
  currentDate.setDate(currentDate.getDate() + 1);
}
```

**Benefits**:
- Prevents API timeouts on large ranges
- Enables parallel processing (future optimization)
- Better error recovery (retry individual chunks)
- Progress tracking per chunk
- Memory efficient

#### Job Tracking Pattern

**Postgres State Management** (`SDK/www.makemula.ai/models/RevenueCollectionJob.js`):
```javascript
{
  domain: 'www.on3.com',
  platform: 'impact',
  startDate: '2025-09-01',
  endDate: '2025-09-30',
  status: 'pending' | 'processing' | 'completed' | 'failed',
  attempts: 0,
  maxRetries: 3,
  error: null,
  result: {}
}
```

**Worker Processing Flow**:
1. Create job record with `status='pending'`
2. Queue Bull job with jobId reference
3. Worker updates status → `processing`
4. On success: `status='completed'`, store result
5. On failure: increment attempts, store error
6. If attempts < maxRetries: requeue with exponential backoff
7. Slack notification on final completion/failure

### Slack Command Authorization Pattern

#### Role-Based Access Control

**Authorization Flow** (`SDK/www.makemula.ai/routes/slack.js`):
```javascript
// 1. Extract user email and domain from Slack payload
const { user_email, text } = req.body;
const domain = extractDomain(text);

// 2. Check domain permissions table
const permission = await DomainUserPermission.findOne({
  where: { domain, user_email, isActive: true }
});

// 3. Role validation
if (!permission) {
  return res.json({ text: '❌ No access to this domain' });
}

if (action === 'mulaize' && permission.role === 'viewer') {
  return res.json({ text: '❌ Editor role required for this action' });
}
```

**Command-Level Permissions**:
- `viewer` - Can run reports, view data, monitor performance
- `editor` - Can create searches, approve products, manage targeting
- No permission - No access to domain operations

**Security Benefits**:
- Fine-grained access control per publisher
- Easy onboarding/offboarding via SQL scripts
- Audit trail of who has access
- Role-based feature gating

### Sales Enablement Pattern

#### Visual Widget Placement Tool

**Activation** (`SDK/sdk.makemula.ai/sales-enablement-demo.html`):
```javascript
// Enable via global flag
window.Mula.activateSalesEnablements = true;

// BootLoader detects flag and activates tool
if (window.Mula.activateSalesEnablements) {
  const tool = new SalesEnablementTool();
  tool.activate();
}
```

**User Flow**:
1. **Widget Type Selection**: Radio buttons for TopShelf/SmartScroll
2. **Element Highlighting**: Mouse hover shows blue border + semi-transparent overlay
3. **Click to Insert**: Widget dynamically inserted at clicked DOM element
4. **Auto-Boot**: Automatically calls `window.Mula.boot()` to fetch products
5. **Visual Feedback**: Inserted widgets show type label for identification
6. **Clean Exit**: Cancel button removes tool + event listeners

**Architectural Benefits**:
- Separate file (`SalesEnablementTool.js`) for isolation
- Zero production code pollution
- Easy activation/deactivation via flag
- Clean memory management on exit
- No dependencies on external libraries

**Use Cases**:
- Sales demos with prospects
- Publisher onboarding and placement testing
- Internal QA and visual testing
- Client presentations

### Search Orchestration Pattern

#### LLM-Guided Strategy

**Orchestrator** (`SDK/www.makemula.ai/helpers/SearchOrchestrator.js`):
```javascript
async orchestrateSearch(domain, url, pageId, credentialId) {
  // 1. Resolve credentials
  const credentials = resolveCredentials(credentialId);
  
  // 2. Select platform strategy (Amazon, Fanatics, Google Shopping)
  const strategy = selectStrategy(credentials.platform);
  
  // 3. LLM generates search strategy
  const searchPlan = await strategy.generateSearchPlan(url, pageContent);
  
  // 4. Execute searches across multiple indexes
  const results = await strategy.executeSearches(searchPlan);
  
  // 5. LLM evaluates product relevance
  const rankedProducts = await strategy.rankProducts(results, pageContent);
  
  // 6. Store temporary recommendations
  await storeTemporaryRecommendations(rankedProducts);
  
  // 7. Human approval loop
  await notifyForApproval(domain, pageId, searchId);
}
```

**Key Principles**:
- **Adaptive**: LLM adapts strategy to page content
- **Multi-Index**: Searches across All, Fashion, HomeGarden, etc.
- **Quality-First**: LLM filters low-relevance products
- **Human Oversight**: Always requires approval
- **Platform-Agnostic**: Works with Amazon, Impact, Google Shopping

### A/B Testing Infrastructure Pattern

#### Factorial Experiment Framework

**Variant Assignment** (`SDK/sdk.makemula.ai/src/lib/ABTestManager.js`):
```javascript
// 2x2 factorial: Widget Type (TopShelf vs SmartScroll) x Ordering (Relevance vs Engagement)
const variants = [
  { widgetType: 'topShelf', ordering: 'relevance' },
  { widgetType: 'topShelf', ordering: 'engagement' },
  { widgetType: 'smartScroll', ordering: 'relevance' },
  { widgetType: 'smartScroll', ordering: 'engagement' }
];

// Cookie-based stable assignment
const variantIndex = getUserId() % variants.length;
const assignedVariant = variants[variantIndex];
```

**Revenue Attribution**:
- SubID fields encode variant: `subId2=searchPhrase_variant`
- Impact API tracks revenue by SubID
- Worker aggregates revenue by variant
- Statistical significance testing (Chi-Square)

**Result Reporting** (`SDK/www.makemula.ai/workers/abTestQueue.js`):
- Slack-based daily/weekly summaries
- Confidence intervals for each variant
- Winner declaration when p < 0.05
- Recommendations for rollout

**Historical Results** (from release notes):
- SmartScroll 2x2 factorial concluded: Relevance ordering won
- Engagement ordering showed no statistically significant lift
- Decision: Ship relevance as default

