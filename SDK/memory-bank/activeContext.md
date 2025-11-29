# Active Context: Mula

## Current Work Focus

### RevContent Tiles Integration (NEW - IN PROGRESS)
**Objective**: Integrate RevContent sponsored content tiles into SmartScroll widget, displaying them every 5th card position with proper analytics tracking.

**Feature Details**:
- **Targeting**: Publisher-specific functions in `index.js` files
  - All brit.co pages
  - All twsn pages
  - on3.com LSU and NC State team pages only (`/teams/lsu-tigers`, `/teams/nc-state-wolfpack`)
- **Placement**: Every 5th card in SmartScroll feed
- **Design**: Match product cards with "Sponsored" badge in upper right of image
- **Analytics**: Separate tracking for RevContent vs products
  - View events: Include card type and ID/UID
  - Click events: `mula_rev_content_click` for RevContent cards
- **API**: RevContent Trends API integration

**Documentation**: See `memory-bank/features/revcontent-tiles-integration.md` for complete design

**Status**: Design documented, ready for implementation

### Immediate Issue Fixed
**Product Feedback Worker Bug**: Fixed critical bug in `productFeedbackWorker.js` where `searchId` parameter was missing from function signature, causing `ReferenceError: searchId is not defined` when processing Slack reject + feedback mechanism.

**Fix Details**:
- Added missing `searchId` parameter to `processProductFeedback` function signature
- Updated all logging statements to include `searchId` for better debugging
- Issue was in function destructuring: `{ pageId, url, feedback, userId, channelId, messageTs }` → `{ searchId, pageId, url, feedback, userId, channelId, messageTs }`
- Job data was correctly including `searchId` but function wasn't accepting it

### Primary Objective
Implementing SmartScroll Density & Position Experiment to test the impact of changing next page article density and position on Store CTR and Next Page CTR.

### SmartScroll Density & Position Experiment (✅ CONCLUDED)
**Objective**: Test the impact of changing next page article density (3-1 products vs 3-1 articles) and position (4th vs 1st) in the SmartScroll widget on user engagement metrics.

**Experiment Results** (30-day analysis, October 11 - November 9, 2025):
- **Winner**: Position Early (3-1 products, position 1)
- **Next Page CTR**: +77.93% lift (statistically significant p < 0.05)
- **Store CTR**: -30.91% impact (not statistically significant)
- **Overall Engagement**: +50% improvement
- **Decision**: Position Early implemented as default behavior when nextPage is enabled

**Implementation Status**:
- **Phase**: ✅ CONCLUDED - Winner implemented
- **Documentation**: Complete experiment documentation and results in `memory-bank/experiments/smartscroll-density-position-2025-10/`
- **A/B Test Configuration**: ✅ Experiment marked as concluded in ABTest.js
- **SmartScroll Integration**: ✅ Position Early pattern now default when nextPage is enabled
- **Code Changes**: ✅ Removed experiment logic, simplified to use position_early pattern
- **Results**: See `memory-bank/experiments/smartscroll-density-position-2025-10/experiment-results.md`

### Secondary Objective
Implementing Account model system for multi-publisher credential management to support publisher groups like McClatchy who own multiple properties and need centralized affiliate credential management.

### Account Model Implementation (NEW - PLANNING PHASE)
**Objective**: Create comprehensive Account model system to support publisher groups with centralized credential management, enabling publishers to use their own affiliate credentials or Mula's default credentials.

