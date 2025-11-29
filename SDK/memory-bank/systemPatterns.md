# System Patterns: Mula

## Architecture Overview

Mula is an Agentic Operating System for Publisher Monetization that follows a distributed, event-driven architecture with clear separation between client-side SDK, cloud infrastructure, and backend services. The system is designed around AI agents that work together to analyze content, generate recommendations, and optimize monetization.

**IMPORTANT**: AWS Account Migration in Progress - The entire backend infrastructure is being migrated from the current AWS account to a new account under the makemula.ai business entity. See `memory-bank/aws-account-migration-plan.md` for complete migration details.

- Search orchestration is managed by a central orchestrator, with platform-agnostic strategies, LLM-guided keyword/index selection, and feedback loop.
- Search records are immutable; page-search approval is tracked via searchIdStatus on Page.
- Approval logic is centralized and shared between web and Slack.
- S3 pathing for search results is based on a hash of (phrase, platform, platformConfig).
- Site targeting system provides fallback product feeds for unmanifested pages based on URL patterns, path substrings, or JSON-LD data.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Publisher     │    │   CDN Layer     │    │  Backend        │
│   Websites      │    │                 │    │  Services       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Mula SDK    │◄┼────┼►│ cdn.makemula│ │    │ │ www.makemula│ │
│ │ (Svelte)    │ │    │ │ .ai         │ │    │ │ .ai         │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Event       │◄┼────┼►│ beacon.makem│ │    │ │ Data        │ │
│ │ Collection  │ │    │ │ ula.ai      │ │    │ │ Pipeline    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## AI Agent Architecture

### Specialized AI Agent Suite
Mula's architecture consists of a system of specialized AI agents that work together to analyze content, generate recommendations, and optimize monetization:

#### **Weston Agent: Content Analysis Module**
- **Purpose**: Ingests existing web page content and metadata
- **Capabilities**: 
  - Analyzes content for semantic relevance and contextual alignment
  - Identifies optimal injection points for additional content
  - Creates taxonomies used to create relevant product trends
- **Implementation**: Currently implemented via Slack commands and Heroku backend

#### **Sally Agent: Generative AI Module**
- **Purpose**: Uses pre-trained and fine-tuned large language models (LLMs) to generate content
- **Capabilities**:
  - Generates text, images, videos, and interactive elements
  - Creates recommended products, related content/articles, relevant Q&A or UGC
  - Ensures content adheres to publisher's editorial standards and voice
  - Drives engagement through contextual content generation
- **Human-in-the-Loop**: Content summaries, analyses, and suggestions require human approval
- **Implementation**: OpenAI GPT-4 integration via Slack commands

#### **Taka Agent: Dynamic Content Deployment & Control Module**
- **Purpose**: Injects genAI content into various UI widgets/elements dynamically
- **Capabilities**:
  - Injects content into nearly any location on any website design/layout
  - Supports endless scroll interface by continuously generating and appending relevant content
  - UI/Widgets can be implemented/controlled via Slack commands by non-technical users
  - Optimized UI elements including style, animations, button titles/sizes
- **Implementation**: Slack command integration with Heroku backend

#### **Andy Agent: Personalization and Optimization Engine**
- **Purpose**: Conducts A/B/n testing and optimization
- **Capabilities**:
  - A/B/n testing on appended content ordering/selection
  - Optimizes engagement and monetization KPIs of products or other content
  - Reinforcement ML to auto-optimize product ordering for maximum engagement
  - Reporting module with instrumentation for core health vitals
- **Implementation**: Athena queries and analytics pipeline

#### **Occy Agent: Monetization Module & Integrations**
- **Purpose**: Manages affiliate and ad revenue optimization
- **Capabilities**:
  - Injects ads, both CPM and CPC, into Mula content UIs/widgets
  - Integrates with affiliate or other product catalogs extensively
  - Existing integrations: impact.com, Amazon Associates, SkimLinks, Google Shopping
  - Ad serving optimizations to increase revenue
- **Implementation**: Multi-platform affiliate API integrations

### Human-in-the-Loop Architecture
- **Content-Critical Agents**: Weston and Sally operate with human approval and override capabilities
- **Slack Integration**: Agents invokable directly through Slack slash commands
- **Real-time Support**: Observable customer support via inter-org channels
- **Approval Workflows**: Human approval required for content generation and product recommendations

## Key Technical Decisions

