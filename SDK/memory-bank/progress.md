# Progress: Mula

## What Works

### Core SDK Functionality ✅
- **SDK Loading**: Successful script tag integration and initialization
- **Component System**: Svelte-based components (SmartScroll, TopShelf, Feed, Card, ProductModal)
- **Event Collection**: Working Logger and Trackers for user behavior monitoring
- **Product View Tracking**: Optimized single-observer pattern for efficient card view tracking
- **A/B Testing Framework**: Comprehensive A/B testing system with deterministic assignment and analytics
- **Publisher Integration**: Simple installation process with automatic detection
- **Performance**: Sub-20kB gzipped size maintained
- **User Personalization System**: Comprehensive behavior tracking and adaptive recommendations
- **Revenue Generation**: Proven RPM lift and revenue per session improvement for publishers

### Backend Services ✅
- **Publisher Portal**: Functional dashboard at www.makemula.ai
- **Page Processing**: Content analysis and "mula-ization" capabilities
- **Product Management**: Affiliate product data handling
- **Database**: PostgreSQL with Sequelize ORM working
- **Worker Processes**: Background job processing with Bull queues
- **Database Migrations**: Sequelize CLI migrations for schema changes
- **Status Polling**: Real-time status updates for searching pages

### Infrastructure ✅
- **CDN**: CloudFront distribution (cdn.makemula.ai) operational
- **Event Collection**: Beacon endpoint (beacon.makemula.ai) functional
- **Data Pipeline**: Kinesis Firehose → Lambda → S3 working
- **Analytics**: Athena queries for data analysis
- **Query Infrastructure**: Version-controlled SQL queries with parameter substitution and scheduling
- **Data Analysis**: Store clicks analysis with search_id tracking and conversion funnel insights
- **A/B Test Analytics**: Comprehensive experiment analysis with statistical significance testing
- **Storage**: S3 buckets with proper partitioning

### Publisher Integrations ✅
- **Multiple Publishers**: Working integrations with various publisher sites
- **Custom Styling**: Publisher-specific CSS configurations
- **Performance Monitoring**: Core Web Vitals tracking
- **Revenue Tracking**: Affiliate click and conversion monitoring with proven RPM lift
- **Session Extension**: Extended user dwell time and engagement
- **Traffic Recovery**: Helping publishers recapture lost traffic from AI disruption
- **Robust, extensible search orchestration and approval system**
- **Consistent approval and feedback flows across web and Slack**
- **Canonical, collision-free S3 storage for search results**

### User Interface ✅
- **Search Display**: Platform and search index badges for clear context
- **Real-time Updates**: Status polling for pages in searching state
- **Error Handling**: Robust error handling in Slack integration
- **Information Architecture**: Clear display of search configuration and status
- **Responsive Design**: Bootstrap-based responsive UI components

### User Personalization System ✅
- **Session Tracking**: `__mula_spv` cookie tracks total pages viewed in session
- **In-View Tracking**: `__mula_ivc` cookie tracks widget visibility events (10% threshold)
- **Next Page Tracking**: `__mula_npv` cookie tracks visited articles with compact hashes
- **Adaptive Product Sorting**: Smart shuffle logic based on user engagement
  - First 2 widget views: 80% popularity-sorted, 20% random
  - 3rd+ widget views: Always shuffled for variety
- **Article Filtering**: Prevents showing previously visited next page articles
- **Cookie Management**: Centralized `Cookies.js` helper with consistent domain handling
- **Hash System**: Centralized `HashHelpers.js` with compact base36 encoding
- **Cross-Page Persistence**: All tracking persists across site navigation
- **Performance Optimized**: Minimal impact on Core Web Vitals
- **Backward Compatible**: Maintains existing `mulaNoHotItems=1` parameter behavior

### Integration Systems ✅
- **Slack Integration**: Robust approval workflow with error handling
- **Database Schema**: Comprehensive search orchestration support
- **Status Endpoints**: Lightweight status checking for real-time updates
- **Error Recovery**: Graceful handling of malformed data and edge cases
- **Impact API Integration**: Production-ready data collection for individual click and action records
- **A/B Test Data Collection**: Comprehensive attribution tracking with subId2 session values
- **Next Page Recommendations**: Complete system for article recommendations within SmartScroll widget
- **SmartScroll Density & Position Optimization**: Position Early pattern (1 article, 3 products) implemented as default when nextPage is enabled, delivering +77.93% Next Page CTR lift