**Business Drivers**:
- Publisher groups like McClatchy (US Weekly, Woman's World, SoapOperaDigest, Bargain Hunter) need centralized credential management
- Publishers without affiliate relationships need Mula's default credentials for immediate onboarding
- Site-level credential overrides needed for specific publisher requirements
- Role-based access control for Mula admins vs publisher users

### Quick Patch: Amazon Credential Selection (NEW - IMMEDIATE NEED)
**Objective**: Implement minimal changes to support different Amazon credentials when creating searches, providing immediate solution while larger account model is being developed and tested.

**Problem**: Large account & credential overhaul changes are risky and need extensive testing. Need quick patch to support different Amazon credentials for search creation without disrupting existing functionality.

**Proposed Solution**: Environment-variable based credential resolution with minimal database and UI changes.

**Key Design Decisions**:
- Add `credentialId` field to Search model (defaults to 'default')
- Update search creation UI to include credential selection dropdown
- Modify SearchOrchestrator to pass credential ID to strategies
- Add credential resolution method in AmazonSearchStrategy
- Use environment variables for credential mapping (e.g., `PUBLISHER1_AMAZON_ASSOC_*`)
- Maintain backward compatibility with existing searches

**Files Requiring Changes**:
1. `models/Search.js` - Add credentialId field
2. `views/searches/new.handlebars` - Add credential selection UI
3. `routes/searches.js` - Handle credential parameter
4. `helpers/SearchOrchestrator.js` - Pass credential ID to strategies
5. `helpers/strategies/AmazonSearchStrategy.js` - Add credential resolution
6. `routes/slack.js` - Update Slack commands (optional)

**Benefits**:
- Minimal risk with focused changes
- Backward compatible with existing searches
- Easy to test with different credential sets
- Foundation for full account system
- Quick implementation timeline

**Migration Strategy**:
- Database migration to add credentialId column
- Environment variables for new credentials
- Gradual rollout starting with web interface
- All existing searches use 'default' credentials

**Dynamic Configuration System** (COMPLETED):
- **Centralized Configuration**: Created `config/credentials.js` with centralized credential management
- **Dynamic UI**: Web interface now dynamically loads available credentials from configuration
- **Dynamic Slack Commands**: Slack commands show available credentials in help text and error messages
- **Easy Management**: Adding new credentials only requires updating the configuration file
- **Type Safety**: Credential validation and resolution with proper error handling
- **Maintainable**: Single source of truth for all credential-related functionality

## AI Agent Architecture Status

### Current Implementation
The AI agent architecture described in the investment memo is **partially implemented** through Slack slash commands and Heroku backend services:

**✅ Implemented Agents**:
- **Sally Agent (Generative AI)**: OpenAI GPT-4 integration for Q&A content generation
- **Taka Agent (Content Deployment)**: Slack commands for content management and widget control
- **Andy Agent (Analytics)**: Athena queries and performance reporting via Slack commands
- **Occy Agent (Monetization)**: Multi-platform affiliate integrations (Amazon, Fanatics, Google Shopping)

**🚧 Partially Implemented**:
- **Weston Agent (Content Analysis)**: Basic content analysis through page processing, but not fully automated
- **Human-in-the-Loop Workflows**: Slack approval workflows exist but not fully integrated with all agents

**❌ Not Yet Implemented**:
- **Specialized Agent Suite**: The named agents (Weston, Sally, Taka, Andy, Occy) are not explicitly implemented as separate services
- **Agent Orchestration**: No central agent coordination system
- **Principal Vibe Coding**: No AI coding agent (Cal) for development assistance
- **Real-time Agent Communication**: Agents don't communicate directly with each other

### Slack Commands to AI Agent Mapping

**Current Slack Commands (18 total)**:
1. `/mula-health-check` - Health check for sites
2. `/mula-domain-channels-add` - Domain-channel mapping management
3. `/mula-domain-channels-list` - List domain-channel mappings
4. `/mula-domain-channels-rm` - Remove domain-channel mappings
5. `/mula-performance-report` - Performance reports with charts
6. `/mulaize` - Create page and trigger product recommendations
7. `/mula-product-performance` - Product performance analytics
8. `/mula-remulaize` - Force new search for existing pages
9. `/mula-ab-test-performance` - A/B test performance analysis
10. `/mula-impact-on3-subid-report` - Subid performance reporting
11. `/mula-site-targeting-add` - Add site targeting rules
12. `/mula-site-targeting-list` - List site targeting rules
13. `/mula-site-targeting-rm` - Remove site targeting rules
14. `/mula-engagement-report` - Engagement analytics
15. `/mula-site-taxonomy` - Site structure analysis
16. `/mula-click-urls` - Click URLs reporting
17. `/mula-site-search` - Site search traffic analysis
18. `/mula-next-page-build` - Next page article recommendations

### AI Agent Implementation Coverage

#### **Weston Agent (Content Analysis)** - 🚧 PARTIALLY IMPLEMENTED
**Investment Memo Capabilities**:
- Ingests existing web page content and metadata
- Analyzes content for semantic relevance and contextual alignment
- Identifies optimal injection points for additional content
- Creates taxonomies used to create relevant product trends

**Current Implementation**:
- ✅ `/mula-site-taxonomy` - Analyzes site structure and content organization
- ✅ Content analysis support for `/mulaize` and `/mula-remulaize` workflows
- ❌ **Missing**: Automated content analysis without manual triggers
- ❌ **Missing**: Semantic relevance analysis
- ❌ **Missing**: Automatic taxonomy creation
- ❌ **Missing**: Automated site targeting proposals (working with Sally)

#### **Sally Agent (Generative AI)** - 🚧 PARTIALLY IMPLEMENTED
**Investment Memo Capabilities**:
- Uses LLMs to generate content, text, images, videos, interactive elements
- Creates recommended products, related content/articles, relevant Q&A
- Ensures content adheres to publisher's editorial standards and voice
- Human-in-the-loop feedback and overrides for content summaries

**Current Implementation**:
- ✅ OpenAI GPT-4 integration in `QAHelpers.js` for Q&A generation
- ✅ `/mula-next-page-build` - Generates article recommendations
- ✅ Content generation support for `/mulaize` and `/mula-remulaize` workflows
- ❌ **Missing**: Automated content generation without manual triggers
- ❌ **Missing**: Image and video generation capabilities
- ❌ **Missing**: Editorial voice matching
- ❌ **Missing**: Interactive element generation
- ❌ **Missing**: Automated targeted content proposals (working with Weston)

#### **Taka Agent (Content Deployment)** - ✅ WELL IMPLEMENTED
**Investment Memo Capabilities**:
- Injects genAI content into various UI widgets/elements dynamically
- Supports endless scroll interface by continuously generating content
- UI/Widgets can be implemented/controlled via Slack commands
- Optimized UI elements including style, animations, button titles/sizes

**Current Implementation**:
- ✅ `/mulaize` - Triggers content deployment workflow
- ✅ `/mula-remulaize` - Re-triggers content deployment
- ✅ `/mula-site-targeting-add` - Site targeting rule deployment
- ✅ `/mula-site-targeting-list` - Site targeting management
- ✅ `/mula-site-targeting-rm` - Site targeting removal
- ✅ SmartScroll and TopShelf widget deployment
- ✅ Human-in-the-loop approval for content placement

#### **Andy Agent (Analytics & Optimization)** - ✅ WELL IMPLEMENTED
**Investment Memo Capabilities**:
- A/B/n testing on appended content ordering/selection
- Optimizes engagement and monetization KPIs
- Reinforcement ML to auto-optimize product ordering
- Reporting module with instrumentation for core health vitals

**Current Implementation**:
- ✅ `/mula-performance-report` - Comprehensive performance analytics
- ✅ `/mula-product-performance` - Product engagement analytics
- ✅ `/mula-ab-test-performance` - A/B test analysis
- ✅ `/mula-engagement-report` - Engagement analytics
- ✅ `/mula-click-urls` - Click analytics
- ✅ `/mula-site-search` - Search traffic analysis
- ✅ Athena queries for data analysis
- ✅ Reinforcement learning for product ordering

#### **Occy Agent (Monetization)** - ✅ WELL IMPLEMENTED
**Investment Memo Capabilities**:
- Injects ads, both CPM and CPC, into Mula content UIs/widgets
- Integrates with affiliate or other product catalogs extensively
- Ad serving optimizations to increase revenue
- Manages feed order to balance explore vs. exploit

**Current Implementation**:
- ✅ Multi-platform affiliate integrations (Amazon, Fanatics, Google Shopping)
- ✅ `/mula-impact-on3-subid-report` - Revenue attribution tracking
- ✅ Product feed optimization and ordering
- ✅ Revenue tracking and attribution
- ✅ Ad serving integration capabilities

### Implementation Gap Analysis

**✅ Fully Implemented Agents**:
- **Taka Agent**: Content deployment and widget management
- **Andy Agent**: Analytics, reporting, and optimization
- **Occy Agent**: Monetization and affiliate integrations

**🚧 Partially Implemented Agents**:
- **Weston Agent**: Basic content analysis, missing automated semantic analysis
- **Sally Agent**: Basic Q&A generation, missing comprehensive content generation

**✅ Implemented Agent**:
- **Cal Agent**: AI coding agent implemented via Cursor with memory bank context for development assistance

### Future Vision: Weston + Sally Collaboration

**Targeted Content Proposals**:
- **Weston + Sally Working Together**: Automatically analyze site content and propose targeted content recommendations
- **Human-in-the-Loop**: Propose site targeting rules and content strategies for human review
- **Taka Deployment**: Humans can send approved proposals to Taka for rollout
- **Content Types**: Initially affiliate content & next page articles, expanding to image & video generation

**Implementation Roadmap**:
1. **Enhanced Weston**: Automated semantic analysis and taxonomy creation
2. **Enhanced Sally**: Editorial voice matching and comprehensive content generation
3. **Agent Collaboration**: Weston analyzes content → Sally generates targeted proposals → Human review → Taka deployment
4. **Expanded Content**: Image and video generation capabilities
5. **Automated Workflows**: Reduced manual intervention in content analysis and proposal generation

## Leadership Structure (Updated)

### C-Suite Leadership (Full-Time)
- **Jason White** - CEO: Chief Product & Technology Officer for The Arena Group, former CEO of Spiny.ai, Co-Founder of Jiffy.ai, former EVP & GM of Global Ad Tech for ViacomCBS, and formally serving on the board of the IAB Tech Lab. Industry co-innovation credits include: Ads.txt, RTB, Header Bidding & DCO.
- **Joshua Markham** - CPO: Expertise in product innovation and management

### Part-Time Team Members
- **Kale McNaney** - CTO (Part Time): Responsible for product architecture and AI development. Expertise in AI, data science and UX
- **Elliott Easterling** - Publisher Business Development (Part Time): Responsible for acquiring new customers and managing key partnerships
- **Logan Lorenz** - Head of Customer Success (Part Time): Relationship manager who supports publishers and ensures high adoption and retention
- **Will McGivern-Smith** - Head of BI/Product Manager (Part Time): Manages analytics and project management of key strategic product developments
- **Mark Williams** - Creative Director (Part Time): Oversees all creative output, including marketing and design, and UX
- **Event Marketing Associate** (Part Time): Liaison between CEO and 3rd party event companies planning sponsorships

### Advisory Board (C Phase)
**Publisher Business Development Advisors:**
- Mark Larkin (CBS, CNET)
- Jeffrey Hirsch (Fastclick, CJ, Audience Science, Pubmatic)
- Joe Prusz (Magnite)
- Scott Messer (Messer Media)
- Dennis Colon (Conde, CBS)
- Lynda Mann (Digital Trends)
- Matt Barash (247/7, Fox, Forbes)
- Jeremy Hlavickeck (Weather/IBM, Experian)
- Jana Meron (Business Insider, WaPo)

**Product Development Advisor:**
- Mike Dierken (Others Online, Rubion): Architected one of the first identity platforms that was acquired by Rubicon; leveraged to create sophisticated user architecture designs for bid floor management in RTB programmatic auctions

## New Feature: User Personalization System (Latest - COMPLETED)

### Feature Overview
Implemented comprehensive user personalization system that tracks user behavior and adapts product recommendations accordingly, providing a more engaging and personalized experience.

### Core Personalization Features

#### 1. Session Page View Tracking (`__mula_spv`)
- **Purpose**: Tracks total pages viewed in current session for analytics
- **Cookie**: `__mula_spv` (session cookie, domain: `.on3.com`)
- **Increment**: On every page load
- **Usage**: Analytics and session understanding

#### 2. In-View Count Tracking (`__mula_ivc`)
- **Purpose**: Tracks how many times user has seen Mula widget come into view
- **Cookie**: `__mula_ivc` (session cookie, domain: `.on3.com`)
- **Increment**: When widget reaches 10% visibility threshold
- **Usage**: Product shuffle logic - determines when to show variety vs. popularity

#### 3. Next Page Visited Tracking (`__mula_npv`)
- **Purpose**: Tracks which next page articles user has clicked to prevent repetition
- **Cookie**: `__mula_npv` (session cookie, domain: `.on3.com`)
- **Format**: Comma-separated list of compact hashes (base36 encoded pathnames)
- **Usage**: Filters out previously visited articles from recommendations

### Technical Implementation

#### Cookie Management System
- **Centralized Helper**: `Cookies.js` with `getCookie()`, `setCookie()`, `getTopLevelDomain()`
- **Consistent Domain**: All Mula cookies use `.on3.com` domain for cross-subdomain sharing
- **SameSite Policy**: `lax` for security and cross-site compatibility
- **Session Cookies**: No expiration for session-based tracking

#### Hash System
- **Centralized Helper**: `HashHelpers.js` with `simpleHash()` function
- **Algorithm**: Simple hash with base36 encoding for compact storage
- **Usage**: Pathname hashing for next page article tracking
- **Performance**: More compact than SHA256, deterministic results

#### Product Shuffle Logic
- **First 2 Widget Views**: 80% popularity-sorted, 20% random (optimal user experience)
- **3rd+ Widget Views**: Always shuffled (variety for returning users)
- **Logic**: `if (inViewCount > 1) shuffle() else popularitySort()`
- **Backward Compatibility**: Maintains existing `mulaNoHotItems=1` parameter behavior

#### Next Page Article Filtering
- **Click Tracking**: Integrated directly in SmartScroll component (no race conditions)
- **Hash Generation**: Uses `simpleHash()` for compact pathname hashes
- **Filtering**: Removes visited articles from recommendation manifest
- **Fallback**: Graceful degradation if tracking fails

### User Experience Flow

1. **First Visit**: User sees popularity-sorted products (best experience)
2. **Second Widget View**: User still sees popularity-sorted products (consistency)
3. **Third+ Widget Views**: User gets shuffled products (variety)
4. **Next Page Articles**: Only shows articles user hasn't clicked before
5. **Cross-Page Persistence**: All tracking persists across pages in same session

### Technical Architecture

#### File Structure
- **`Cookies.js`**: Centralized cookie management with domain logic
- **`HashHelpers.js`**: Centralized hash functions for compact storage
- **`BootLoader.js`**: Session tracking and product shuffle logic
- **`ViewTracker.js`**: In-view count increment on widget visibility
- **`SmartScroll.svelte`**: Next page click tracking and article filtering

#### Integration Points
- **ViewTracker**: Increments `__mula_ivc` when `mula_in_view` event fires
- **SmartScroll**: Tracks next page clicks and filters visited articles
- **BootLoader**: Uses `__mula_ivc` for shuffle decisions and loads filtered articles
- **Next Page System**: Integrates with existing manifest loading and filtering

### Business Value

#### User Engagement
- **Personalized Experience**: Content adapts to user behavior
- **Reduced Repetition**: Users don't see same articles repeatedly
- **Optimal First Impression**: Best products shown first, variety later
- **Cross-Page Continuity**: Behavior tracking persists across site navigation

#### Publisher Benefits
- **Increased Engagement**: More relevant content recommendations
- **Better User Retention**: Personalized experience keeps users engaged
- **Data Insights**: Rich behavioral data for optimization
- **Seamless Integration**: Works with existing Mula infrastructure

### Implementation Status
- **Phase**: COMPLETED ✅
- **Testing**: Ready for production deployment
- **Performance**: Minimal impact on Core Web Vitals
- **Compatibility**: Works with existing A/B testing and analytics systems

### Real-Time Grafana Dashboard Project (COMPLETED)
**Objective**: Create real-time Grafana dashboard showing page_view events overall and by properties['host'], plus count of search phrases receiving mula_widget_view events (resolved from search_id to search phrase), all broken down by host.

**Final Architecture**:
- **Data Flow**: Publisher Events → CloudFront → Kinesis Firehose → Lambda → S3 (existing) + CloudWatch Metrics (new)
- **Real-time Processing**: Lambda directly sends custom CloudWatch metrics for search phrases
- **Search Phrase Resolution**: Direct extraction from Lambda payload (search_phrase field)
- **Defensive Implementation**: Non-blocking CloudWatch output with timeout protection

**Key Metrics**:
- Search phrase widget views by host (real-time)
- Individual search phrase tiles with counts
- Dynamic discovery of new search phrases
- Real-time refresh (30-second intervals)

**Technical Implementation**:
- **Lambda Modification**: Added defensive CloudWatch metrics output for mula_widget_view events with search_phrase
- **CloudWatch Custom Metrics**: Namespace "Mula/SearchPhrases" with Host and SearchPhrase dimensions
- **VPC Endpoint**: Created CloudWatch VPC endpoint for Lambda connectivity
- **Grafana Dashboard**: Dynamic tile-based dashboard showing individual search phrases
- **Auto-Discovery**: Script to automatically add new search phrases to dashboard

**Final Architecture Benefits**:
- **Simplified**: Eliminated complex Kinesis Analytics pipeline
- **Cost Effective**: No additional Kinesis costs
- **Real-time**: Direct Lambda → CloudWatch → Grafana flow
- **Defensive**: Non-blocking with timeout protection
- **Dynamic**: Auto-discovery of new search phrases

**Implementation Status**:
- **Phase**: COMPLETED ✅
- **Dashboard URL**: https://g-e844782f82.grafana-workspace.us-east-1.amazonaws.com/d/aez8t5wxrwkqof/mula-search-phrases-working-tiles
- **Metrics Flowing**: Confirmed real-time data in CloudWatch
- **Cleanup**: Removed unused Kinesis resources (mula-realtime-events stream, mula-realtime-analytics application)

**Final Implementation Details**:
- **Lambda Code**: Modified `cloud.makemula.ai/beacon-kinesis-firehose-transformer/index.mjs` to send CloudWatch metrics
- **CloudWatch Namespace**: "Mula/SearchPhrases" with dimensions Host and SearchPhrase
- **VPC Endpoint**: `https://vpce-0819b7bda5f3e46f5-e3gq3wp9.monitoring.us-east-1.vpce.amazonaws.com`
- **Grafana Workspace**: [https://g-e844782f82.grafana-workspace.us-east-1.amazonaws.com/](https://g-e844782f82.grafana-workspace.us-east-1.amazonaws.com/)
- **Dashboard Type**: Tile-based with individual search phrase panels
- **Auto-Discovery Script**: `cloud.makemula.ai/update-grafana-dashboard.js` for adding new search phrases
- **Data Confirmation**: Real-time metrics showing values like 46, 43, 36 for "notre dame fighting irish football"
- **Resource Cleanup**: Successfully removed mula-realtime-events Kinesis stream and mula-realtime-analytics application
- **Current Status**: Grafana instance showing application loading error (may need restart or configuration fix)

### Site Search Traffic Analysis Slack Command (Secondary Priority)
**Objective**: Create `/mula-site-search <domain> <lookback_days>` Slack command that analyzes search phrase traffic patterns for specific domains.

**Command Design**:
- **Usage**: `/mula-site-search <domain> <lookback_days>`
- **Examples**: `/mula-site-search on3.com 7`, `/mula-site-search brit.co 14`
- **Output**: Search phrases ranked by traffic volume with top 3 URLs per phrase

**Technical Architecture**:
- **Data Flow**: Athena Query → PostgreSQL Lookup → Data Join → Slack Response
- **Athena Query**: Gets `search_id` + `mula_widget_view` traffic counts by domain
- **PostgreSQL Query**: Gets search phrases for those `search_id` values
- **URL Analysis**: Gets top 3 URLs per search phrase for traffic attribution
- **Slack Formatting**: Rich formatted response with emojis, metrics, and actionable insights

**Key Features**:
- **Search Phrase Ranking**: Shows which search phrases are getting the most traffic
- **URL Attribution**: Shows top 3 URLs driving traffic for each search phrase
- **Platform Information**: Displays which platform (Amazon, Fanatics, etc.) for each search
- **Summary Statistics**: Total searches, widget views, and performance insights
- **Async Processing**: Non-blocking Slack responses with progress indicators

**Business Value**:
- **Content Strategy**: Identify which search phrases are driving engagement
- **Traffic Analysis**: Understand user behavior patterns by domain
- **Optimization Opportunities**: Find high-performing content and search phrases
- **Demo-Ready**: Concrete metrics and insights for stakeholder presentations

**Implementation Status**:
- **Phase**: Design Complete
- **Next**: Implementation (Athena queries, PostgreSQL integration, Slack worker)
- **Target**: Working command within 1-2 days

### SmartScroll 2x2 Factorial A/B Test (CONCLUDED - Control Won)
**Objective**: Implement comprehensive 2x2 factorial experiment testing SmartScroll layout changes and RevContent monetization partner integration on on3.com.

**Experiment Design**:
- **Type**: 2x2 Factorial Design
- **Publisher**: Any publisher with RevContent configuration
- **Duration**: 1 week (35k daily impressions)
- **Traffic Split**: 25% per variant (~8,750 impressions per variant per day)

**Variants**:
1. **c00 (Control)**: Current card layout + Mula affiliate monetization only ✅ **WINNER**
2. **c10 (New Layout)**: Optimized card layout + Mula affiliate monetization only  
3. **c01 (RevContent)**: Current card layout + Mula affiliate + RevContent supplemental monetization
4. **c11 (New Layout + RevContent)**: Optimized card layout + Mula affiliate + RevContent supplemental monetization

**Key Metrics**:
- **CTR**: Click-through rate (mula_store_click / mula_in_view)
- **RPS**: Revenue per session (total revenue / sessions by variant)

**Documentation**: Complete experiment documentation in `memory-bank/experiments/smartscroll-factorial-2025-09/`

**Final Results**:
- **Phase**: CONCLUDED ✅
- **Winner**: Control (c00) - Current layout with Mula-only monetization performed best
- **End Date**: January 27, 2025
- **Action Taken**: Updated ABTest.js to conclude experiment and stop all variant assignment
- **Key Learning**: Current layout and Mula-only monetization strategy is optimal

### Impact API Data Collection Tools (Latest - COMPLETED)
**Objective**: Implement comprehensive data collection system for individual click and action records from Impact API to enable detailed A/B test analysis with subId2 session tracking.

**Key Achievement**: Successfully built production-ready tools for collecting individual click and action records with detailed attribution fields (subId1, subId2, subId3) from Impact API.

**Core Components**:
1. **ImpactDataCollector.js** - Main production class for Impact API data collection
   - **Click Records**: Uses ClickExport endpoint for individual click events
   - **Action Records**: Uses ReportExport endpoint with mp_action_listing_fast report
   - **Attribution Fields**: Extracts subId1, subId2, subId3 for detailed tracking
   - **Rich Data**: Includes device info, geographic data, campaign details, revenue data
   - **Async Processing**: Handles job polling and result downloading

2. **test-impact-data-collection.js** - Comprehensive test and documentation script
   - **Validation**: Tests both click and action collection
   - **Data Analysis**: Analyzes subId2/subId3 presence and attribution
   - **Usage Examples**: Demonstrates proper usage patterns
   - **Error Handling**: Comprehensive error handling and reporting

**Data Collection Capabilities**:
- **Individual Click Records**: 41+ click records with detailed attribution
- **Individual Action Records**: 37+ action records with revenue data
- **Session Tracking**: subId2 values present in 22 out of 41 clicks (53% coverage)
- **Attribution Fields**: Full support for subId1, subId2, subId3 tracking
- **Rich Metadata**: Device type, browser, OS, geographic location, campaign data

**A/B Test Analysis Integration**:
- **Session Attribution**: Use subId2 values to track which A/B test variants drive conversions
- **Revenue Attribution**: Link individual actions to specific test variants via subId2
- **Conversion Analysis**: Analyze click-to-conversion funnel by variant
- **Performance Metrics**: Calculate variant-specific CTR, RPS, and conversion rates

**Technical Implementation**:
- **API Endpoints**: ClickExport and ReportExport with proper authentication
- **Data Processing**: Handles different data formats (Clicks array vs Records array)
- **Job Management**: Async job creation, polling, and result downloading
- **Error Handling**: Comprehensive error handling with detailed logging
- **Production Ready**: Clean, well-documented code suitable for production use

**Business Value**:
- **A/B Test Analysis**: Enable detailed analysis of which variants drive most conversions
- **Revenue Attribution**: Track revenue back to specific test variants
- **Session Tracking**: Use subId2 to understand user journey through test variants
- **Performance Optimization**: Data-driven decisions for variant selection
- **Conversion Funnel**: Complete click-to-conversion analysis by variant

**Usage for A/B Testing**:
```javascript
const collector = new ImpactDataCollector();
const data = await collector.getClickAndActionData({
  startDate: '2025-09-14',
  endDate: '2025-09-21',
  subId1: 'mula'
});

// Analyze by subId2 (session ID) to see which variants convert
const variantAnalysis = analyzeByVariant(data.clicks, data.actions);
```

**Next Steps for A/B Test Analysis**:
1. **Integrate with A/B Test System**: Connect subId2 tracking to A/B test variants
2. **Revenue Attribution**: Link actions to specific variants for RPS calculation
3. **Conversion Analysis**: Build conversion funnel analysis by variant
4. **Performance Reports**: Create variant-specific performance dashboards

### AWS Account Migration Planning (Secondary Priority)
**Objective**: Migrate entire backend infrastructure from current AWS account to new account under makemula.ai business entity structure.

**Business Drivers**:
1. **SOC-2 Type II Compliance**: To secure new business development deals by establishing enterprise-grade security, compliance, and audit controls required by enterprise customers and partners.
2. **Acquisition Preparation**: To prepare the infrastructure for potential acquisition by ensuring clean separation of assets, proper documentation, and enterprise-ready architecture that meets due diligence requirements.

**Key Components to Migrate**:
- **Data Pipeline**: CloudFront (beacon.makemula.ai) → Kinesis Firehose → Lambda → S3 (analytics.makemula.ai) → Athena
- **CDN Infrastructure**: CloudFront (cdn.makemula.ai) → S3 (prod.makemula.ai) for SDK assets
- **Historical Data**: ~1TB of partitioned data in S3 (yyyy/mm/dd/hh structure)
- **Deployment Workflows**: GitHub Actions with AWS API keys and secrets
- **DNS Configuration**: beacon.makemula.ai and cdn.makemula.ai mappings

**Migration Document**: Complete migration plan documented in `memory-bank/aws-account-migration-plan.md`

**Critical Infrastructure Details**:
- **S3 Partitioning**: `yyyy/mm/dd/hh` format in analytics.makemula.ai bucket
- **Lambda Transformer**: `cloud.makemula.ai/beacon-kinesis-firehose-transformer/index.mjs`
- **Athena Table**: `mula.webtag_logs` with datehour partitioning
- **CloudFront Distributions**: E1RRG9TJNFNES4 (current distribution ID)
- **Current S3 Buckets**: analytics.makemula.ai, prod.makemula.ai

**Migration Phases**:
1. **Preparation**: New AWS account setup, IAM configuration
2. **Infrastructure**: S3, CloudFront, Kinesis, Lambda migration
3. **Application Updates**: Deployment workflows, configuration files
4. **Cutover**: DNS updates, end-to-end validation
5. **Cleanup**: Old resource decommissioning

**Risk Mitigation Strategy**: Parallel Infrastructure Approach
- **New Subdomains**: beacon-2.makemula.ai and cdn-2.makemula.ai
- **Zero Downtime**: Original infrastructure remains operational during migration
- **Independent Testing**: New infrastructure can be fully validated before cutover
- **Safe Rollback**: Can instantly revert to original infrastructure if issues arise
- **No Purgatory Risk**: Eliminates risk of being stuck between old and new systems
- **Gradual Migration**: Publisher-by-publisher migration option available

**Risk Factors (Mitigated)**:
- ~~1TB historical data migration~~ → Independent migration on parallel infrastructure
- ~~Zero-downtime requirement~~ → Original infrastructure remains operational
- ~~Complex DNS and CDN dependencies~~ → Parallel subdomains eliminate cutover risk
- ~~Multiple deployment workflow updates~~ → Can test on parallel infrastructure first

**Tech Debt Considerations**:
- **Dual Infrastructure Support**: Must maintain both old and new systems during transition
- **Dual Reporting Pipelines**: Separate analytics and monitoring for each infrastructure
- **Operational Complexity**: Two sets of deployments, monitoring, and maintenance
- **Cost Implications**: Running parallel infrastructure increases AWS costs (~2x)
- **Support Burden**: Team must support both systems simultaneously
- **Decision Point**: Must decide when tech debt interest exceeds migration benefits

### Immediate Tasks
1. **Account Model Implementation**: 🚧 PLANNING - Implementing comprehensive Account model system for multi-publisher credential management with role-based access control
2. **Credential Management System**: 🚧 PLANNING - Building encrypted credential storage with Heroku env var decryption and Mula default credentials support
3. **UI Authentication System**: 🚧 PLANNING - Creating login system with Mula admin and publisher user role separation
4. **Account Management Interface**: 🚧 PLANNING - Building Mula admin interface for account creation, credential management, and user assignment
5. **Publisher Dashboard**: 🚧 PLANNING - Creating scoped publisher account experience with role-based permissions
6. **Audience Acuity Tracking Pixel Integration**: 🚧 IN PROGRESS - Implementing Audience Acuity tracking pixel with dynamic cdata parameters (site host, sessionId, userId) for audience targeting analysis
7. **Site Search Traffic Analysis Slack Command**: 🚧 IN PROGRESS - Implementing `/mula-site-search <domain> <lookback_days>` command for search phrase traffic analysis with Athena + PostgreSQL data integration
8. **Site Targeting System**: ✅ COMPLETED - Implemented comprehensive site targeting system with Slack commands, database schema, SDK integration, and human-in-the-loop approval
9. **Top Products Performance Optimization System**: ✅ COMPLETED - Implemented sophisticated performance optimization system with popularity-based feed sorting
10. **Sales Enablement Placement Tool**: ✅ COMPLETED - Implemented visual widget placement tool for sales enablement
11. **SmartScroll A/B Test System**: ✅ COMPLETED - Implemented comprehensive A/B testing framework for SmartScroll widget
12. **Force New Search Feature**: Implemented system to force new searches for approved pages
13. **Product Performance Reports**: Created new Slack command `/mula-product-performance` that shows most viewed and clicked products
14. **New Slack Command /mulaize**: Created new Slack command that takes a URL and triggers product recommendation workflow
15. **Domain-Channel Mapping System**: Implemented database-driven domain-channel mappings with Slack commands
16. **Network-Wide Performance Reports**: ✅ COMPLETED - Enhanced `/mula-performance-report` command with network-wide aggregation support
17. **Subid Performance Report Slack Command**: ✅ COMPLETED - Created `/mula-impact-on3-subid-report` command for Impact API subid performance reporting
18. **Site Taxonomy Analysis Slack Command**: ✅ COMPLETED - New command `/mula-site-taxonomy <domain> <lookback_days>` to analyze site structure and content organization
19. **Heroku Deployment**: Deploying new Slack commands to production environment
20. **Database Migration**: Successfully migrated database with new search orchestration columns
21. **Slack Integration**: Fixed JSON parsing errors in Slack approval workflow
22. **UI Improvements**: Enhanced search display with platform and search index badges
23. **Status Polling**: Implemented real-time status updates for searching pages
24. **Data Quality**: Ensuring accurate search_id and product_src tracking
25. **Affiliate Catalog Selection UI**: ✅ COMPLETED - Added dropdown UI for selecting affiliate catalog (Amazon, Fanatics, Google Shopping) in search creation form

## New Feature: Account Model System (NEW - PLANNING PHASE)

### Feature Overview
Implementing comprehensive Account model system to support multi-publisher credential management, enabling publisher groups like McClatchy to centrally manage affiliate credentials across multiple properties while supporting publishers without affiliate relationships through Mula's default credentials.

### Business Requirements
- **Publisher Groups**: Support publisher groups like McClatchy (US Weekly, Woman's World, SoapOperaDigest, Bargain Hunter) with centralized credential management
- **Default Credentials**: Provide Mula's default affiliate credentials for publishers without existing relationships
- **Site-Level Overrides**: Allow account-level credentials with site-specific overrides for specialized requirements
- **Role-Based Access**: Separate Mula admin users from publisher users with appropriate permissions
- **Secure Storage**: Encrypt credentials in database with Heroku environment variable for decryption

### Technical Architecture

#### Database Schema
```sql
-- Accounts (publisher groups)
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status ENUM('active', 'suspended', 'pending') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account credentials with site-level overrides
CREATE TABLE account_credentials (
  id SERIAL PRIMARY KEY,
  accountId INTEGER REFERENCES accounts(id),
  domain VARCHAR(255) NULL, -- NULL = account-level, specific domain = site-level override
  platform ENUM('amazon', 'impact', 'google_shopping') NOT NULL,
  credentialName VARCHAR(100) NOT NULL,
  encryptedValue TEXT NOT NULL,
  credentialSource ENUM('mula_default', 'publisher_provided') DEFAULT 'publisher_provided',
  isDefault BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  expiresAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mula admin users (can create accounts, manage all)
CREATE TABLE mula_admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('super_admin', 'admin') NOT NULL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Publisher users (account-scoped)
CREATE TABLE account_users (
  id SERIAL PRIMARY KEY,
  accountId INTEGER REFERENCES accounts(id),
  email VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'editor', 'viewer') NOT NULL,
  isActive BOOLEAN DEFAULT true,
  invitedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastActiveAt TIMESTAMP NULL,
  UNIQUE(accountId, email)
);

-- Domain mappings
CREATE TABLE account_domains (
  id SERIAL PRIMARY KEY,
  accountId INTEGER REFERENCES accounts(id),
  domain VARCHAR(255) NOT NULL,
  isActive BOOLEAN DEFAULT true,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mula's default credentials
CREATE TABLE mula_default_credentials (
  id SERIAL PRIMARY KEY,
  platform ENUM('amazon', 'impact', 'google_shopping') NOT NULL,
  credentialName VARCHAR(100) NOT NULL,
  encryptedValue TEXT NOT NULL,
  isActive BOOLEAN DEFAULT true,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Credential Security Implementation
```javascript
// Encrypt credentials using Heroku environment variable
const encryptCredential = (credential) => {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(credential, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  });
};

// Decrypt credentials at runtime
const decryptCredential = (encryptedData) => {
  const { encrypted, iv, authTag } = JSON.parse(encryptedData);
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

#### Enhanced Search Orchestration
```javascript
class SearchOrchestrator {
  async processSearch(searchPhrase, platform, platformConfig, domain) {
    // 1. Get account from domain
    const account = await this.getAccountByDomain(domain);
    
    // 2. Resolve credentials (account-level or site-level override)
    const credentials = await this.resolveCredentials(account.id, domain, platform);
    
    // 3. Create credential-scoped phraseID
    const phraseID = await this.createCredentialScopedPhraseID(
      searchPhrase, platform, platformConfig, credentials.id
    );
    
    // 4. Use resolved credentials for API calls
    const results = await this.searchWithCredentials(platform, credentials, searchPhrase);
    
    return results;
  }
  
  async resolveCredentials(accountId, domain, platform) {
    // First check for site-level override
    let credential = await AccountCredential.findOne({
      where: { accountId, domain, platform, isActive: true }
    });
    
    // Fall back to account-level credential
    if (!credential) {
      credential = await AccountCredential.findOne({
        where: { accountId, domain: null, platform, isActive: true }
      });
    }
    
    if (!credential) {
      throw new Error(`No credentials found for account ${accountId}, platform ${platform}`);
    }
    
    return credential;
  }
}
```

### UI Implementation Plan

#### Authentication System
- **Login System**: Email-based authentication with role detection
- **Role-Based Routing**: Mula admins → `/admin/dashboard`, Publisher users → `/account/{id}/dashboard`
- **Session Management**: Secure session handling with role persistence

#### Mula Admin Experience
- **Account Management**: Create, edit, suspend accounts
- **Credential Management**: Assign Mula defaults or publisher credentials
- **User Management**: Invite users, assign roles, manage permissions
- **Domain Management**: Associate domains with accounts

#### Publisher Account Experience
- **Scoped Dashboard**: Account-specific data and controls
- **Credential Viewing**: View assigned credentials (encrypted display)
- **User Management**: Invite team members, manage roles (owner/admin only)
- **Domain Management**: View associated domains

### Slack Command Integration
```javascript
// Enhanced Slack commands with authorization
app.post('/commands/mulaize', async (req, res) => {
  const { text, user_id, user_email } = req.body;
  const url = text.trim();
  const domain = extractDomain(url);
  
  try {
    // 1. Get account from domain
    const account = await AccountHelpers.getAccountByDomain(domain);
    
    // 2. Check if user is Mula admin
    const isMulaAdmin = await MulaAdminUser.findOne({
      where: { email: user_email, isActive: true }
    });
    
    if (isMulaAdmin) {
      // Mula admin can mulaize any domain
      await processMulaizeWithAccount(url, account.id);
      return res.json({ text: `✅ Mulaizing ${url} for account: ${account.name}` });
    }
    
    // 3. Check publisher user permissions
    const accountUser = await AccountUser.findOne({
      where: { 
        accountId: account.id, 
        email: user_email, 
        isActive: true 
      }
    });
    
    if (!accountUser) {
      return res.json({ 
        text: `❌ You don't have access to account: ${account.name}. Contact your account admin.` 
      });
    }
    
    if (!['owner', 'admin', 'editor'].includes(accountUser.role)) {
      return res.json({ 
        text: `❌ You need editor permissions or higher to mulaize pages. Your role: ${accountUser.role}` 
      });
    }
    
    // 4. Process with account context
    await processMulaizeWithAccount(url, account.id);
    return res.json({ 
      text: `✅ Mulaizing ${url} for account: ${account.name}` 
    });
    
  } catch (error) {
    return res.json({ 
      text: `❌ Error: ${error.message}` 
    });
  }
});
```

### Implementation Timeline

#### Week 1: Foundation
- Database migrations for Account model
- Credential encryption/decryption system
- Basic authentication middleware
- Mula default credentials population script

#### Week 2: Admin Interface
- Mula admin dashboard
- Account creation and management
- Credential management interface
- User invitation system

#### Week 3: Publisher Interface
- Publisher dashboard
- Role-based access control
- Account-scoped search interface
- Credential assignment UI

#### Week 4: Integration & Testing
- Update existing Slack commands with authorization
- Test credential resolution across all platforms
- End-to-end testing
- Deployment and migration

### Business Value
- **Scalable Onboarding**: Publishers can start immediately with Mula's credentials
- **Flexible Credential Management**: Account-level defaults with site-specific overrides
- **Role-Based Security**: Clear separation between Mula admins and publisher users
- **Centralized Management**: Publisher groups can manage multiple properties from one account
- **Secure Storage**: Encrypted credentials with runtime decryption

### Technical Benefits
- **Credential Scoping**: phraseID includes credential ID for proper affiliate attribution
- **Site-Level Overrides**: McClatchy can use different credentials for specific sites
- **Default Credentials**: New publishers get immediate access without setup
- **Role-Based Access**: Granular permissions for different user types
- **Secure Implementation**: Heroku-compatible credential encryption

## New Feature: Next Page Recommendations System (Previous - COMPLETED)

### Feature Overview
Implemented comprehensive "Next Page" recommendations system that displays related article recommendations within the SmartScroll widget, providing publishers with additional engagement opportunities and content discovery.

**ARCHITECTURE UPDATE (2025-01-27)**: Redesigned to use section-specific manifests for better scalability and performance. Each section now has its own manifest file, with targeting rules stored in the main site manifest.

### Technical Implementation
1. **Client-Side Activation**: `?mulaNextPage=1` query parameter activates the feature
2. **Manifest Loading**: BootLoader checks `_nextPageTargeting` in main site manifest (already loaded)
3. **Section Matching**: Matches current page against targeting rules to find relevant section
4. **Lazy Loading**: Only loads section-specific manifest when match is found
5. **UI Integration**: SmartScroll injects next-page cards after every 3rd product and after ads
6. **Analytics Tracking**: Fires `mula_next_page_click` events with UTM parameters

### Backend Infrastructure
1. **Slack Commands**: 
   - `/mula-next-page-targeting-add <domain> <targeting_type> <targeting_value> <section_name> <lookback_days> [limit]` - Add targeting rule
   - `/mula-next-page-targeting-list [domain]` - List targeting rules
   - `/mula-next-page-targeting-rm <targeting_id>` - Remove targeting rule
   - `/mula-next-page-targeting-refresh <domain> [section_name]` - Rebuild section manifest(s)
2. **Database Model**: `NextPageTargeting` table (similar to `SiteTargeting`)
3. **Athena Query**: `next-page-recommendations.sql` finds popular articles by `mula_widget_view` counts
4. **URL Crawling**: Uses refactored `Crawler.crawlDOM()` for Open Graph metadata extraction
5. **Manifest Generation**: 
   - Section manifests: `{domain}/next-page/{section}/manifest.json` (articles only, created by worker)
   - Main manifest: Includes `_nextPageTargeting` array (targeting rules only, generated by manifest builder)
6. **Worker Processing**: `nextPageBuildWorker.js` creates section manifests and database records
7. **Manifest Builder**: Reads `NextPageTargeting` records and generates `_nextPageTargeting` array (follows `_targeting` pattern)

### Key Features
- **Section-Specific Manifests**: Each section has its own manifest file (e.g., `michigan-wolverines/manifest.json`)
- **Targeting Rules in Main Manifest**: `_nextPageTargeting` array in main site manifest (similar to `_targeting`)
- **Lazy Loading**: Only loads section manifest when page matches targeting rule
- **Smaller Payloads**: Main manifest only contains targeting rules (~100 bytes per section)
- **Better Scalability**: Can support many sections without bloating main manifest
- **Path-Specific Targeting**: Each section targets specific URL paths or JSON-LD categories
- **Priority Management**: More specific paths take precedence over general ones
- **Smart Injection**: Next-page items appear after every 3rd product card and after any displayed ad
- **Responsive Design**: Cards follow same responsive behavior as existing SmartScroll items
- **Analytics Integration**: Tracks clicks with `utm_source=mula&utm_campaign=next_page&utm_medium=smartscroll`
- **Error Handling**: Graceful degradation if manifest fails to load
- **Performance Optimized**: Integrates with existing progressive loading mechanism

### Business Value
- **Increased Engagement**: Additional content discovery opportunities for users
- **Publisher Revenue**: Potential for additional affiliate revenue through article recommendations
- **Content Strategy**: Data-driven article recommendations based on actual user engagement
- **Easy Management**: Simple Slack commands for content managers to update recommendations
- **Scalability**: Supports many sections (10+ on www.on3.com) without performance degradation

### Technical Architecture
- **SDK Integration**: `BootLoader.js` checks `_nextPageTargeting` in main manifest, loads section manifest on match
- **Backend Processing**: 
  - Worker: Athena query → URL crawling → Section manifest upload → Database record creation
  - Manifest Builder: Reads `NextPageTargeting` records → Generates `_nextPageTargeting` array in main manifest
- **Database**: `NextPageTargeting` model stores targeting rules (similar to `SiteTargeting`)
- **Queue System**: Bull queue with `nextPageBuildWorker` for async processing
- **CDN Delivery**: Section manifests served from `{domain}/next-page/{section}/manifest.json`
- **Architecture Pattern**: Follows same pattern as product targeting (`_targeting`) - database is source of truth, manifest builder generates manifest

### Manifest Schema

**Main Site Manifest** (`{domain}/manifest.json`):
```json
{
  "www.on3.com": {
    "/teams/michigan-wolverines/": "search_results_abc123.json",
    "_targeting": [
      {
        "type": "path_substring",
        "value": "/fashion/",
        "searchPhrase": "fashion trends",
        "phraseID": "phrase_xyz789"
      }
    ],
    "_nextPageTargeting": [
      {
        "type": "path_substring",
        "value": "/teams/michigan-wolverines/",
        "section": "michigan-wolverines",
        "manifest": "next-page/michigan-wolverines/manifest.json",
        "priority": 2
      },
      {
        "type": "ld_json",
        "value": "Style Inspo",
        "section": "style-inspo",
        "manifest": "next-page/style-inspo/manifest.json",
        "priority": 0
      }
    ]
  }
}
```

**Section Manifest** (`{domain}/next-page/{section}/manifest.json`):
```json
{
  "section": "michigan-wolverines",
  "articles": [
    {
      "imageUrl": "https://www.on3.com/wp-content/uploads/2025/01/michigan-game.jpg",
      "title": "Michigan Wolverines Dominate in Season Opener",
      "url": "https://www.on3.com/teams/michigan-wolverines/game-recap-2025"
    }
  ],
  "updatedAt": "2025-01-27T14:30:00.000Z",
  "lookbackDays": 7,
  "limit": 20
}
```

**Schema Features**:
- **Section-Specific Storage**: Articles stored in separate section manifests
- **Targeting Rules**: Stored in main manifest `_nextPageTargeting` array
- **Lazy Loading**: Section manifest only loaded when targeting rule matches
- **Priority System**: More specific paths (lower priority number) take precedence
- **Incremental Updates**: Can update one section without affecting others
- **Metadata Tracking**: Timestamps and priority for each targeting rule

### SDK Loading Flow
1. BootLoader loads main site manifest (already happening for products)
2. Checks `_nextPageTargeting` array if `?mulaNextPage=1` is present
3. Matches current page pathname/pageContext against targeting rules
4. If match found, loads section-specific manifest from `{domain}/next-page/{section}/manifest.json`
5. Filters articles (removes current page, visited articles)
6. Passes articles to SmartScroll for rendering

### Implementation Status
- **Phase**: DESIGN COMPLETE - Ready for Implementation
- **Design Date**: 2025-01-27
- **Problem Solved**: Large manifest payloads (4KB with 4 sections, scaling to 20KB+ with 10 sections)
- **Solution**: Section-specific manifests with targeting rules in main manifest
- **Benefits**: 90% payload reduction (only load matched section), better scalability, easier management

## New Feature: Audience Acuity Tracking Pixel Integration (Previous - IN PROGRESS)

### Feature Overview
Implementing Audience Acuity tracking pixel integration to measure how Audience Acuity can help target Mula to various audience buckets across publisher sites. The pixel will be loaded on every page view to the SDK with dynamic parameters for audience analysis.

### Technical Implementation
1. **Pixel URL**: `https://i.liadm.com/s/80847?cid=68cb2ae8f76e670018c9f61a&cdata1=&cdata4=&cdata2=&cdata3=`
2. **Parameter Population**:
   - **cdata1**: Site's host (`window.location.hostname`)
   - **cdata2**: SessionId (`window.Mula.sessionId`)
   - **cdata3**: UserId (`window.Mula.userId` with fallback to sessionId)
   - **cdata4**: Empty string (as provided)