### 1. Monorepo Structure
**Decision**: Single repository containing all related projects
**Rationale**: 
- Easier dependency management
- Coordinated versioning
- Simplified development workflow
- Shared tooling and configurations

### 2. Svelte for SDK Components
**Decision**: Use Svelte 3 for client-side components
**Rationale**:
- Smaller bundle size compared to React/Vue
- Better performance characteristics
- Simpler component model
- Excellent for lightweight SDK requirements
- Enables AI-powered monetization without performance impact

### 3. Hybrid Cloud Infrastructure
**Decision**: AWS for data pipeline and CDN, Heroku for AI agent processing
**Rationale**:
- AWS: Scalable and reliable for data processing and CDN
- Heroku: Simplified deployment and management for AI agent backend
- Cost-effective for CDN and data processing
- Rich ecosystem for analytics and ML
- Managed services reduce operational overhead
- Slack integration for human-in-the-loop agent oversight

### 4. Event-Driven Data Pipeline
**Decision**: Kinesis Firehose → Lambda → S3 → Athena
**Rationale**:
- Real-time event processing
- Scalable data ingestion
- Cost-effective storage and querying
- Enables future ML/AI capabilities

### 5. AI Agent Process Flow
**Mula Process Flow**:
1. Publisher installs Mula
2. Weston monitors the site and creates taxonomies used to create relevant product trends
3. Sally searches affiliate catalogs for relevant product feeds based on Weston's taxonomies
4. Taka uses Weston and Sally's work to target and place Mula product feeds with human-in-the-loop oversight via Slack
5. Site visitors click on Mula recommendations
6. Occy witnesses clicks/purchases and manages feed order to balance explore vs. exploit for popular and trending items
7. Andy surfaces reports and insights to publishers via Slack
8. Engineers work with Cal agent to experiment with new variations on Mula's widgets and AI agents

### 6. Central orchestrator manages search attempts, feedback, and approval.
### 7. Search records are immutable; page-search approval is tracked separately.
### 8. Approval logic is shared between web and Slack for consistency.
### 9. All search result files are keyed by a hash of (phrase, platform, config).
### 10. Domain-channel mappings are database-driven and managed via Slack commands.
### 11. Reports system loads mappings dynamically from database instead of hardcoded values.
### 12. Site targeting system provides fallback product feeds for unmanifested pages using URL patterns, path substrings, or JSON-LD data.
### 13. Site targeting searches go through the same human-in-the-loop approval workflow as page searches.
### 14. Soft deletes are used for site targeting records to enable clean manifest management.
### 15. SmartScroll 2x2 Factorial A/B Test system provides comprehensive testing of layout and monetization factors with multi-partner revenue attribution.
### 16. Next Page recommendations system provides article recommendations within SmartScroll widget using data-driven content discovery and Open Graph metadata extraction.

## Design Patterns

### 1. Component-Based Architecture (SDK)
```
┌─────────────────────────────────────────────────────────────┐
│                    Mula SDK                                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ BootLoader  │ │ SmartScroll │ │ TopShelf    │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Feed        │ │ Card        │ │ ProductModal│            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Logger      │ │ ViewTracker │ │ FeedStore   │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 2. Publisher Integration Pattern
```javascript
// Simple script tag integration
<script src="https://cdn.makemula.ai/sdk/latest/js/mula.js" defer></script>
```

### 3. Event Collection Pattern
```javascript

### 4. Athena Query Execution Pattern (CRITICAL)
**Pattern**: `executeQuery` downloads files but doesn't return content
**Implementation**:
```javascript
// ❌ WRONG - Don't expect result.data
const data = parseCSV(result.data); // This will fail!

// ✅ CORRECT - Extract path and read file manually
const timestamp = result.outputLocation.split('/').slice(-2, -1)[0];
const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', queryName, timestamp, `${result.queryExecutionId}.csv`);
const csvContent = await fs.readFile(localFilePath, 'utf8');
const data = parseCSV(csvContent);
```

**Why This Pattern Exists**:
- `executeQuery` handles AWS Athena execution and S3 download
- Returns metadata (execution time, data scanned, file locations)
- Workers must read CSV content from local filesystem
- Enables parallel processing and error handling

**Common Pitfalls**:
- Expecting `result.data` to contain CSV content
- Not handling file path construction correctly
- Missing error handling for file read operations