## What's Left to Build

### SmartScroll Density & Position Experiment ✅ CONCLUDED
- **Status**: Experiment concluded November 9, 2025
- **Winner**: Position Early (3-1 products, position 1) - +77.93% Next Page CTR lift
- **Implementation**: Position Early pattern now default when nextPage is enabled
- **Results**: See `memory-bank/experiments/smartscroll-density-position-2025-10/experiment-results.md`
- **Code Changes**: Removed experiment logic, simplified SmartScroll to use position_early as default

### Account Model System (NEW - PLANNING PHASE)
- **Multi-Publisher Credential Management**: Comprehensive Account model for publisher groups like McClatchy
- **Default Credentials System**: Mula's default affiliate credentials for publishers without relationships
- **Site-Level Credential Overrides**: Account-level credentials with domain-specific overrides
- **Role-Based Access Control**: Mula admin users vs publisher users with granular permissions
- **Secure Credential Storage**: Encrypted credentials in database with Heroku env var decryption
- **Enhanced Search Orchestration**: Credential-scoped phraseID generation for proper affiliate attribution
- **UI Authentication System**: Login system with role-based routing and session management
- **Mula Admin Interface**: Account creation, credential management, and user assignment
- **Publisher Dashboard**: Scoped account experience with role-based permissions
- **Slack Command Authorization**: Enhanced commands with role-based permission checking

### Impact API Data Collection System ✅
- **Individual Click Records**: Successfully collecting 41+ click records with detailed attribution
- **Individual Action Records**: Successfully collecting 37+ action records with revenue data
- **Attribution Tracking**: Full support for subId1, subId2, subId3 fields
- **Session Tracking**: subId2 values present in 53% of clicks for A/B test analysis
- **Rich Metadata**: Device info, geographic data, campaign details, revenue data
- **Production Ready**: Clean, well-documented ImpactDataCollector class
- **A/B Test Integration**: Ready for variant analysis using subId2 session tracking

### SmartScroll 2x2 Factorial A/B Test ✅
- **ABTest.js Configuration**: 4-variant factorial experiment setup
- **SmartScroll Layout Variants**: Vertical card layout implementation
- **RevContent Integration**: Monetization partner integration with SubId tracking
- **Revenue Attribution System**: Multi-partner revenue tracking (Mula + RevContent)
- **Analytics Infrastructure**: Athena queries for factorial analysis
- **Testing Strategy**: Comprehensive testing and monitoring approach
- **Impact API Integration**: ✅ COMPLETED - Data collection tools ready for variant analysis
- **Experiment Conclusion**: ✅ COMPLETED - Control (c00) won, experiment concluded January 27, 2025

### Reinforcement Learning Pipeline 🚧
- **Training Data Collection**: Enhanced event data for ML training
- **Model Training**: Vowpal Wabbit integration for feed optimization
- **Feed Order Optimization**: Dynamic product ordering based on user behavior
- **Advanced A/B Testing**: Multi-variant testing and automated optimization

### Enhanced Analytics 🚧
- **Real-time Dashboards**: Live publisher performance monitoring
- **Advanced Reporting**: Comprehensive revenue and engagement analytics
- **Predictive Analytics**: User behavior prediction and optimization
- **Custom Metrics**: Publisher-specific performance indicators
- **UI for displaying/managing page-search approval status**
- **Enhanced analytics for search/approval flows**
- **Site Taxonomy Analysis**: ✅ COMPLETED - Slack command for analyzing site structure and content organization to identify high-reach sections for product targeting

### Performance Optimization 🚧
- **Advanced Caching**: Intelligent caching strategies
- **Bundle Optimization**: Further SDK size reduction
- **Load Time Optimization**: Faster component loading
- **Mobile Optimization**: Enhanced mobile performance