### Integration Details
- **Location**: Added to `BootLoader.js` as the last step in the `load()` method
- **Function**: `loadAudienceAcuityPixel()` function handles pixel loading with error handling
- **Error Handling**: Catches exceptions and logs "mula_aapx_fail" event if pixel fails to load
- **Logging**: Logs successful pixel loading with full URL for debugging

### Implementation Decisions
1. **User ID Source**: Uses `window.Mula.userId` as primary source, falls back to `sessionId` if not available
2. **Loading Timing**: Pixel loads as the last step in the `load()` method to ensure all SDK initialization is complete
3. **Error Handling**: Graceful error handling with specific logging for debugging and monitoring
4. **Testing Strategy**: Canary release approach for testing across different publisher sites

### Code Implementation
```javascript
export const loadAudienceAcuityPixel = () => {
  try {
    const host = window.location.hostname;
    const sessionId = window.Mula.sessionId || 'unknown';
    const userId = window.Mula.userId || sessionId; // Fallback to sessionId if userId not available
    
    const pixelUrl = `https://i.liadm.com/s/80847?cid=68cb2ae8f76e670018c9f61a&cdata1=${encodeURIComponent(host)}&cdata2=${encodeURIComponent(sessionId)}&cdata3=${encodeURIComponent(userId)}&cdata4=`;
    
    // Create and load pixel
    const img = new Image();
    img.src = pixelUrl;
    
    log(`Audience Acuity pixel loaded: ${pixelUrl}`);
  } catch (error) {
    log(`Audience Acuity pixel failed to load: ${error.message}`);
    logEvent("mula_aapx_fail", "1");
  }
};
```

### Business Value
- **Audience Analysis**: Enables measurement of how Audience Acuity can help target Mula to different audience segments
- **Publisher Insights**: Provides data on audience composition across different publisher sites
- **Targeting Optimization**: Supports future audience-based targeting and personalization features
- **Performance Monitoring**: Tracks pixel loading success/failure for reliability monitoring

### Next Steps
1. **Canary Release**: Deploy to limited publisher sites for testing
2. **Parameter Validation**: Verify all cdata parameters are properly populated across different sites
3. **Performance Testing**: Ensure minimal impact on Core Web Vitals
4. **Monitoring**: Track pixel loading success rates and error patterns
5. **Full Deployment**: Roll out to all publisher sites after successful canary testing

## New Feature: Affiliate Catalog Selection UI (Previous - COMPLETED)

### Feature Overview
Enhanced the search creation form at `/searches/new` to include a dropdown for selecting which affiliate catalog to use for product searches, allowing users to choose between Amazon Associates, Fanatics (Impact API), and Google Shopping (SERP API).

### Problem Solved
Previously, the search creation form only allowed users to enter a search phrase, with the system defaulting to Amazon Associates for all searches. Users had no way to specify which affiliate catalog to use, limiting their ability to search different product catalogs.

### Technical Implementation
1. **UI Enhancement**: Added platform selection dropdown to `views/searches/new.handlebars`
   - Three options: Amazon Associates, Fanatics (Impact API), Google Shopping (SERP API)
   - Defaults to Amazon Associates
   - Includes descriptive text for each option
   - Maintains form state on validation errors

2. **Backend Logic**: Updated `routes/searches.js` POST handler
   - Extracts platform from form data with Amazon as fallback
   - Configures platform-specific settings:
     - Amazon: `{ searchIndex: 'All' }`
     - Fanatics: `{}` (no searchIndex needed)
     - Google Shopping: `{}` (no searchIndex needed)
   - Generates phraseID using platform-specific configuration
   - Passes platform value back to form on validation errors

3. **Platform Configuration**:
   - **Amazon**: Uses existing Amazon Associates API with search index selection
   - **Fanatics**: Uses Impact API integration for sports merchandise
   - **Google Shopping**: Uses SERP API for general product search

### User Experience
- **Clear Options**: Dropdown clearly labels each affiliate catalog with API information
- **Default Selection**: Amazon Associates selected by default for backward compatibility
- **Error Handling**: Form maintains selected platform if validation fails
- **Consistent UI**: Follows existing Bootstrap form styling patterns

### Benefits
- **Multi-Catalog Support**: Users can now search across different affiliate networks
- **Platform Flexibility**: Easy switching between Amazon, Fanatics, and Google Shopping
- **Revenue Optimization**: Ability to choose the most appropriate catalog for specific content
- **Backward Compatibility**: Existing functionality preserved with sensible defaults

### Technical Details
- **Form Field**: `name="platform"` with validation
- **Platform Values**: `amazon`, `fanatics`, `google_shopping`
- **Configuration Logic**: Platform-specific `platformConfig` object generation
- **PhraseID Generation**: Includes platform in hash calculation for uniqueness
- **Error Recovery**: Platform value preserved in form re-rendering

### Usage
1. Navigate to `/searches/new`
2. Enter search phrase
3. Select desired affiliate catalog from dropdown
4. Click "Create Search"
5. System processes search using selected platform

## New Feature: Site Taxonomy Analysis Slack Command

### Feature Overview
New Slack command `/mula-site-taxonomy <domain> <lookback_days>` to analyze site structure and content organization, providing merchandisers with insights into high-reach sections and taxonomical areas for product targeting.

### Core Functionality
- **URL Path Taxonomy**: Analyze up to 3 levels of URL path structure (e.g., `/fashion/trends/2024/`)
- **JSON-LD Article Sections**: Leverage existing `article_section` data from Bootloader parsing
- **Page View Metrics**: Count page views per taxonomy category
- **Merchandiser Insights**: Identify high-value targeting opportunities

### Technical Implementation
1. **New Athena Query**: `site-taxonomy-analysis.sql` to extract and analyze taxonomy data
2. **Slack Command Handler**: Add route in `routes/slack.js` for `/commands/mula-site-taxonomy`
3. **Taxonomy Worker**: New worker `workers/taxonomyAnalysisWorker.js` to process analysis
4. **Data Sources**: 
   - URL paths from `properties['pathname']` in `webtag_logs`
   - Article sections from `properties['article_section']` (already parsed by Bootloader)

### Taxonomy Analysis Rules
- **URL Paths**: Extract up to 3 meaningful segments after domain, before page name
- **Path Filtering**: Ignore empty/trivial paths (home page, direct leaf pages)
- **Article Sections**: Use existing JSON-LD parsing from Bootloader
- **Metrics**: Page views only (no historical analysis needed initially)

### Output Format
```
🏛️ *Site Taxonomy Analysis for [domain] ([days] days)*

