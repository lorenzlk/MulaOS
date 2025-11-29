# Tech Context: Mula

## Technology Stack

### Frontend (SDK)
- **Framework**: Svelte 3
- **Build Tool**: Vite
- **Bundler**: Gulp (for production builds)
- **Styling**: CSS with global styles
- **Package Manager**: npm with workspaces
- **AI Integration**: AI-powered monetization and content optimization

### Backend (www.makemula.ai)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Template Engine**: Handlebars
- **Database**: PostgreSQL with Sequelize ORM
- **Queue System**: Bull (Redis-based)
- **Package Manager**: npm

### Cloud Infrastructure (AWS)
- **CDN**: CloudFront
- **Storage**: S3
- **Data Processing**: Kinesis Firehose, Lambda
- **Analytics**: Athena
- **Compute**: Lambda (serverless)
- **Monitoring**: CloudWatch

### AI Agent Infrastructure (Heroku)
- **AI Agents**: Slack slash commands executing against Heroku backend
- **Agent Processing**: Node.js-based agent execution on Heroku platform
- **Human-in-the-Loop**: Slack integration for agent oversight and approval

### A/B Testing Infrastructure
- **Experiment Framework**: Custom ABTest.js with factorial design support
- **Revenue Attribution**: Multi-partner tracking (Impact API + RevContent API)
- **Statistical Analysis**: Chi-square tests, ANOVA, factorial analysis
- **Domain Filtering**: Publisher-specific experiment targeting

**MIGRATION STATUS**: Currently planning migration to new AWS account under makemula.ai business entity. See `memory-bank/aws-account-migration-plan.md` for complete migration strategy.

### Development Tools
- **Version Control**: Git
- **CI/CD**: CircleCI
- **Deployment**: Heroku (backend), AWS (infrastructure)
- **Package Management**: npm workspaces
- **Code Quality**: ESLint, Prettier

## Development Setup

### Prerequisites
- Node.js (version specified in package.json)
- PostgreSQL (local installation)
- AWS CLI (for infrastructure management)
- Git

### Environment Variables

#### SDK Development
```bash
# sdk.makemula.ai/.env
SDK_ENVIRONMENT=development
LOG_LEVEL=1
CDN_HOST=https://cdn.makemula.ai
```

#### Backend Development
```bash
# www.makemula.ai/.env
DATABASE_URL=postgresql://localhost/mula
OPENAI_API_KEY=your_openai_key
SERPAPI_API_KEY=your_serpapi_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
```

#### Backend Production (Heroku)
```bash
# Heroku config vars for www-makemula-ai
DATABASE_URL=postgres://... (Heroku PostgreSQL addon)
OPENAI_API_KEY=your_openai_key
SERPAPI_API_KEY=your_serpapi_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
SLACK_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
REDISCLOUD_URL=redis://... (Heroku Redis addon)
```

### Local Development Commands

#### SDK
```bash
cd sdk.makemula.ai
npm install
cd svelte-components
npm run dev  # Starts development server on :3000
```

#### Backend
```bash
cd www.makemula.ai
npm install
npm start  # Starts server on :3010
```

#### Infrastructure
```bash
cd cloud.makemula.ai
# AWS CLI commands for infrastructure management
```

## Technical Constraints

### Performance Constraints
- **SDK Size**: Must remain < 20 kB gzipped
- **Load Time**: Minimal impact on page load performance
- **Core Web Vitals**: Must not negatively impact LCP, FID, CLS
- **CDN Performance**: Sub-100ms response times globally
- **Revenue Impact**: Must deliver measurable RPM lift and revenue per session improvement
- **Session Extension**: Must extend user dwell time and engagement

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Support**: iOS Safari, Chrome Mobile
- **JavaScript**: ES6+ support required
- **CSS**: Flexbox and Grid support required

### Infrastructure Constraints
- **AWS Region**: Primary deployment in us-east-1
- **S3 Storage**: Cost-optimized partitioning strategy
- **Lambda Limits**: 15-minute execution timeout
- **CloudFront**: Global distribution with edge caching

### Data Constraints
- **Event Volume**: High-throughput event collection
- **Storage Costs**: Partitioned S3 storage for cost efficiency
- **Query Performance**: Athena queries optimized for common patterns
- **Data Retention**: Configurable retention policies

## Dependencies

### SDK Dependencies
```json
{
  "svelte": "^3.x",
  "vite": "^4.x",
  "gulp": "^5.0.0",
  "gulp-minify": "^3.1.0",
  "gulp-mustache": "^5.0.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.21.2",
  "sequelize": "^6.37.5",
  "pg": "^8.13.1",
  "bull": "^4.16.5",
  "openai": "^4.78.1",
  "serpapi": "^2.1.0",
  "aws-sdk": "^2.1692.0",
  "puppeteer": "^24.1.1"
}
```