### Developer Experience 🚧
- **Testing Framework**: Comprehensive test coverage
- **Development Tools**: Enhanced local development environment
- **Documentation**: Complete API and integration documentation
- **Monitoring**: Production monitoring and alerting

## Current Status

### Development Phase
- **Phase**: Production-ready with ongoing optimization
- **Stability**: Core functionality stable and deployed
- **Performance**: Meeting Core Web Vitals requirements
- **Scalability**: Infrastructure supports current load
- **Database**: Successfully migrated with new search orchestration schema

### Publisher Adoption
- **Active Publishers**: Multiple publishers successfully integrated
- **Revenue Generation**: Affiliate revenue flowing through system
- **Performance Impact**: Minimal impact on publisher site performance
- **User Engagement**: Positive user interaction with product recommendations

### Technical Debt
- **Documentation**: Limited comprehensive documentation (being addressed)
- **Testing**: Minimal automated test coverage
- **Monitoring**: Basic monitoring in place, needs enhancement
- **Code Quality**: Good overall, some areas need refactoring

## Known Issues

### Performance Issues
- **Cold Starts**: Lambda functions occasionally have cold start delays
- **CDN Caching**: Some edge cases with cache invalidation
- **Bundle Size**: Approaching 20kB limit, needs optimization
- **Mobile Performance**: Some mobile devices show slower loading

### Technical Issues
- **Event Loss**: Occasional event loss during high traffic periods
- **Data Consistency**: Minor inconsistencies in analytics data
- **Error Handling**: Some edge cases not properly handled
- **Browser Compatibility**: Issues with older browser versions
- **Search ID Tracking**: Bug fixed where manifested pages weren't setting search_id (deployment pending)
- **Product Source Tracking**: Added product_src tracking from shopping_results data_source
- **No join table for page-search history (single active search per page)**
- **Approval status not yet surfaced in all UI components**

### Process Issues
- **Deployment**: Manual deployment process for some components
- **Testing**: Limited automated testing in CI/CD pipeline
- **Monitoring**: Insufficient alerting for production issues
- **Documentation**: Outdated documentation in some areas

## Evolution of Project Decisions

### Architecture Decisions
- **Initial**: Started with simple script-based approach
- **Evolution**: Moved to Svelte components for better maintainability
- **Current**: Component-based architecture with event-driven backend
- **Future**: Planning reinforcement learning integration

### Technology Decisions
- **SDK Framework**: Chose Svelte over React for smaller bundle size
- **Backend**: Express.js with PostgreSQL for simplicity and reliability
- **Infrastructure**: AWS native services for scalability and cost-effectiveness
- **Data Processing**: Event-driven pipeline for real-time capabilities
- **Database Migrations**: Sequelize CLI for version-controlled schema changes
- **Real-time Updates**: Client-side polling for immediate status feedback

### Performance Decisions
- **Bundle Size**: Strict 20kB limit to maintain Core Web Vitals
- **CDN Strategy**: CloudFront for global distribution and caching
- **Event Collection**: Base64 encoding for efficient transmission
- **Data Storage**: Partitioned S3 storage for cost optimization
- **Status Polling**: Efficient 3-second intervals with 5-minute timeout

### Search Decisions
- **Moved from phrase-based uniqueness to composite (phrase, platform, config) for search records and S3 paths**
- **Separated search approval from page-search relationship approval**
- **Added comprehensive search orchestration with platform and configuration tracking**
- **Implemented real-time status updates for better user experience**

### UI/UX Decisions
- **Information Display**: Added platform and search index badges for clear context
- **Real-time Feedback**: Status polling for immediate updates during async operations
- **Error Handling**: Robust error handling with graceful degradation
- **Consistent Design**: Bootstrap badges with consistent color coding

## Recent Achievements