📁 *URL Path Structure:*
• /category/subcategory/ (X.XK views)
  └── /category/subcategory/segment/ (X.XK views)

🏷️ *Content Categories (JSON-LD):*
• Category Name (X.XK views)

🎯 *Top Product Targeting Opportunities:*
• High-reach paths with merchandising potential
```

### Future Extensions (Documented for Later Implementation)
1. **Product List Generation**: Auto-generate targeted product collections
2. **Competitor Analysis**: Compare taxonomy across similar domains
3. **Seasonal Tracking**: Monitor taxonomy usage changes over time
4. **Performance Correlation**: Link taxonomy to conversion metrics
5. **Export & Integration**: API endpoints and external tool integration

### Next Steps
1. **Refine Taxonomy Query**: ✅ COMPLETED - Athena SQL query developed and tested
2. **Implement Core Feature**: ✅ COMPLETED - Worker and Slack command integration built
3. **Future Enhancements**: Ready for Phase 2 - Product list generation and competitor analysis

## Future Work: Placement Targeting System (PLANNED)

### Problem Statement
Current `window.Mula.slots` implementations use hard-coded CSS selectors for each site, making them:
- **Labor intensive**: Each site requires manual DOM analysis and coding
- **Inflexible**: Layout changes break placement logic
- **Difficult to maintain**: Updates require code changes and deployments
- **Limited scalability**: Adding new sites requires developer intervention

### Proposed Solution: Database-Driven Placement Targeting
Following the successful site targeting pattern, create a flexible placement system with:

#### 1. Database Schema
```sql
CREATE TABLE placement_targeting (
  id SERIAL PRIMARY KEY,
  topLevelDomain VARCHAR(255) NOT NULL,
  slotName VARCHAR(50) NOT NULL, -- 'slotA', 'slotB', etc.
  placementType ENUM('css_selector', 'dom_position', 'content_analysis', 'ai_placement') NOT NULL,
  placementValue TEXT NOT NULL, -- CSS selector, position rules, or AI instructions
  fallbackPlacement TEXT, -- Optional fallback placement
  priority INTEGER DEFAULT 1, -- Higher priority = tried first
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL
);
```

#### 2. Placement Types
- **CSS Selector (`css_selector`)**: Current approach but database-stored
- **DOM Position (`dom_position`)**: Relative positioning (e.g., "after_second_paragraph")
- **Content Analysis (`content_analysis`)**: Smart placement based on content characteristics
- **AI Placement (`ai_placement`)**: Machine learning-based optimal placement

#### 3. Implementation Phases
- **Phase 1**: Database-driven CSS selectors with fallbacks
- **Phase 2**: Smart DOM positioning algorithms
- **Phase 3**: AI-powered placement optimization

#### 4. Slack Commands (Similar to Site Targeting)
```
/mula-placement-add <domain> <slot> <placement_type> <placement_value> [fallback]
/mula-placement-list [domain]
/mula-placement-rm <placement_id>
/mula-placement-test <domain> <slot> -- Test placement on current page
```

#### 5. Benefits
- **Flexibility**: Easy updates without code changes
- **Fallbacks**: Multiple placement strategies per slot
- **Testing**: Can test placements before deploying
- **Analytics**: Track placement success rates
- **Automation**: Eventually AI-powered optimal placement
- **Consistency**: Same management pattern as site targeting

#### 6. Migration Strategy
1. Extract current placements into database
2. Create management tools (Slack commands)
3. Update SDK to use database-driven placements
4. Add testing capabilities
5. Implement smart placement algorithms
6. Add AI-powered placement suggestions

### Current Status
- **Analysis Complete**: Identified patterns in current hard-coded placements
- **Design Proposed**: Comprehensive flexible placement system designed
- **Next Steps**: Awaiting decision on implementation approach and priority

## Recent Changes

### Critical Pattern: executeQuery Return Value Structure (CRITICAL - DOCUMENTED)
- **Problem Identified**: `executeQuery` function returns metadata but NOT the actual CSV data
- **Return Structure**: 
  ```javascript
  {
    success: true,
    queryExecutionId: '...',
    outputLocation: 's3://bucket/path/...',
    executionTime: 12345,
    dataScanned: 1234567890
    // ❌ NO 'data' field!
  }
  ```
- **Correct Pattern**: Workers must manually read CSV files after `executeQuery` completes
- **Implementation**:
  ```javascript
  // Extract timestamp from output location
  const timestamp = result.outputLocation.split('/').slice(-2, -1)[0];
  const localFilePath = path.join(__dirname, '..', 'data', 'athena-results', queryName, timestamp, `${result.queryExecutionId}.csv`);
  
  // Read CSV manually (executeQuery only downloads, doesn't return content)
  const csvContent = await fs.readFile(localFilePath, 'utf8');
  const data = parseCSV(csvContent);
  ```
- **Why This Happens**: `executeQuery` downloads files to local filesystem but doesn't read/return the content
- **Common Mistake**: Expecting `result.data` to contain CSV content
- **Files Affected**: `engagementReportWorker.js` (FIXED), other workers may have same issue

### Site Targeting System (Latest - COMPLETED)
- **Problem Solved**: Implemented comprehensive site targeting system that allows serving product feeds on unmanifested pages based on URL patterns, path substrings, or JSON-LD data
- **Slack Commands**: 
  - `/mula-site-targeting-add <top-level-domain> <path substring | url pattern | json+ld category> <search phrase>` - Adds new site targeting record with robust quote stripping
  - `/mula-site-targeting-list [top-level-domain (optional)]` - Lists all site targeting records with soft-delete status
  - `/mula-site-targeting-rm <site_targeting_record_id>` - Soft deletes site targeting records
- **Database Schema**: 
  - Created `site_targeting` table with `topLevelDomain`, `targetingType` (ENUM), `targetingValue`, `searchPhrase`, `channelId`, `channelName`, `createdAt`, `updatedAt`, `deletedAt`
  - Added `deletedAt` column for soft deletes with `paranoid: true` in Sequelize model
  - Created migrations: `20241203000000-create-site-targeting.js` and `20241203010000-add-deleted-at-to-site-targeting.js`
- **Search Integration**: 
  - Automatically creates `Search` records with default `platformConfig: { searchIndex: 'All' }` if search phrase doesn't exist
  - Queues search jobs for immediate processing via `searchQueue`
  - Uses `SearchOrchestrator.processSearchById()` for full orchestration pipeline including quality assessment
- **Manifest Integration**: 
  - Modified `scripts/transform-load/mulize/manifest/index.js` to include `_targeting` block in manifest.json
  - Only includes active (non-deleted) and approved searches in manifest
  - Uses `getTargetingForDomain()` helper to filter records
- **SDK Integration**: 
  - Modified `sdk.makemula.ai/svelte-components/src/lib/BootLoader.js` to check `manifest._targeting` as fallback
  - Evaluates targeting rules: `path_substring`, `url_pattern`, `ld_json`
  - Uses `getPageContext()` for JSON-LD matching
  - Constructs `feedUrl` from matching `searchPhrase` using SHA256 hash
- **Human-in-the-Loop Approval**: 
  - Site targeting searches go through same approval workflow as page searches
  - Slack action IDs: `approve_site_targeting_search` / `reject_site_targeting_search` vs `approve_products` / `reject_products`
  - Web UI approval buttons on `/searches/show` page
  - Uses `SearchApprovalHelpers.approveSearch()` for search approval
  - Only approved searches are included in manifest targeting
- **Helper Functions**: 
  - `SiteTargetingHelpers.js`: CRUD operations, domain filtering, targeting evaluation
  - `SearchApprovalHelpers.js`: Search approval logic (copies temp-recommendations.json to results.json)
  - Enhanced `URLHelpers.js`: Exported `createSHA256Hash` function
- **Worker Integration**: 
  - Modified `searchWorker.js` to handle both `pageId` and `searchId` jobs
  - Updated `worker.js` to route jobs correctly
  - Site targeting searches use full orchestration pipeline for quality assessment
- **Error Handling**: 
  - Robust argument parsing for quoted search phrases
  - Comprehensive error handling in Slack commands
  - Graceful fallbacks for targeting evaluation
- **Technical Implementation**:
  - Commands: `routes/slack.js` - `/commands/mula-site-targeting-*`
  - Model: `models/SiteTargeting.js` - Sequelize model with soft deletes
  - Helpers: `helpers/SiteTargetingHelpers.js` - Business logic
  - Manifest: `scripts/transform-load/mulize/manifest/index.js` - Targeting block generation
  - SDK: `sdk.makemula.ai/svelte-components/src/lib/BootLoader.js` - Fallback targeting logic
  - Approval: `helpers/SearchApprovalHelpers.js` - Search approval workflow
  - Workers: `workers/searchWorker.js` and `worker.js` - Job processing
- **Benefits**: 
  - Automatic product feed serving on unmanifested pages
  - Flexible targeting with three specification types
  - Human-in-the-loop quality control
  - Soft deletes for clean manifest management
  - Full search orchestration pipeline integration
  - Robust error handling and user feedback

### Subid Performance Report Slack Command (Latest - COMPLETED)
- **Problem Solved**: Created new Slack command `/mula-impact-on3-subid-report` for comprehensive subid performance reporting from Impact API
- **Slack Command**: Added endpoint in `routes/slack.js` with parameter parsing for `--days-back` and `--mula-only` flags
- **Worker Implementation**: Created `workers/subidReportWorker.js` with complete report generation logic and Slack formatting
- **Queue Integration**: Added `subidReportQueue` to main worker system for async processing
- **API Integration**: Uses existing Impact API configuration from `config/index.js` with proper authentication
- **Report Features**: 
  - Summary statistics (clicks, actions, conversion rate, sales, earnings)
  - Top 5 performers by earnings with detailed metrics
  - Detailed breakdown for ≤20 records
  - Rich Slack formatting with blocks and emojis
- **Parameter Support**: 
  - `--days-back N` (1-30 days, default: 7)
  - `--mula-only` flag to filter for Mula-specific subids
- **Error Handling**: Comprehensive error handling with helpful Slack messages for missing credentials, API failures, etc.
- **Documentation**: Created complete documentation in `docs/subid-slack-command.md` with usage examples and troubleshooting
- **Test Script**: Created `scripts/test-subid-slack-command.js` for verification and testing
- **Usage Examples**:
  - `/mula-impact-on3-subid-report` - 7-day report for all subids
  - `/mula-impact-on3-subid-report --days-back 14 --mula-only` - 14-day report for Mula subids only
  - `/mula-impact-on3-subid-report --days-back 30` - 30-day report for all subids
- **Technical Implementation**:
  - Command: `routes/slack.js` - `/commands/mula-impact-on3-subid-report`
  - Worker: `workers/subidReportWorker.js` - Report generation and Slack formatting
  - Queue: `worker.js` - `subidReportQueue` processing
  - Test: `scripts/test-subid-slack-command.js` - Verification utility
  - Docs: `docs/subid-slack-command.md` - Complete documentation
- **Benefits**: Easy access to subid performance data, automated reporting, rich Slack integration, configurable timeframes and filtering

### Top Products Performance Optimization System (Previous - COMPLETED)
- **Problem Solved**: Implemented sophisticated performance optimization system that uses actual user engagement data to sort product feeds by popularity
- **Athena Query**: Created `top-products.sql` to find product IDs with most `mula_store_click` events by host over past 30 days, ordered by descending click count
- **File Generation**: Created `top-products.js` runner that executes query, parses CSV results, groups by host, and uploads JSON files to S3
- **CDN Integration**: Files uploaded to `CDN_ROOT/{host}/top-products.json` with 5-minute TTL and proper cache control headers
- **BootLoader Integration**: Modified `BootLoader.js` to fetch `top-products.json` from CDN and implement 80/20 popularity/randomization sorting
- **Sorting Algorithm**: 80% of products sorted by popularity (from top-products.json), 20% randomized to avoid local maximums
- **Legacy Removal**: Removed existing `hotItems` implementation in favor of data-driven approach
- **CORS Fix**: Resolved CORS issues by ensuring files uploaded to same S3 bucket (`prod.makemula.ai`) as manifest files
- **Preflight Request Fix**: Removed custom `Cache-Control` header from fetch request to avoid OPTIONS preflight requests
- **CLI Integration**: Added npm scripts `top-products` and `top-products:dev` for running generation with 30 and 7 days lookback
- **Heroku Deployment**: Successfully deployed and tested on production with 6 hosts, 125 total products
- **Data Distribution**: 
  - `www.brit.co`: 41 products
  - `defpen.com`: 34 products
  - `www.swimmingworldmagazine.com`: 25 products
  - `www.on3.com`: 20 products
  - `spotcovery.com`: 4 products
  - `www.snow-forecast.com`: 1 product
- **Technical Implementation**:
  - Query: `www.makemula.ai/queries/queries/top-products.sql`
  - Runner: `www.makemula.ai/queries/runners/top-products.js`
  - BootLoader: `sdk.makemula.ai/svelte-components/src/lib/BootLoader.js`
  - S3 Upload: `www.makemula.ai/helpers/S3Helpers.js` and `EnvironmentHelpers.js`
  - CLI: `npm run top-products` (30 days) or `npm run top-products:dev` (7 days)
- **Usage**: System automatically runs on Heroku Scheduler, files accessible at `https://cdn.makemula.ai/{host}/top-products.json`
- **Benefits**: Data-driven product sorting, improved user engagement, reduced reliance on manual curation, scalable across all publishers