**Files Using This Pattern**:
- `productPerformanceWorker.js` ✅ (correctly implemented)
- `engagementReportWorker.js` ✅ (now fixed)
- Other workers may need similar fixes
// Base64 encoded JSON via query string
const event = {
  type: 'feed_click',
  productId: '123',
  sessionId: 'abc',
  timestamp: Date.now()
};
const encoded = btoa(JSON.stringify(event));
const pixel = `https://beacon.makemula.ai/track?data=${encoded}`;
```

### 4. Data Processing Pattern
```
Publisher Event → Kinesis Firehose → Lambda → S3 (partitioned) → Athena
```

### 5. Query Development Pattern
```
SQL File → Parameter Substitution → Athena Execution → S3 Results → Local Download
```

### 6. Slack Command Pattern
```
Slack Command → Signature Verification → Database Operation → Response
```

### 7. AI Agent Slack Integration Pattern
```
Slack Slash Command → Agent Execution → Human Approval → Content Deployment
```

### 8. Human-in-the-Loop Workflow Pattern
```
AI Agent Processing → Slack Notification → Human Review → Approve/Reject/Modify → Content Update
```

### 9. Domain-Channel Mapping Pattern
```
Database Mappings → Dynamic Loading → Reports Distribution → Slack Channels
```

### 8. Product View Tracking Pattern
```javascript
// Single observer for all product cards
const tracker = createProductCardViewTracker({
  threshold: 0.1,
  rootMargin: '50px 0px',
  disconnectAfterView: true,
  widgetLogParams: { widget: "smartscroll" }
});

// Add cards as they're rendered
tracker.observe(cardElement);

