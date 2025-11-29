# mula

This mono-repo contains the following sub-repos:

1. cloud.makemula.ai - cloud hosting infrastructure-as-code scripts
2. sdk.makemula.ai - publisher installable client-side SDK
3. www.makemula.ai - product marketing site, portal and back-end jobs
4. mobile-listicle-prototype - a host of UX prototypes used as inspiration for things we launch in sdk.makemula.ai
5. simulators - tools to help measure the impact of sdk.makemula.ai on core web vitals

## cloud.makemula.ai

Currently, all infrastructure is hosted on AWS. Contact kale.mcnaney@offlinestudio.com for more information.

There are 2 Cloudfront distributions: cdn.makemula.ai & beacon.makemula.ai.

### cdn.makemula.ai

This endpoint is backed by the prod.makemula.ai S3 bucket. Content here is PUBLIC READ so be careful what you publish. This endpoint is optimized to serve high availability, high throughput for the following assets:

1. mula client-side javascript sdk
2. JSON resources consumed by the mula client-side javascript sdk

### beacon.makemula.ai

This is a logging endpoint responsible for collecting web visitor events like page impressions & scroll events. 

The endpoint functions via a phantom 1x1 tracking pixel and expects base64-encoded JSON objects to be passed via the query string and waterfalls them through a Kinesis Firehose -> Lambda Function -> S3 ETL process meant to be processed later by Athena queries. The resulting S3 files are partitioned by yyyy/mm/dd/hh for efficient-enough querying.

See [SDK's Logger](./sdk.makemula.ai/svelte-components/src/lib/Logger.js) for an example of how the client sends logging data to this endpoint.

## sdk.makemula.ai

This is the publisher-installable javascript SDK written in [Svelte 3](https://devdocs.io/svelte~3/). It is responsible for 

Its important that it remains incredibly light-weight (< 20 kB gzipped) and has minimal impact on Core Web Vitals.

## www.makemula.ai

This is currently mula's public facing product marketing site, publisher portal & back-end worker functionality responsible for "mula-izing" pages on publisher sites.

### Slack Commands

The platform includes comprehensive Slack commands for monitoring, management, and analytics:

#### Core Management
- `/mula-health-check <domain>` - Check health status of a domain
- `/mulaize <URL>` - Create a page and trigger product recommendation workflow
- `/mula-remulaize <URL>` - Force new search for an existing page

#### Performance & Analytics
- `/mula-performance-report [domains|network] [days]` - Generate performance reports with time series charts
- `/mula-product-performance [days]` - Show most viewed and clicked products
- `/mula-engagement-report [domain] [days]` - Generate engagement analytics reports
- `/mula-click-urls <domain> [days]` - Analyze click URLs and traffic patterns

#### Search & Content Analysis
- `/mula-site-search <domain> [lookback_days]` - Analyze search phrase traffic by domain with top URLs
- `/mula-site-taxonomy <domain> <lookback_days>` - Analyze site structure and content organization
- `/mula-ab-test-performance [--days-back N] [--experiment name]` - Generate A/B test performance reports

#### Site Targeting & Management
- `/mula-site-targeting-add <domain> <targeting_type> <targeting_value> <search_phrase>` - Add site targeting rules
- `/mula-site-targeting-list [domain]` - List site targeting rules
- `/mula-site-targeting-rm <targeting_id>` - Remove site targeting rule

#### Domain & Channel Management
- `/mula-domain-channels-add <domain> [displayName]` - Add domain-channel mapping
- `/mula-domain-channels-list` - List all domain-channel mappings
- `/mula-domain-channels-rm <domain>` - Remove domain-channel mapping

#### Revenue & Affiliate Analytics
- `/mula-impact-on3-subid-report [--days-back N] [--mula-only]` - Generate subid performance reports from Impact API

### Key Features

- **Product Recommendation Engine**: AI-powered product recommendations for publisher content
- **Performance Analytics**: Comprehensive analytics and reporting system
- **A/B Testing Framework**: Built-in A/B testing for widget optimization
- **Multi-Platform Search**: Support for Amazon Associates and Fanatics affiliate catalogs
- **Real-time Monitoring**: Health checks and performance monitoring
- **Slack Integration**: Complete Slack workflow for approvals and reporting