### Top Products Pages Analysis (Latest - COMPLETED)
- **Problem Solved**: Created Athena query to find pathnames where top products are being displayed for each domain
- **Query**: `top-products-pages.sql` that joins top products with page view events to show which pages drive the most engagement
- **Data Structure**: Returns host, product_id, pathname, page_views, page_clicks, total_engagement
- **Insights**: Reveals which specific pages are driving product clicks and views
- **Usage**: `node queries/cli.js run top-products-pages --days-back 7 --parameters '{"top_n_products": 5}'`
- **Results**: Shows realistic click volumes (1-3 clicks per product per page) vs previous incorrect query that showed impossible statistics
- **File Size**: 18KB vs 7.2MB for corrected query, demonstrating data quality improvement

- **Problem Solved**: Fixed critical bug where store click URLs from `fanatics_impact` data source weren't adding `subid=mula` parameter
- **Root Cause**: The `openMulaLink` function in BootLoader.js wasn't checking for Fanatics products before opening URLs
- **Solution**: Updated `openMulaLink` function to check if product has `data_source === 'fanatics_impact'` and automatically add `subid=mula` to the URL
- **Implementation**: Added product lookup logic to find the clicked product in the feed and check its data source
- **URL Handling**: Uses URL constructor to properly add query parameter without breaking existing URL structure
- **Integration**: Works seamlessly with existing SkimLinks integration (subid is added before SkimLinks processing)
- **Testing**: Fix ensures Fanatics products will now properly track with `subid=mula` in Impact API reports
- **Impact**: This should significantly improve tracking accuracy for Fanatics affiliate links and revenue attribution