### Infrastructure Dependencies
- AWS SDK v2
- CloudFormation templates
- Lambda functions (Node.js runtime)
- Kinesis Firehose configurations

## Tool Usage Patterns

### Build Process
1. **SDK Development**: `npm run dev` in svelte-components
2. **SDK Production**: `npm run build` (gulp + vite)
3. **Backend Development**: `npm start`
4. **Infrastructure**: AWS CLI + CloudFormation

### Testing Strategy
- **Unit Tests**: Component-level testing (minimal coverage)
- **Integration Tests**: End-to-end publisher integration
- **Performance Tests**: Core Web Vitals monitoring
- **Load Tests**: Event collection and processing

### Deployment Process
1. **SDK**: Version bump → Build → Deploy to CDN
2. **Backend**: Git push → Heroku auto-deploy (`www-makemula-ai`)
3. **Infrastructure**: Manual AWS CLI deployment
4. **Data Pipeline**: Continuous processing via Lambda
5. **Database Migrations**: `heroku run npx sequelize-cli db:migrate -a www-makemula-ai`

### Monitoring and Logging
- **Application Logs**: Winston/console logging
- **Performance Monitoring**: Core Web Vitals tracking
- **Error Tracking**: Custom error collection
- **Infrastructure Monitoring**: CloudWatch metrics

## Development Workflow

### Feature Development
1. **Branch Strategy**: Feature branches from main
2. **Code Review**: Pull request workflow
3. **Testing**: Manual testing in development environment
4. **Deployment**: Staging → Production pipeline

### Version Management
- **SDK Versioning**: Semantic versioning with auto-changelog
- **Backend Versioning**: Semantic versioning
- **Infrastructure Versioning**: CloudFormation stack versions
- **Release Process**: Automated changelog generation

### Data Management
- **Migrations**: Sequelize migrations for database changes
- **Seeding**: Development data seeding scripts
- **Backup**: Automated S3 backup strategies
- **Archival**: Cost-effective data archival policies

### Approval and Feedback
- **Search Relationship**: Pages have a searchIdStatus field to track approval
- **Search Records**: Immutable and keyed by a composite hash

## Operational Infrastructure

### Multi-Credential Management System
**Credential Resolution** (`config/credentials.js`):
- **Centralized Configuration**: Single source of truth for all credentials
- **Dynamic Discovery**: UI and Slack commands auto-discover available credentials
- **Platform Mapping**: Automatic platform detection (Amazon, Impact, Google Shopping)
- **Publisher-Specific**: Support for McClatchy, ON3, and default Mula credentials

**Credential Types**:
- `default` - Default (Mula) Amazon Associates
- `mcclatchy` - McClatchy Amazon Associates  
- `on3` - ON3 (Impact API for Fanatics)

**Environment Variables**:
```bash
# McClatchy Credentials
MCCLATCHY_AMAZON_ASSOC_ACCESS_KEY_ID=...
MCCLATCHY_AMAZON_ASSOC_SECRET_KEY=...
MCCLATCHY_AMAZON_ASSOC_ACCOUNT_ID=...

# ON3 Impact Credentials
ON3_IMPACT_USERNAME=...
ON3_IMPACT_PASSWORD=...
ON3_IMPACT_ACCOUNT_ID=...
```

### Slack Integration Architecture

**Signature Verification**:
- HMAC SHA-256 signature validation
- 5-minute timestamp window
- Raw body preservation for verification
- Secure signing secret management

**Natural Language Processing**:
- `@MulaBot` mentions trigger NLP parsing
- OpenAI-powered intent extraction
- Clarification loop for ambiguous requests
- Mapping to slash command format

**18+ Slash Commands**:
1. `/mulaize` - Create page + trigger product search
2. `/mula-remulaize` - Force fresh search
3. `/mula-performance-report` - KPI dashboard (network-wide support)
4. `/mula-product-performance` - SKU-level metrics
5. `/mula-engagement-report` - Cohort analysis
6. `/mula-site-taxonomy` - Content categorization
7. `/mula-site-targeting-add/list/rm` - Dynamic placement rules
8. `/mula-next-page-targeting-*` - SmartScroll article recommendations
9. `/mula-click-urls` - Click attribution
10. `/mula-site-search` - Internal search analysis
11. `/mula-ab-test-performance` - A/B test results
12. `/mula-impact-on3-subid-report` - Affiliate revenue
13. `/mula-health-check` - Site health monitoring
14. `/mula-domain-channels-*` - Domain-channel mappings

