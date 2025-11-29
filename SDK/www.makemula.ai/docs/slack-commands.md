# Slack Commands

This document describes the available Slack commands for the Mula platform.

## A/B Test Performance Command

### `/mula-ab-test-performance`

Generates and sends a SmartScroll A/B test performance report to the channel where the command was executed.

#### Usage

```
/mula-ab-test-performance [options]
```

#### Options

- `--days-back <number>` - Number of days to look back (default: 7, max: 365)
- `--experiment <name>` - Experiment name (default: 'smartscroll_button_variant')
- `--use-cached` or `--cached` - Use cached results instead of running new query

#### Examples

```
/mula-ab-test-performance
/mula-ab-test-performance --days-back 14
/mula-ab-test-performance --experiment my_custom_experiment
/mula-ab-test-performance --days-back 30 --use-cached
```

#### Response

The command will:
1. Immediately respond with a confirmation message
2. Generate the A/B test performance report
3. Send the detailed report to the channel where the command was executed

## Site Taxonomy Analysis Command

### `/mula-site-taxonomy`

Analyzes the structure and content organization of a website to identify high-reach sections and taxonomical areas for product targeting. This command helps merchandisers understand site organization and discover opportunities for targeted product recommendations.

#### Usage

```
/mula-site-taxonomy <domain> <lookback_days>
```

#### Parameters

- `domain` - The domain to analyze (e.g., `harpersbazaar.com`, `www.stylecaster.com`)
- `lookback_days` - Number of days to look back for data analysis (e.g., `7`, `30`)

#### Examples

```
/mula-site-taxonomy harpersbazaar.com 30
/mula-site-taxonomy www.stylecaster.com 7
/mula-site-taxonomy fashionista.com 14
```

#### What It Analyzes

1. **URL Path Taxonomy**: Extracts up to 3 levels of meaningful URL structure (e.g., `/fashion/trends/2024/`)
2. **Content Categories**: Leverages JSON-LD `article_section` data parsed by the Mula Bootloader
3. **Page View Metrics**: Counts page views per taxonomy category to identify high-traffic areas
4. **Targeting Opportunities**: Highlights sections with high reach for product merchandising

#### Sample Output

```
🏛️ *Site Taxonomy Analysis for harpersbazaar.com (30 days)*

📁 *URL Path Structure:*
• /fashion/trends/ (12.4K views)
  └── /fashion/trends/2024/ (8.1K views)
  └── /fashion/trends/fall/ (4.3K views)
• /beauty/ (9.8K views)
  └── /beauty/skincare/ (6.2K views)
  └── /beauty/makeup/ (3.6K views)

🏷️ *Content Categories (JSON-LD):*
• Fashion & Style (15.2K views)
• Beauty & Wellness (9.8K views)
• Celebrity & Entertainment (7.1K views)

🎯 *Top Product Targeting Opportunities:*
• /fashion/trends/2024/ - High reach, fashion-forward audience
• /beauty/skincare/ - Engaged beauty consumers
```

#### Use Cases

- **Content Strategy**: Understand how content is organized and which sections get the most traffic
- **Product Targeting**: Identify high-reach sections for targeted product recommendations
- **SEO Insights**: Discover content categories that resonate with audiences
- **Merchandising**: Build product lists tailored to specific site sections
- **Competitive Analysis**: Compare taxonomy structure across similar sites

#### Response

The command will:
1. Immediately respond with a confirmation message
2. Queue the taxonomy analysis job
3. Send the detailed taxonomy report to the channel when complete

## Click URLs Command

### `/mula-click-urls`

Returns the top 20 URLs on a specific domain that received mula_store_click events during the lookback window. This helps identify which pages are generating the most store clicks.

#### Usage

```
/mula-click-urls <domain> [days_back]
```

#### Parameters

- `domain` - The domain to analyze (e.g., `www.on3.com`, `harpersbazaar.com`)
- `days_back` (optional) - Number of days to look back (default: 7, max: 365)

#### Examples

```
/mula-click-urls www.on3.com
/mula-click-urls www.on3.com 30
/mula-click-urls harpersbazaar.com 14
```

#### Response

The command will:
1. Immediately respond with a confirmation message
2. Queue the click URLs analysis job
3. Send the detailed report to the channel when complete

## Other Available Commands

- `/mula-health-check` - Check the health of a website
- `/mula-performance-report` - Generate performance reports
- `/mula-mulaize` - Create page and trigger product recommendations
- `/mula-product-performance` - Generate product performance reports
- `/mula-remulaize` - Force new search for a page
- `/mula-domain-channels-add` - Add domain-channel mapping
- `/mula-domain-channels-list` - List domain-channel mappings
- `/mula-domain-channels-rm` - Remove domain-channel mapping 