### Sales Enablement Placement Tool (Latest - COMPLETED)
- **Problem Solved**: Created visual widget placement tool for sales enablement that allows users to visually select placement locations for Mula widgets
- **Activation**: Tool activates when `window.Mula.activateSalesEnablements = true` is detected by BootLoader
- **Widget Selection**: Users can choose between TopShelf or SmartScroll widgets via radio buttons
- **Visual Placement**: Hover over any page element to highlight it, then click to insert the selected widget
- **Widget Insertion**: Creates properly styled containers with labels and calls `window.Mula.boot()` to fetch products
- **Clean Architecture**: All logic contained in separate `SalesEnablementTool.js` file for clear separation of concerns
- **UI Components**: 
  - Fixed overlay for hover effects (z-index: 999999)
  - Widget selector panel in top-right corner (z-index: 1000000)
  - Visual highlighting with blue border and semi-transparent background
  - Inserted widgets have dashed borders and labels for easy identification
- **Event Handling**: Proper event listeners for mouseover, mouseout, and click events with conflict prevention
- **Memory Management**: Clean destroy method that removes all UI elements and event listeners
- **Integration**: Seamlessly integrated into BootLoader.js with proper import and activation logic
- **Usage**: Set `window.Mula.activateSalesEnablements = true` before Mula SDK loads to activate the tool
- **Features**:
  - Visual element highlighting on hover
  - Widget type selection (TopShelf/SmartScroll)
  - Click-to-insert functionality
  - Automatic product fetching via `window.Mula.boot()`
  - Clean UI with status messages and cancel option
  - Proper cleanup and memory management


### SmartScroll A/B Test System (Previous - COMPLETED)
- **Problem Solved**: Implemented comprehensive A/B testing framework for SmartScroll widget to test "Buy Now" button vs "View Details + Like" buttons
- **A/B Test Utility**: Created `ABTest.js` with deterministic assignment based on session ID and query string override support
- **Unified API**: Implemented `getExperimentAssignment()` method that safely returns correct variant for UI and proper logData for analytics
- **Event Logging**: Experiment/variant data automatically included in all widget events (widget views, store clicks)
- **Forced Variant Exclusion**: Query string overrides (e.g., `?mulaABTest=buy_now`) are excluded from analytics to prevent data pollution
- **SmartScroll Integration**: Updated SmartScroll.svelte to use new A/B test API with Buy Now button variant
- **Analytics Pipeline**: Created Athena SQL query and runner script for comprehensive experiment analysis
- **Statistical Analysis**: Query includes CTR calculation, lift analysis, and statistical significance testing
- **Cached Results**: Added `--use-cached` flag to quickly check results without re-running queries
- **Query String Override**: Support for forcing variants via URL parameters for testing
- **Codebase Refactor**: Updated all relevant files to use unified API, removed deprecated methods
- **Documentation**: Complete documentation in README and inline code comments
- **Testing**: Successfully tested with real data showing initial results (Buy Now: 0.50% CTR vs Control: 1.12% CTR)
- **CTR Calculation Improvement**: Updated to use `mula_in_view` (viewport visibility) instead of `mula_widget_view` as CTR denominator for accurate engagement metrics
- **Usage**: 
  - Run analysis: `node queries/runners/smartscroll-button-experiment.js`
  - Check cached: `node queries/runners/smartscroll-button-experiment.js --use-cached`
  - Force variant: Add `?mulaABTest=buy_now` to URL

### Force New Search Feature (Previous)
- **Problem Solved**: Users can now force new searches for approved pages without deleting and recreating pages
- **Web Interface**: Added "Force New Search" button to approved and error page states
- **Slack Command**: New `/mula-remulaize <URL>` command for remote operation
- **API Endpoint**: Created `POST /pages/:id/remulaize` endpoint with authentication
- **State Management**: Resets all search-related fields (searchId, searchIdStatus, searchStatus, searchAttempts, keywordFeedback)
- **Search Integration**: Uses existing search queue and orchestrator for consistency
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Documentation**: Complete documentation in `docs/force-new-search.md`
- **Testing**: Created test script `scripts/test-force-new-search.js` for verification
- **Usage**: Web button or `/mula-remulaize https://example.com/article`

### Product Performance Reports (Previous)
- **New Slack Command**: `/mula-product-performance [days]` - Shows most viewed and clicked products for specified time period
- **Athena Query**: Created `product-performance.sql` that analyzes `mula_product_view` and `mula_store_click` events
- **Worker Integration**: Created `productPerformanceWorker.js` to handle async report generation and Slack posting
- **Queue System**: Uses `productPerformanceQueue` (Bull/Redis) for job processing
- **Data Analysis**: Combines product views and clicks for total engagement scoring
- **Multi-site Support**: Shows performance across all publisher sites grouped by host
- **Configurable Timeframes**: Supports 1-30 days lookback (default: 1 day)
- **Rich Slack Formatting**: Beautiful formatted messages with emojis, grouping, and summary statistics
- **Error Handling**: Comprehensive error handling with user-friendly Slack messages
- **Documentation**: Complete documentation in `docs/product-performance-reports.md`
- **Testing**: Created test script `scripts/test-product-performance.js` for verification
- **Usage**: `/mula-product-performance` or `/mula-product-performance 7` for 7 days

### New Slack Command /mulaize (Previous)
- **New Slack Command**: `/mulaize <URL>` - Takes a URL and creates a page/triggers product recommendation workflow
- **URL Validation**: Automatically adds https:// if protocol is missing, validates URL format
- **Duplicate Prevention**: Checks if page already exists and provides link to existing page
- **Page Creation**: Creates new Page record in database if URL doesn't exist
- **Workflow Integration**: Queues encore job to trigger the same product recommendation workflow as pages.js controller
- **User Feedback**: Provides immediate response with page URL for tracking progress
- **Error Handling**: Comprehensive error handling for invalid URLs and system errors
- **Implementation**: Added to `routes/slack.js` following existing Slack command patterns
- **Usage**: `/mulaize https://example.com/article` or `/mulaize example.com/article`

### Fanatics Integration with Impact API (Previous - Successfully Tested)
- **New Search Strategy**: Created `FanaticsSearchStrategy.js` following established patterns
- **Impact API Integration**: Implemented `searchFanaticsProducts()` function with proper authentication and error handling
- **Product Transformation**: Added `transformFanaticsProduct()` to convert Impact API responses to standard Mula format
- **Domain Targeting**: Added automatic platform selection for on3.com domains (including all subdomains) in SearchOrchestrator
- **Configuration**: Added Impact API configuration to `config/index.js` with environment variable support
- **Simplified Architecture**: Removed unnecessary category selection since Impact API only supports keyword search
- **Documentation**: Created comprehensive documentation in `docs/fanatics-integration.md`
- **Test Script**: Created `scripts/test-fanatics-integration.js` for verification
- **Worker Integration**: Updated searchWorker to support Fanatics strategy
- **S3 Storage**: Added Fanatics product transformation and storage to tempRecommendationsUrl
- **Error Handling**: Implemented retry logic, rate limiting, and graceful error handling
- **Environment Variables**: Requires IMPACT_ACCOUNT_ID, IMPACT_USERNAME, IMPACT_PASSWORD
- **Testing Results**: ✅ Successfully tested with 100 products returned, quality score 0.85
- **Field Mapping**: Corrected product transformation to match actual Impact API schema (Name, Url, CurrentPrice, etc.)
- **TLD Extraction**: Implemented robust domain targeting that catches all subdomains (dev.www.on3.com, staging.on3.com, etc.)