### Technical Achievements
- **SDK Stability**: Core SDK components stable and performant
- **Infrastructure Reliability**: 99.9%+ uptime for critical services
- **Performance Optimization**: Meeting Core Web Vitals requirements
- **Publisher Success**: Multiple successful publisher integrations
- **Analytics Infrastructure**: Built comprehensive query development and scheduling system
- **Data Quality**: Fixed critical search_id tracking bug for better conversion analytics
- **Database Migration**: Successfully migrated database with new search orchestration schema
- **Slack Integration**: Fixed JSON parsing errors and improved error handling
- **Real-time Updates**: Implemented status polling for better user experience
- **UI Enhancements**: Added platform and search index badges for clear information display
- **Product View Tracking**: Implemented optimized single-observer pattern for efficient card view tracking
- **A/B Testing System**: Comprehensive A/B testing framework with deterministic assignment and statistical analysis
- **Impact API Integration**: Built production-ready data collection system for individual click and action records with detailed attribution tracking
- **Next Page Recommendations**: Complete article recommendations system with SmartScroll integration, Athena queries, and URL crawling

### Business Achievements
- **Revenue Generation**: Successful affiliate revenue generation with proven RPM lift
- **Publisher Retention**: High publisher satisfaction and retention
- **User Engagement**: Positive user interaction with product recommendations
- **Market Validation**: Product-market fit validated through publisher adoption
- **Industry Crisis Response**: Helping publishers fight AI disruption with AI-powered solutions
- **Session Extension**: Extended user dwell time and engagement on publisher sites

### Process Achievements
- **Monorepo Management**: Successful coordination of multiple sub-projects
- **Version Management**: Automated versioning and changelog generation
- **Deployment Pipeline**: Streamlined deployment process
- **Documentation**: Memory bank pattern implementation
- **Database Management**: Version-controlled schema changes with safe migrations
- **Error Handling**: Robust error handling across all integrations

## Upcoming Milestones

### Short Term (1-2 Months)
- **Memory Bank Completion**: Full documentation coverage
- **Testing Enhancement**: Comprehensive test coverage
- **Monitoring Improvement**: Enhanced production monitoring
- **Performance Optimization**: Further Core Web Vitals improvements
- **Deploy Recent Fixes**: Push Slack integration and UI improvements to production

### Medium Term (3-6 Months)
- **Reinforcement Learning**: Basic ML optimization implementation
- **Advanced Analytics**: Enhanced reporting and dashboards
- **Mobile Optimization**: Improved mobile performance
- **Developer Tools**: Enhanced development experience
- **Enhanced UI**: Complete approval status management interface

### Long Term (6+ Months)
- **AI/ML Integration**: Advanced machine learning capabilities
- **Platform Expansion**: Additional publisher types and markets
- **Advanced Features**: Sophisticated optimization algorithms
- **Global Scale**: International expansion and localization

## Risk Assessment

### Technical Risks
- **Performance Degradation**: Risk of Core Web Vitals impact with new features
- **Scalability Limits**: Potential infrastructure scaling challenges
- **Data Pipeline Issues**: Risk of event processing failures
- **Security Vulnerabilities**: Potential security issues in client-side code
- **Migration Failures**: Risk of database migration issues in production

### Business Risks
- **Publisher Churn**: Risk of losing key publishers
- **Revenue Dependency**: Heavy reliance on affiliate revenue
- **Competition**: Risk from competing solutions
- **Market Changes**: Changes in affiliate marketing landscape

### Mitigation Strategies
- **Performance Monitoring**: Continuous Core Web Vitals monitoring
- **Infrastructure Scaling**: Proactive infrastructure capacity planning
- **Data Backup**: Redundant data processing and storage
- **Security Audits**: Regular security reviews and updates
- **Publisher Relationships**: Strong publisher support and communication
- **Diversification**: Explore additional revenue streams
- **Innovation**: Continuous product improvement and differentiation
- **Migration Testing**: Thorough testing of database migrations before production
- **Error Handling**: Robust error handling and graceful degradation
- **Real-time Monitoring**: Immediate detection and response to issues

## Recent Technical Improvements

### Database Schema Enhancement
- **Search Orchestration**: Added comprehensive support for multi-platform search orchestration
- **Platform Tracking**: Added platform and platformConfig fields for better search context
- **Status Tracking**: Added status fields for better workflow management
- **Quality Metrics**: Added qualityScore and productCount for search evaluation
- **Migration Safety**: Version-controlled schema changes with rollback capability