// Logs: mula_product_view event with product_id
```

### 9. Site Targeting Pattern
```
Slack Command → Database Record → Search Creation → Approval Workflow → Manifest Update → SDK Fallback
```

### 10. Site Targeting Database Schema
```sql
CREATE TABLE site_targeting (
  id SERIAL PRIMARY KEY,
  topLevelDomain VARCHAR(255) NOT NULL,
  targetingType ENUM('path_substring', 'url_pattern', 'ld_json') NOT NULL,
  targetingValue TEXT NOT NULL,
  searchPhrase TEXT NOT NULL,
  channelId VARCHAR(255),
  channelName VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL
);
```

### 11. Site Targeting Manifest Pattern
```json
{
  "example.com": {
    "/products": "search_results_abc123.json",
    "_targeting": [
      {
        "type": "path_substring",
        "value": "/fashion",
        "searchPhrase": "fashion trends"
      },
      {
        "type": "url_pattern",
        "value": ".*\\/sale.*",
        "searchPhrase": "sale items"
      }
    ]
  }
}
```

### 12. Site Targeting SDK Fallback Pattern
```javascript
// In BootLoader.js
if (!isManifested && manifest && manifest._targeting) {
  for (const targeting of manifest._targeting) {
    let matches = false;
    switch (targeting.type) {
      case 'path_substring':
        matches = currentUrl.pathname.includes(targeting.value);
        break;
      case 'url_pattern':
        const regex = new RegExp(targeting.value);
        matches = regex.test(currentUrl.href);
        break;
      case 'ld_json':
        const pageContext = window.Mula.getPageContext();
        matches = pageContext.toLowerCase().includes(targeting.value.toLowerCase());
        break;
    }
    if (matches) {
      const searchID = await createSHA256Hash(targeting.searchPhrase.toLowerCase());
      feedUrl = new URL(`${CDN_ROOT}/searches/${searchID}/results.json`);
      break;
    }
  }
}
```

## Critical Implementation Paths

### 1. SDK Loading Sequence
1. **Initialization**: Check for existing Mula instance
2. **Environment Setup**: Configure CDN host and version
3. **Component Loading**: Dynamically load Svelte components
4. **Boot Process**: Initialize components and start tracking
5. **Manifest Check**: Load manifest.json for current domain
6. **Page Matching**: Check if current page URL is explicitly manifested
7. **Targeting Fallback**: If not manifested, evaluate targeting rules
8. **Feed Loading**: Load products from matched search or targeting rule

### 2. Product Feed Rendering
1. **Content Analysis**: Identify product opportunities
2. **Feed Generation**: Create optimized product feeds
3. **Component Injection**: Insert SmartScroll/TopShelf components
4. **Event Tracking**: Monitor user interactions

### 3. Event Processing Pipeline
1. **Collection**: Gather events via tracking pixel
2. **Ingestion**: Process through Kinesis Firehose
3. **Transformation**: Lambda function processes and formats data
4. **Storage**: Partitioned storage in S3
5. **Analysis**: Athena queries for insights

### 4. Site Targeting Workflow
1. **Slack Command**: User executes `/mula-site-targeting-add` with parameters
2. **Database Record**: Create `SiteTargeting` record with soft delete support
3. **Search Creation**: Automatically create `Search` record if phrase doesn't exist
4. **Job Queue**: Queue search job for immediate processing
5. **Search Orchestration**: Use full orchestration pipeline for quality assessment
6. **Human Approval**: Send Slack approval message with product samples
7. **Approval Process**: User approves/rejects via Slack or web UI
8. **Manifest Update**: Include approved targeting rules in next manifest build
9. **SDK Fallback**: SDK uses targeting rules for unmanifested pages

### 5. Reinforcement Learning Integration (Future)
1. **Data Extraction**: Athena queries for training data
2. **Model Training**: Vowpal Wabbit processes user behavior
3. **Feed Optimization**: Generate optimized product orderings
4. **Deployment**: Update feed configurations via CDN

### 6. Analytics Query Execution
1. **Query Loading**: Load SQL file with parameter placeholders
2. **Parameter Substitution**: Replace placeholders with actual values
3. **Athena Execution**: Submit query to Athena with proper output location
4. **Result Polling**: Wait for results to become available in S3
5. **Local Download**: Download results to local filesystem for analysis

### 7. Next Page Recommendations Workflow (UPDATED 2025-01-27)
1. **Slack Command**: Content manager executes `/mula-next-page-targeting-add` with domain, targeting type, value, section name, lookback days, and limit
2. **Database Record**: Worker creates `NextPageTargeting` record (similar to `SiteTargeting`)
3. **Athena Query**: System queries `mula_widget_view` events to find popular articles matching targeting criteria
4. **URL Extraction**: Extracts pathnames and constructs full URLs for crawling
5. **Metadata Crawling**: Uses `Crawler.crawlDOM()` to extract Open Graph metadata
6. **Section Manifest Generation**: Creates section-specific manifest with articles array
7. **S3 Upload**: Uploads section manifest to `{domain}/next-page/{section}/manifest.json`
8. **Main Manifest Update**: Manifest builder reads `NextPageTargeting` records and generates `_nextPageTargeting` array (follows `_targeting` pattern)
9. **Client Activation**: Publisher adds `?mulaNextPage=1` to enable feature
10. **Manifest Loading**: BootLoader checks `_nextPageTargeting` in main manifest (already loaded)
11. **Section Matching**: Matches current page against targeting rules
12. **Lazy Loading**: Loads section-specific manifest only if match found
13. **UI Integration**: SmartScroll injects recommendation cards after every 3rd product and after ads
14. **Analytics Tracking**: Tracks clicks with UTM parameters and `mula_next_page_click` events

## Component Relationships

### SDK Components
- **BootLoader**: Orchestrates SDK initialization and targeting fallback logic
- **SmartScroll**: Infinite scroll product feed
- **TopShelf**: Horizontal product carousel
- **Feed**: Configurable product grid
- **Card**: Individual product display
- **ProductModal**: Product detail overlay
- **Logger**: Event collection and transmission
- **ViewTracker**: Optimized product card view tracking with single observer pattern
- **FeedStore**: Product data management

### Backend Services
- **www.makemula.ai**: Publisher portal and backend services (Heroku)
- **Page Processing**: Content analysis and "mula-ization"
- **Product Management**: Affiliate product data
- **Analytics**: Publisher reporting and insights
- **Worker Processes**: Background data processing
- **Site Targeting**: Database-driven targeting rules with Slack management
- **Search Orchestration**: Platform-agnostic search management with quality assessment
- **Next Page System**: Article recommendations with Athena queries, URL crawling, and manifest generation
- **AI Agents**: Slack slash commands for agent execution and human-in-the-loop oversight

### Current Slack Command Implementations
**AI Agent Commands**:
- `/mulaize <URL>` - Triggers page analysis and product recommendation workflow
- `/mula-site-targeting-add` - Adds site targeting rules for unmanifested pages
- `/mula-site-targeting-list` - Lists current site targeting rules
- `/mula-site-targeting-rm` - Removes site targeting rules
- `/mula-next-page-build` - Generates next page article recommendations
- `/mula-site-taxonomy` - Analyzes site structure and content organization

**Analytics & Reporting Commands**:
- `/mula-performance-report` - Generates performance reports with time series charts
- `/mula-product-performance` - Shows most viewed and clicked products
- `/mula-impact-on3-subid-report` - Comprehensive subid performance reporting
- `/mula-click-urls` - Generates click URLs reports by domain
- `/mula-health-check` - Checks site health and Mula integration status

**Approval & Feedback Commands**:
- Product approval workflows via Slack buttons
- Search approval workflows for human-in-the-loop quality control
- Feedback collection and processing for iterative improvement

### Infrastructure Components
- **cdn.makemula.ai**: Static asset delivery including manifest.json, search results, and next-page manifests
- **beacon.makemula.ai**: Event collection endpoint
- **S3 Buckets**: Data storage and asset hosting
- **CloudFront**: Global CDN distribution
- **Lambda Functions**: Serverless data processing
- **Athena**: Data querying and analysis
- **Query Infrastructure**: Version-controlled SQL files with CLI tools and scheduling
- **Next Page Infrastructure**: Athena queries, URL crawling, and S3 manifest storage for article recommendations
- **Heroku Backend**: AI agent processing and Slack integration
- **Slack Integration**: Human-in-the-loop agent oversight and approval workflows

### Site Targeting Components
- **SiteTargeting Model**: Database model with soft delete support
- **SiteTargetingHelpers**: CRUD operations and targeting evaluation logic
- **SearchApprovalHelpers**: Search approval workflow for targeting searches
- **Manifest Builder**: Includes targeting rules in manifest.json generation
- **Slack Commands**: Management interface for targeting rules
- **Worker Integration**: Search job processing for targeting searches

### Next Page Components (UPDATED 2025-01-27)
- **NextPageTargeting Model**: Database model for targeting rules (similar to `SiteTargeting`)
- **NextPageTargetingHelpers**: CRUD operations and domain queries (similar to `SiteTargetingHelpers`)
- **NextPageBuildWorker**: Processes section manifest generation jobs (creates section manifests and DB records)
- **Athena Query**: `next-page-recommendations.sql` finds popular articles by engagement
- **Crawler Integration**: Uses `Crawler.crawlDOM()` for Open Graph metadata extraction
- **Slack Commands**: 
  - `/mula-next-page-targeting-add` - Add targeting rule and build section manifest
  - `/mula-next-page-targeting-list` - List targeting rules
  - `/mula-next-page-targeting-rm` - Remove targeting rule
  - `/mula-next-page-targeting-refresh` - Rebuild section manifest(s)
- **S3 Storage**: 
  - Section manifests: `{domain}/next-page/{section}/manifest.json` (articles only, created by worker)
  - Main manifest: `{domain}/manifest.json` (includes `_nextPageTargeting` array, generated by manifest builder)
- **Manifest Builder**: Reads `NextPageTargeting` records and generates `_nextPageTargeting` array (follows `_targeting` pattern)
- **SDK Integration**: BootLoader checks main manifest, lazy-loads section manifest on match
- **Analytics Tracking**: `mula_next_page_click` events with UTM parameters
- **Section Management**: Each section has independent manifest file
- **Priority Calculation**: Determines path priority based on specificity (depth)
- **Architecture Pattern**: Database is source of truth; worker updates DB, manifest builder generates manifest

## Performance Patterns

### 1. Lazy Loading
- Components load only when needed
- Dynamic script injection for core components
- Progressive enhancement approach

### 2. Event Batching
- Events collected locally and batched
- Efficient transmission to beacon endpoint
- Minimal network overhead

### 3. Optimized View Tracking
- Single IntersectionObserver for all product cards
- Prevents duplicate view events with Set-based tracking
- Configurable thresholds and root margins
- Automatic cleanup to prevent memory leaks

### 4. CDN Optimization
- Static assets served via CloudFront
- Versioned asset URLs for caching
- Global distribution for low latency

### 5. Data Partitioning
- S3 data partitioned by date/time
- Efficient Athena querying
- Cost-effective storage strategy

### 6. Site Targeting Performance
- Targeting rules cached in manifest.json
- Efficient regex and string matching in SDK
- Soft deletes prevent manifest bloat
- Only approved searches included in targeting

### 7. Next Page Manifest Schema
- **Multi-Target Structure**: Path-specific recommendation sets with metadata
- **Priority Management**: More specific paths (lower priority number) take precedence
- **Incremental Updates**: Can update one path without affecting others
- **Path Management**: Removes existing entries for same path before adding new ones
- **Metadata Tracking**: Timestamps and priority for each recommendation set

## Security Patterns

### 1. Publisher Isolation
- Publisher-specific configurations
- Isolated data and analytics
- Secure API access controls

### 2. Event Validation
- Input sanitization for tracking data
- Rate limiting on beacon endpoint
- Malicious request filtering

### 3. CDN Security
- HTTPS-only asset delivery
- Content security policies
- Origin validation

### 4. Site Targeting Security
- Slack signature verification for commands
- Input validation for targeting rules
- Soft deletes prevent data loss
- Approval workflow ensures quality control

## Scalability Patterns

### 1. Horizontal Scaling
- Stateless Lambda functions
- Auto-scaling CloudFront distribution
- Partitioned data storage

### 2. Caching Strategy
- CDN caching for static assets
- Browser caching for SDK components
- Application-level caching for frequently accessed data

### 3. Data Processing
- Stream processing for real-time events
- Batch processing for analytics
- Asynchronous worker processes

### 4. Site Targeting Scalability
- Database-driven targeting rules
- Efficient manifest generation
- Soft deletes for clean data management
- Approval workflow prevents quality degradation

### 5. Factorial A/B Testing Pattern
- **Domain-Specific Testing**: Experiments run only on specified domains (e.g., on3.com)
- **Multi-Factor Design**: Tests multiple factors simultaneously (layout optimization + supplemental monetization)
- **Variant Assignment**: Deterministic assignment based on session ID with query string overrides
- **Revenue Attribution**: Multi-partner revenue tracking with interaction effect measurement
- **Statistical Analysis**: Chi-square tests for CTR, ANOVA for continuous metrics
- **Documentation**: Comprehensive experiment documentation with implementation plans

### 6. Next Page Recommendations Pattern (UPDATED 2025-01-27)
- **Query Parameter Activation**: `?mulaNextPage=1` enables feature on client-side
- **Main Manifest Integration**: BootLoader checks `_nextPageTargeting` in main site manifest (already loaded)
- **Section-Specific Manifests**: Each section has its own manifest file at `{domain}/next-page/{section}/manifest.json`
- **Lazy Loading**: Section manifest only loaded when targeting rule matches current page
- **Targeting Rules**: Stored in main manifest `_nextPageTargeting` array (similar to `_targeting` for products)
- **Smart Injection**: Cards appear after every 3rd product and after any displayed ad
- **Analytics Tracking**: Fires `mula_next_page_click` events with UTM parameters
- **Athena Query**: Finds popular articles by `mula_widget_view` counts with category/path filtering
- **URL Crawling**: Uses `Crawler.crawlDOM()` for Open Graph metadata extraction
- **S3 Storage**: 
  - Section manifests: `{domain}/next-page/{section}/manifest.json` (articles only, ~2KB each)
  - Main manifest: `{domain}/manifest.json` (includes `_nextPageTargeting` array, ~100 bytes per section)
- **Database Model**: `NextPageTargeting` table stores targeting rules (similar to `SiteTargeting`)
- **Slack Management**: `/mula-next-page-targeting-*` commands for content managers
- **Error Handling**: Graceful degradation if manifest fails to load
- **Section Management**: Each section independently managed and updated
- **Priority System**: More specific paths (lower priority number) take precedence
- **Performance**: 90% payload reduction (only load matched section vs. all sections)

### 7. Account Model Pattern (NEW - PLANNING)
- **Publisher Groups**: Accounts represent publisher groups like McClatchy with multiple properties
- **Credential Management**: Account-level credentials with site-specific overrides
- **Default Credentials**: Mula's default affiliate credentials for publishers without relationships
- **Role-Based Access**: Mula admin users vs publisher users with granular permissions
- **Secure Storage**: Encrypted credentials in database with Heroku env var decryption
- **Credential Resolution**: Site-level override → Account-level → Mula defaults
- **Search Scoping**: phraseID includes credential ID for proper affiliate attribution
- **Slack Authorization**: Enhanced commands with role-based permission checking
- **UI Separation**: Mula admin interface vs scoped publisher dashboard
- **Domain Mapping**: Account domains with automatic credential resolution 