### Product Card View Tracking System (Previous)
- **Optimized Performance**: Single IntersectionObserver for all product cards instead of 40+ individual observers
- **Enhanced ViewTracker.js**: Added `createProductCardViewTracker()` function with efficient single-observer pattern
- **SmartScroll Integration**: Product cards automatically tracked as they're rendered with `mula_product_view` events
- **TopShelf Integration**: Both original and cloned cards tracked for infinite scroll carousel
- **Duplicate Prevention**: Built-in tracking prevents duplicate view events using Set-based memory
- **Configurable Options**: Customizable threshold, root margin, and disconnect behavior
- **Clean API**: Controller object with methods for observe, unobserve, hasViewed, getViewedProducts
- **Memory Management**: Proper cleanup and disconnect methods to prevent memory leaks
- **Event Logging**: Logs `"mula_product_view"` events with product IDs and widget context

### Network-Wide Performance Reports (Latest - COMPLETED)
- **Enhanced Slack Command**: `/mula-performance-report [domains|network|lookback] [lookback]` - Now supports network-wide aggregation
- **Network Sentinel Values**: Added support for "network" or "all" as first argument to indicate network-wide aggregation
- **Data Aggregation**: Implemented `aggregateDataByDate()` function that sums metrics across all domains by date
- **Chart Optimization**: Network-wide reports show single aggregated line instead of multiple domain lines
- **Backward Compatibility**: All existing functionality preserved - domain filtering, lookback days, etc.
- **Enhanced Parsing**: Improved command parsing to handle network sentinel, domains, and lookback days in any order
- **Documentation**: Updated docs with new usage examples and network-wide functionality
- **Testing**: Created test script `scripts/test-network-performance-report.js` for verification
- **Usage Examples**: 
  - `/mula-performance-report` - All domains (existing)
  - `/mula-performance-report network` - Network-wide aggregation
  - `/mula-performance-report network 14` - Network-wide with 14 days
  - `/mula-performance-report all 30` - Network-wide with 30 days

### Performance Report System (Previous)
- **Renamed Query**: `14DayReportTimeSeries.sql` → `PerformanceReportTimeSeries.sql` for better clarity
- **New Slack Command**: `/mula-performance-report [domains] [lookback]` - Generates performance reports with time series charts
- **Worker Integration**: Created `performanceReportWorker.js` to handle async report generation
- **Chart Generation**: Uses QuickChart API to create beautiful time series charts for key metrics
- **Domain Filtering**: Supports filtering by specific domains or all domains
- **Configurable Lookback**: Default 7 days, configurable up to 365 days
- **Queue System**: Uses Bull queue for async processing and error handling
- **Metrics Tracked**: Page Views, Widget Views, Store Clicks, Ad Views with top 5 domains per metric

### Domain-Channel Mapping System (Previous)
- **Implemented database-driven domain-channel mappings** to replace hardcoded mappings in reports
- **New Slack Commands**:
  - `/mula-domain-channels-add <domain> [displayName]` - Add mapping between domain and current channel
  - `/mula-domain-channels-list` - List all current domain-channel mappings
  - `/mula-domain-channels-rm <domain>` - Remove mapping for specific domain
- **Database Schema**: Created `domain_channel_mappings` table with domain, channelId, channelName, displayName fields
- **Migration**: `20241202000000-create-domain-channel-mappings.js` creates the new table
- **Helper Functions**: `DomainChannelHelpers.js` provides CRUD operations for mappings
- **Reports Integration**: Reports system now loads mappings from database instead of hardcoded values
- **Migration Script**: `migrate-domain-mappings.js` populates database with existing hardcoded mappings
- **Documentation**: Complete setup guide in `docs/domain-channel-mappings.md`

### Heroku Deployment Environment
- **Production App**: `www-makemula-ai` on Heroku
- **Database**: PostgreSQL addon on Heroku
- **Environment**: Production environment with proper SSL and connection pooling
- **Deployment**: Uses Procfile with web and worker dynos
- **Database Migrations**: Run via `heroku run npx sequelize-cli db:migrate -a www-makemula-ai`

### Database Migration (Previous)
- **Successfully migrated database** using `heroku run npx sequelize-cli db:migrate -a www-makemula-ai`
- **New columns added** to support search orchestration system:
  - `searches` table: platform, platformConfig, productCount, qualityScore, status, errorMessage, executedAt
  - `pages` table: searchAttempts, searchStrategy, searchStatus
- **Updated unique constraints** to support multi-platform search orchestration
- **Migration file**: `20241201000000-add-search-orchestrator-columns.js`

### Slack Integration Fixes
- **Fixed JSON parsing error** in Slack rejection handler where `action.value` contained malformed data
- **Enhanced error handling** for legacy buttons or malformed values
- **Improved feedback modal** to use actual search data instead of parsing Slack message text
- **Better context display** showing platform, search index, and keywords from database records
- **Robust fallback logic** for cases where search data is incomplete

### UI Improvements
- **Search Index Display**: Added search index badges to searches index page
- **Platform Display**: Added platform badges to both searches index and page show views
- **Consistent Badge System**: Blue badges for platform, gray badges for search index
- **Safe Template Logic**: Added null checks for search object existence
- **Enhanced Information Display**: Users can now see platform and search index at a glance

### Status Polling Implementation
- **Real-time Status Updates**: Added polling for pages in "searching" state
- **New Status Endpoint**: Created `/pages/:id/status` endpoint for lightweight status checks
- **Automatic Page Refresh**: Pages automatically refresh when status changes
- **Efficient Polling**: 3-second intervals with 5-minute timeout
- **State Detection**: Checks for final recommendations, temporary recommendations, and error states

### Memory Bank Implementation
- Created core memory bank files following the established pattern
- Analyzed project structure and sub-repositories
- Documented current architecture and technical decisions
- Established foundation for ongoing documentation

### Athena Query System Implementation
- Created new query development infrastructure in `www.makemula.ai/queries/`
- Implemented version-controlled SQL query files with parameter substitution
- Built query execution utilities with S3 result handling and polling for results
- Added cron job scheduling system for automated query execution
- Created CLI tools for query management and execution
- Implemented store-clicks query as first example
- **Critical Bug Discovery**: Found that manifested pages weren't setting search_id, causing search-driven conversions to appear as organic
- **Data Analysis**: Analyzed store clicks with search IDs, revealing search-to-purchase conversion patterns
- **Query Infrastructure**: Successfully tested query system with parameter substitution and date filtering
- **New Query Added**: Created `widget-view-popularity` query to find most popular host & pathnames receiving mula_widget_view events in past 3 hours, grouped by product_src
- **CLI Integration**: Leveraged existing CLI system for unified query management instead of creating individual runners
- **Time Series Query**: Successfully created and executed `PerformanceReportTimeSeries` query that buckets all metrics into daily windows, providing time series analysis of Mula widget performance over a configurable period
- **Query Execution Pattern**: Use `npm run queries:run -- <query-name> --days-back <number>` to execute queries with parameters
- **Results Location**: Query results are automatically downloaded to `www.makemula.ai/data/athena-results/<query-name>/<timestamp>/`

### Workflow Optimization Feedback
- **Elliott's Feedback**: Human-in-the-loop approval should happen after keyword generation AND product fetching
- **Initial Approach**: Move approval to after both keyword generation and product fetching using Amazon Associates API
- **Final Decision**: Implement post-product approval workflow for quality control
- **New Flow**: Article processed → Keywords auto-approved → Products fetched → **Human approval with full context** → Deploy or restart with feedback
- **Benefits**: Informed decision-making, quality control, iterative improvement, cost-effective with free Amazon API
- **Implementation**: Auto-approve keywords, fetch products, send Slack approval with sample products, handle feedback and restart

### Project Analysis Completed
- Reviewed all sub-repositories and their purposes
- Analyzed SDK architecture and Svelte components
- Examined backend services and infrastructure setup
- Identified key technical patterns and constraints

### Progressive, LLM-guided Search Orchestration
- Search flow is now managed by a platform-agnostic orchestrator, supporting multiple platforms and dynamic keyword/index selection. LLM generates keywords and indexes, with feedback and duplicate avoidance.

### Human-in-the-Loop Approval
- Product approval now happens after product fetching, with both Slack and web UI supporting approval/rejection and feedback. Approval logic is centralized and ensures only one approval per page-search relationship.

### Immutable Search Records
- Approved Search records are immutable; pages can reference existing approved searches. Page-search relationship approval is tracked via a new `searchIdStatus` field on the Page.

### Canonical S3 Pathing
- S3 paths for search results are now based on a hash of (phrase, platform, platformConfig) to guarantee uniqueness.

### Centralized Approval Logic
- Approval logic (copying temp recommendations, updating status) is now shared between web and Slack flows.

### Feedback Loop
- Feedback on rejected products triggers a new orchestrated search, but if an existing approved search matches, the page can be linked to it for human approval.

### SmartScroll A/B Test Implementation (2025-07)
- **A/B Test Utility**: Created `sdk.makemula.ai/svelte-components/src/lib/ABTest.js` with deterministic assignment based on session ID
- **Unified API**: `getExperimentAssignment()` method returns correct variant for UI and proper logData for analytics
- **Session-Based Assignment**: 50/50 split determined by session ID hash for consistent user experience
- **Query String Override**: Support for forcing variants via `?mulaABTest=buy_now` or `?mulaABTest=control`
- **Forced Variant Exclusion**: Query string overrides are excluded from analytics to prevent data pollution
- **SmartScroll Integration**: Updated `SmartScroll.svelte` to use Buy Now button variant with cart icon
- **Event Logging**: Experiment/variant data automatically included in all widget events
- **Analytics Query**: Created `smartscroll-button-experiment.sql` with CTR, lift, and statistical significance analysis
- **Runner Script**: Created `smartscroll-button-experiment.js` with `--use-cached` flag for quick result checking
- **Statistical Analysis**: Chi-square test for significance, CTR calculation, and lift percentage
- **Initial Results**: Buy Now variant showing 0.50% CTR vs Control 1.12% CTR (not statistically significant yet)
- **CTR Calculation Improvement**: Updated to use `mula_in_view` (viewport visibility) instead of `mula_widget_view` as CTR denominator for accurate engagement metrics
- **Usage Patterns**: 
  - Run analysis: `node queries/runners/smartscroll-button-experiment.js`
  - Check cached: `node queries/runners/smartscroll-button-experiment.js --use-cached`
  - Force variant: Add `?mulaABTest=buy_now` to URL for testing

### CTR Calculation Methodology (Latest - COMPLETED)
- **Problem Identified**: A/B test CTR calculation was using `mula_widget_view` (widget eligibility) as denominator instead of `mula_in_view` (viewport visibility)
- **Impact**: This artificially deflated CTR metrics by including users who never scrolled to see the widget
- **Solution**: Updated A/B test query to use `mula_in_view` events as CTR denominator
- **Rationale**: 
  - `mula_widget_view`: Fires when Mula is eligible to load (even if user never sees it)
  - `mula_in_view`: Fires when widget enters viewport with 10% visibility threshold
  - Using `mula_in_view` provides accurate engagement metrics for users who actually saw the widget
- **Implementation**: Modified `smartscroll-button-experiment.sql` to filter for `mula_in_view` events instead of `mula_widget_view`
- **Benefits**: More accurate CTR calculation, better business metrics, industry-standard approach
- **Documentation**: Updated AB_TEST_README.md with detailed rationale and implementation notes

### SmartScroll A/B Test Conclusion (Latest - COMPLETED)
- **Experiment Status**: CONCLUDED (September 6, 2025)
- **Final Results**: 30-day analysis with 1M+ widget views
- **Control Performance**: 0.3961% CTR (516,770 views, 2,047 clicks)
- **Buy Now Performance**: 0.3700% CTR (517,331 views, 1,914 clicks)
- **Statistical Significance**: p < 0.01 (highly significant)
- **Lift**: -6.60% (Buy Now variant underperformed)
- **Conclusion**: Buy Now button significantly hurt user engagement
- **Action Taken**: Reverted all users to control variant (View Details + Like buttons)
- **Code Changes**: 
  - Modified `ABTest.js` to always return 'control' variant
  - Updated experiment configuration with conclusion status
  - Updated documentation with final results
- **Key Learning**: Single "Buy Now" button was too aggressive, users prefer "View Details" + "Like" approach
- **Next Steps**: Design more conservative experiments building on successful control variant