### User Experience Improvements
- **Real-time Status**: Status polling provides immediate feedback during async operations
- **Information Display**: Platform and search index badges provide clear context
- **Error Handling**: Robust error handling prevents crashes and provides graceful degradation
- **Consistent UI**: Bootstrap badges with consistent color coding for better UX

### Integration Reliability
- **Slack Integration**: Fixed JSON parsing errors and improved error handling
- **Status Endpoints**: Lightweight status checking for efficient real-time updates
- **Error Recovery**: Graceful handling of malformed data and edge cases
- **Production Stability**: Improved reliability across all integrations

### Development Workflow
- **Database Migrations**: Sequelize CLI enables safe, version-controlled schema changes
- **Error Handling**: Comprehensive error handling patterns for production reliability
- **Real-time Updates**: Efficient polling architecture for better user experience
- **Information Architecture**: Clear display of system state and configuration

## 2025-01-27: Personalization & Automation System (www v2.26.0, sdk v1.38.3)

### Major Features Added
- **Smart Product Personalization**: Implemented intelligent product feed shuffling based on user engagement
  - `__mula_spv` cookie tracks session page views
  - `__mula_ivc` cookie (7 days) tracks widget visibility count
  - Users who've seen the widget multiple times get shuffled feeds instead of always seeing popular items
  - Maintains 80/20 split: 80% popularity-based, 20% random for new users

- **Next Page Article Tracking**: Prevents showing already-visited articles
  - `__mula_npv` cookie (2 days) stores compact hashes of visited article paths
  - Filters out previously visited articles from next-page recommendations
  - Uses efficient base36 hashing for compact storage

- **Automated Manifest Refresh**: Daily cron job for fresh content
  - Rebuilds next-page manifests for all active publishers daily
  - Uses `SiteTargeting` for accurate domain discovery
  - Dry-run capability for safe testing with full JSON inspection
  - Robust error handling and detailed logging

### Technical Improvements
- **Code Consolidation**: Created centralized helper modules
  - `Cookies.js`: Unified cookie management with proper domain scoping
  - `HashHelpers.js`: Centralized hashing utilities
  - Eliminated code duplication across multiple files

- **Event Handling**: Fixed race conditions in next-page click tracking
  - Moved event listeners directly into `SmartScroll` component
  - Eliminated 100ms timeout dependencies
  - More reliable event delegation

- **Cookie Consistency**: Standardized all Mula cookies
  - Proper domain scoping (`.on3.com` instead of `www.on3.com`)
  - Consistent `sameSite: 'lax'` attributes
  - Eliminated duplicate cookies across domains

### Production Deployment
- **Cron Integration**: Ready for daily automated execution
- **Database Integration**: Uses production `SiteTargeting` table for domain discovery
- **S3 Integration**: Automated manifest uploads with proper error handling
- **Monitoring**: Comprehensive logging and error reporting

## 2025-01-27: Enhanced Bot Detection & Performance Reporting (www v2.27.0, sdk v1.39.0)

### Bot Detection System
- **Comprehensive Bot Detection**: Multi-layered detection system with 40+ bot types
- **Specific Bot Identification**: Returns both detection result and specific bot name
- **Bot View Analytics**: Logs `bot_view` events with bot names for analytics
- **Modular Architecture**: Extracted bot detection into dedicated `BotDetector.js` module
- **Performance Optimized**: Early exit prevents unnecessary resource usage

### Performance Report Enhancements
- **Bot View Timeseries**: Added bot_view tracking to performance reports
- **Viewable Rate Calculations**: Added CTR calculations for store clicks, next page clicks, and topshelf in-views
- **Removed Ad Views**: Eliminated ad_views metric from performance reports
- **Enhanced Analytics**: Better insights into bot traffic and user engagement rates

### Technical Improvements
- **SQL Query Updates**: Added bot_view event tracking to PerformanceReportTimeSeries.sql
- **Worker Enhancements**: Updated performanceReportWorker.js with new metrics and CTR calculations
- **Slack Integration**: Enhanced report formatting with viewable rate percentages
- **Error Handling**: Robust bot detection with fallback to prevent false positives 