**Human-in-the-Loop Workflows**:
- Product approval via Slack buttons (approve/reject)
- Feedback modal for rejection reasons
- Search approval for site targeting
- Real-time status updates

### Monitoring & Observability

**Grafana Real-Time Dashboard**:
- **Data Flow**: CloudWatch Metrics → Grafana
- **Lambda Integration**: Direct metric publishing from beacon transformer
- **Custom Metrics**: Namespace "Mula/SearchPhrases" with Host/SearchPhrase dimensions
- **Dashboard URL**: `https://g-e844782f82.grafana-workspace.us-east-1.amazonaws.com`
- **Refresh**: 30-second auto-refresh
- **Auto-Discovery**: Script to add new search phrases dynamically

**CloudWatch Custom Metrics**:
- Search phrase view counts by host
- Real-time widget view tracking
- Bot detection metrics
- Performance monitoring

**VPC Endpoint**:
- CloudWatch VPC endpoint for Lambda connectivity
- Enables metrics publishing from VPC-bound functions

### Revenue Collection System

**Backfill Infrastructure** (`scripts/backfill-revenue-data.js`):
- Manual revenue collection for historical data
- **Platforms**: `impact`, `amazon_associates`, `other`
- **Chunking**: Breaks large date ranges into manageable pieces
- **Job Queue**: Bull queue + Postgres job tracking
- **Retry Logic**: 3 max retries with exponential backoff

**Usage**:
```bash
# Single date range
node scripts/backfill-revenue-data.js www.on3.com impact 2025-09-01 2025-11-16

# With chunking (recommended for large ranges)
node scripts/backfill-revenue-data.js www.on3.com impact 2025-09-01 2025-11-16 --chunk-days 30
```

**Job Tracking**:
- `RevenueCollectionJob` model tracks status
- Worker processes jobs asynchronously
- Detailed logging for monitoring

### Operational Scripts

**API Integration Testing**:
- `scripts/check-api-endpoints.js` - Tests 13+ Impact API endpoints
- Validates authentication and connectivity
- Rate limiting aware (1 second delays)

**Database Management**:
- `scripts/check-db-schema.js` - Schema inspection and validation
- Sequelize migration management
- Constraint and index verification

**Grafana Automation**:
- `scripts/update-grafana-dashboard.js` - Auto-updates dashboards
- Fetches search phrases from database
- Creates/updates dashboard panels
- Syncs targeting records to monitoring

**Cron Configuration** (`scripts/cron-example.txt`):
- Heroku Scheduler (recommended)
- System cron for VPS deployments
- Docker cron for containerized setups
- AWS EventBridge for Lambda/ECS

### Multi-Tenancy & Permissions

**Domain-Based Access Control**:
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
- `viewer` - Read-only access to domain data
- `editor` - Can create searches, approve products

**Publisher Examples**:
- `www.brit.co` → `jemal@brit.co`, `matt@brit.co` (viewers)
- `www.on3.com` → `logan.lorenz@gmail.com` (editor)

**SQL Management**:
- `scripts/add-domain-permission.sql` - Add user permissions
- `scripts/add-brit-co-permissions.sql` - Bulk permission grants

## Security Considerations

### Authentication
- **Publisher Portal**: Basic auth for admin access
- **API Security**: Rate limiting and input validation
- **CDN Security**: HTTPS-only delivery
- **Data Encryption**: S3 encryption at rest
- **Slack Verification**: HMAC SHA-256 signature validation
- **Credential Storage**: Environment variable-based credential management

### Data Privacy
- **Event Anonymization**: PII removal in data pipeline
- **Publisher Isolation**: Data segregation by publisher
- **Access Controls**: Role-based access to analytics and domain data
- **Compliance**: GDPR and CCPA considerations
- **Multi-Tenancy**: Domain-level permission boundaries

## Performance Optimization

### Frontend Optimization
- **Bundle Splitting**: Code splitting for lazy loading
- **Tree Shaking**: Unused code elimination
- **Minification**: CSS and JS minification
- **Caching**: Aggressive CDN caching strategies

### Backend Optimization
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis-based caching layer
- **Async Processing**: Background job processing

### Infrastructure Optimization
- **CDN Caching**: Edge caching for static assets
- **Lambda Optimization**: Cold start mitigation
- **S3 Optimization**: Intelligent tiering and lifecycle policies
- **Cost Optimization**: Reserved instances and spot pricing 