### Time Series Chart Reporting (2025-07)
- Implemented automated time series chart reporting for Mula metrics (Page Views, Widget Views, Store Clicks, Ad Views)
- Uses QuickChart API to generate beautiful, modern line charts from Athena time series CSVs
- Charts are posted to Slack (channel configurable, e.g., #proj-mula-reports)
- Only the top 5 domains per metric are shown, with all others grouped as "Other"
- Color consistency is maintained for each domain across all charts (same color for a domain in every metric)
- Charts use a colorblind-friendly palette, modern fonts, and enhanced styling for clarity
- Script: `scripts/debug/time-series-charts-poc.js`
- Troubleshooting: If charts do not appear in the intended Slack channel, check bot permissions, channel spelling, and the `sendSlackMessage` implementation for channel overrides

## Current State Assessment

### What's Working Well
- **SDK Architecture**: Well-structured Svelte-based components
- **Infrastructure**: Solid AWS-based cloud infrastructure
- **Monorepo Structure**: Good organization of related projects
- **Performance Focus**: Clear emphasis on Core Web Vitals
- **Publisher Integration**: Simple script tag installation
- **Database Schema**: Updated with comprehensive search orchestration support
- **Slack Integration**: Robust approval workflow with error handling
- **UI/UX**: Enhanced information display with platform and search index badges
- **Real-time Updates**: Status polling for better user experience
- **Product View Tracking**: Optimized single-observer pattern for efficient card view tracking

### Areas Needing Attention
- **Documentation**: Limited comprehensive documentation
- **Testing**: Minimal test coverage across components
- **Development Workflow**: Could benefit from better tooling
- **Monitoring**: Limited observability into production systems

### Known Issues
- **Memory Bank**: Previously lacked structured documentation approach
- **Knowledge Transfer**: Reliance on individual developer knowledge
- **Onboarding**: New developers need extensive time to understand system
- **Decision Tracking**: Technical decisions not well documented

## Next Steps

### Immediate (This Session)
1. ✅ **Top Products Performance Optimization System**: COMPLETED - Implemented sophisticated performance optimization system with popularity-based feed sorting
2. ✅ **Top Products Pages Analysis**: COMPLETED - Created Athena query to analyze which pages display top products
3. ✅ **CORS Issue Resolution**: COMPLETED - Fixed CORS issues by ensuring consistent S3 bucket usage and removing preflight triggers
4. ✅ **Heroku Deployment**: COMPLETED - Successfully deployed and tested top-products system on production
5. ✅ **SmartScroll A/B Test System**: COMPLETED - Implemented comprehensive A/B testing framework with analytics
6. ✅ **Deploy Domain-Channel Mapping System**: Successfully deployed new Slack commands and database changes to Heroku
7. ✅ **Run Database Migration**: Successfully executed the new domain-channel mappings migration on production
8. ✅ **Populate Database**: Successfully migrated existing hardcoded mappings to database
9. ✅ **Test Reports System**: Verified reports system loads mappings correctly from database
10. ✅ **Implement Performance Report System**: Created new Slack command and worker for performance reports
11. ✅ **Rename Query**: Renamed 14DayReportTimeSeries.sql to PerformanceReportTimeSeries.sql
12. ✅ **Implement Product Card View Tracking**: Created optimized single-observer pattern for efficient product card view tracking
13. ✅ **Integrate View Tracking**: Added view tracking to SmartScroll and TopShelf components
14. ✅ **Implement Fanatics Integration**: Created new search strategy for Fanatics affiliate catalog via Impact API
15. ✅ **Domain Targeting**: Added automatic platform selection for on3.com domains
16. ✅ **Product Transformation**: Implemented Fanatics product transformation to standard format
17. ✅ **Documentation**: Created comprehensive documentation for Fanatics integration
18. ✅ **Subid Performance Report Slack Command**: COMPLETED - Created `/mula-impact-on3-subid-report` command with comprehensive reporting features
19. **Configure Slack Commands**: Add the new subid report slash command to Slack app configuration
20. **Test Slack Commands**: Verify the new subid command works correctly in production
21. **Update Existing Mappings**: Run add commands in each channel to update channel IDs
22. ✅ **Test Fanatics Integration**: Successfully tested Impact API integration with 100 products returned
23. ✅ **Documentation Updates**: Updated memory bank with subid command details

### Short Term (Next 1-2 Weeks)
1. **Development Workflow Integration**: Incorporate memory bank updates into development process
2. **Documentation Reviews**: Regular reviews and updates of memory bank files
3. **Team Onboarding**: Use memory bank for new team member onboarding
4. **Query System Enhancement**: Add more queries and improve scheduling capabilities
5. **Monitoring Enhancement**: Improve production monitoring and alerting

### Medium Term (Next Month)
1. **Testing Strategy**: Develop comprehensive testing approach
2. **Performance Optimization**: Continue Core Web Vitals optimization
3. **Query Analytics**: Build dashboard for query performance and results
4. **Enhanced Analytics**: Build UI for displaying/managing page-search approval status

## Active Decisions and Considerations

### Database Migration Strategy
- **Decision**: Use Sequelize CLI for database migrations
- **Rationale**: Consistent with existing ORM setup and provides rollback capabilities
- **Implementation**: Migration files in `www.makemula.ai/migrations/`
- **Benefits**: Version-controlled schema changes, safe rollbacks, team coordination

### Slack Integration Error Handling
- **Decision**: Add robust error handling for malformed Slack payloads
- **Rationale**: Legacy buttons and edge cases can cause JSON parsing failures
- **Implementation**: Try-catch blocks with fallback logic and detailed logging
- **Benefits**: Prevents crashes, better debugging, graceful degradation

### UI Information Display
- **Decision**: Add platform and search index badges to key UI components
- **Rationale**: Users need to understand search configuration at a glance
- **Implementation**: Bootstrap badges with consistent color coding
- **Benefits**: Better user experience, easier debugging, clearer search context

### Status Polling Architecture
- **Decision**: Implement client-side polling for real-time status updates
- **Rationale**: Users need immediate feedback when search status changes
- **Implementation**: Lightweight status endpoint with efficient polling logic
- **Benefits**: Better user experience, reduced manual page refreshes, real-time updates

### Memory Bank Integration
- **Decision**: Implement memory bank pattern for all future development
- **Rationale**: Improves knowledge retention and project continuity
- **Implementation**: Create core files and establish update workflow

### Documentation Strategy
- **Decision**: Focus on comprehensive, structured documentation
- **Rationale**: Reduces onboarding time and improves development efficiency
- **Implementation**: Memory bank files with regular updates

### Development Workflow
- **Consideration**: How to integrate memory bank updates into development process
- **Options**: 
  - Manual updates during development
  - Automated triggers for documentation updates
  - Regular review cycles
- **Recommendation**: Start with manual updates, evolve to automated triggers

### Athena Query System
- **Decision**: Implement version-controlled query development system
- **Rationale**: Enables rapid query development, testing, and scheduling
- **Implementation**: SQL files with parameter substitution, CLI tools, cron scheduling
- **Benefits**: Faster iteration, better testing, automated execution

### SDK Analytics Tracking
- **Decision**: Fix search_id and product_src tracking bugs in BootLoader.js
- **Rationale**: Critical for understanding search-to-purchase conversion funnel
- **Implementation**: Set search_id for manifested pages, add product_src from shopping_results
- **Impact**: Will significantly improve analytics data quality once deployed

### Post-Product Approval Workflow
- **Decision**: Implement human-in-the-loop approval after product generation
- **Rationale**: Quality control with full context, informed decision-making, iterative improvement
- **New Flow**: Keywords → Auto-approve → Product Fetching → **Human Approval** → Deploy or Restart with Feedback
- **Cost Consideration**: Amazon Associates API is free, enabling quality-focused experimentation
- **Implementation**: Auto-approve keywords, fetch products, Slack approval with samples, feedback-driven restart
- **Benefits**: Quality control, informed decisions, iterative improvement, cost-effective experimentation

### Immutable Search Records
- Search records are immutable once approved; page-search approval is tracked separately.

### Centralized Approval Logic
- Approval logic is shared between web and Slack for consistency.

### Canonical S3 Pathing
- All search result files are keyed by a hash of (phrase, platform, config).

### Feedback Loop
- Feedback can link a page to an existing approved search or trigger a new search attempt.

## Important Patterns and Preferences

### Documentation Patterns
- **Structured Approach**: Clear hierarchy of documentation files
- **Context Preservation**: Maintain historical context and decision rationale
- **Regular Updates**: Keep documentation current with code changes
- **Accessibility**: Make documentation easily discoverable and searchable

### Development Patterns
- **Performance First**: Always consider Core Web Vitals impact
- **Publisher Focus**: Design for publisher needs and constraints
- **Incremental Enhancement**: Build features progressively
- **Data-Driven**: Use analytics to inform optimization decisions
- **Error Handling**: Robust error handling with graceful degradation
- **User Experience**: Real-time feedback and clear information display

### Technical Preferences
- **Lightweight SDK**: Maintain sub-20kB gzipped size
- **AWS Native**: Leverage AWS managed services
- **Event-Driven**: Use event-driven architecture for scalability
- **Component-Based**: Modular, reusable components
- **Database Migrations**: Use Sequelize CLI for schema changes
- **Status Polling**: Efficient client-side polling for real-time updates

## Learnings and Project Insights

### Key Learnings
1. **Data-Driven Optimization**: Using actual user engagement data for product sorting significantly improves performance over manual curation
2. **CORS Configuration**: Consistent S3 bucket usage and avoiding preflight requests are critical for CDN-based file access
3. **Query Data Quality**: Simple, focused queries produce more reliable results than complex joins that can create impossible statistics
4. **Monorepo Benefits**: Excellent for coordinated development and versioning
5. **Svelte Advantages**: Perfect for lightweight, performant SDK development
6. **AWS Integration**: Comprehensive cloud infrastructure enables scalability
7. **Performance Focus**: Core Web Vitals optimization is critical for publisher adoption
8. **Analytics Data Quality**: Search_id tracking is critical for conversion funnel analysis
9. **Query Development**: Version-controlled SQL with parameter substitution enables rapid iteration
10. **Slack Integration**: Robust error handling is essential for production reliability
11. **Database Migrations**: Proper migration strategy prevents data loss and enables safe deployments
12. **Real-time UX**: Status polling significantly improves user experience during async operations
13. **UI Information Design**: Clear display of search context helps users understand system behavior

### Project Insights
1. **Performance Optimization**: Data-driven product sorting based on actual user engagement provides significant performance improvements
2. **CDN Integration**: Proper CORS configuration and avoiding preflight requests are essential for reliable CDN-based file access
3. **Query Simplicity**: Simple, focused queries produce more reliable and maintainable results than complex multi-table joins
4. **Publisher Needs**: Simple integration and performance are paramount
5. **Data Pipeline**: Event-driven architecture enables future ML/AI capabilities
6. **Scalability**: Cloud-native approach supports growth
7. **User Experience**: Native-feeling product recommendations drive engagement
8. **Search-Driven Conversions**: Significant portion of store clicks come from search results
9. **Data Infrastructure**: Athena queries provide powerful analytics capabilities
10. **Error Resilience**: Production systems need robust error handling for edge cases
11. **Information Architecture**: Users need context about search configuration to make informed decisions
12. **Real-time Feedback**: Immediate status updates improve user satisfaction and reduce support burden
13. **Database Design**: Proper schema design with search orchestration enables complex workflows

### Technical Insights
1. **S3 Bucket Consistency**: Using the same S3 bucket for all CDN files ensures consistent CORS configuration
2. **Preflight Request Avoidance**: Removing custom headers from fetch requests prevents OPTIONS preflight requests that may not be handled by CDN
3. **Query Design Patterns**: Simple GROUP BY queries produce more reliable results than complex CTEs with multiple joins
4. **SDK Architecture**: Component-based approach enables flexibility
5. **Infrastructure Design**: CDN + event collection provides optimal performance
6. **Data Processing**: Partitioned storage enables cost-effective analytics
7. **Development Workflow**: Monorepo structure simplifies coordination
8. **BootLoader Logic**: Manifested pages need explicit search_id setting
9. **Query Infrastructure**: S3 polling and parameter substitution enable robust query execution
10. **Slack API**: Payload validation and error handling are critical for production reliability
11. **Database Migrations**: Version-controlled schema changes enable safe team collaboration
12. **Client-Side Polling**: Efficient polling with proper timeouts provides good UX without server load
13. **Template Safety**: Null checks and conditional rendering prevent template errors

## Current Challenges

### Documentation Challenges
- **Comprehensive Coverage**: Ensuring all aspects are well documented
- **Maintenance**: Keeping documentation current with rapid development
- **Accessibility**: Making documentation easily discoverable
- **Integration**: Seamlessly integrating documentation into development workflow

### Technical Challenges
- **Performance Optimization**: Maintaining Core Web Vitals while adding features
- **Scalability**: Ensuring system scales with publisher growth
- **Testing**: Developing comprehensive testing strategy
- **Monitoring**: Improving production observability
- **Error Handling**: Ensuring robust error handling across all integrations
- **Real-time Updates**: Balancing real-time feedback with system performance

### Process Challenges
- **Knowledge Transfer**: Ensuring team knowledge is preserved
- **Onboarding**: Reducing time for new developers to become productive
- **Decision Tracking**: Maintaining context for technical decisions
- **Quality Assurance**: Ensuring consistent code quality across components
- **Deployment Coordination**: Coordinating database migrations with application deployments

## Success Metrics for Memory Bank

### Documentation Quality
- **Completeness**: All major components and decisions documented
- **Accuracy**: Documentation matches current implementation
- **Clarity**: Clear, understandable documentation
- **Maintenance**: Regular updates and reviews

### Development Efficiency
- **Onboarding Time**: Reduced time for new developers
- **Knowledge Retention**: Better preservation of project knowledge
- **Decision Context**: Clear rationale for technical decisions
- **Collaboration**: Improved team collaboration and communication

### Project Continuity
- **Knowledge Transfer**: Smooth handoffs between developers
- **Historical Context**: Preservation of project evolution
- **Future Planning**: Better foundation for future development
- **Risk Mitigation**: Reduced dependency on individual knowledge

### User Experience
- **Real-time Feedback**: Immediate status updates for users
- **Information Clarity**: Clear display of search context and configuration
- **Error Handling**: Graceful handling of edge cases and errors
- **System Reliability**: Robust production system with minimal downtime 