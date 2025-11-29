# Fanatics Integration with Impact API

## Overview

The Fanatics integration uses the Impact API to search for sports merchandise products from the Fanatics affiliate catalog. This integration is specifically targeted for on3.com domains.

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Impact API Credentials
IMPACT_ACCOUNT_ID=IRVS6cDH8DnE3783091LoyPwNc8YkkMTF1
IMPACT_USERNAME=your_impact_username
IMPACT_PASSWORD=your_impact_password
IMPACT_CATALOG_ID=Catalogs/ItemSearch
```

### API Configuration

The Impact API configuration is defined in `config/index.js`:

```javascript
impact: {
  baseUrl: 'https://api.impact.com/Mediapartners',
  accountId: process.env.IMPACT_ACCOUNT_ID || 'IRVS6cDH8DnE3783091LoyPwNc8YkkMTF1',
  username: process.env.IMPACT_USERNAME,
  password: process.env.IMPACT_PASSWORD,
  catalogId: process.env.IMPACT_CATALOG_ID || 'Catalogs/ItemSearch',
  retries: 3,
  pageSize: 100,
  maxPages: 1
}
```

## Domain Targeting

The Fanatics strategy is automatically selected for the following domains:
- `on3.com`
- `www.on3.com`

For all other domains, the system defaults to Amazon.

## Search Categories

The Fanatics strategy supports the following search categories:

- **All**: All Categories
- **Apparel**: Apparel & Accessories
- **Jerseys**: Jerseys
- **Hats**: Hats & Caps
- **Footwear**: Footwear
- **Collectibles**: Collectibles & Memorabilia
- **Home**: Home & Office
- **Kids**: Kids & Youth
- **Women**: Women
- **Men**: Men
- **Sports**: Sports Equipment
- **Team**: Team Specific
- **College**: College Sports
- **NFL**: NFL
- **NBA**: NBA
- **MLB**: MLB
- **NHL**: NHL
- **Soccer**: Soccer

## API Endpoint

The integration uses the Impact API Search Catalog Items endpoint:

```
GET https://api.impact.com/Mediapartners/{accountId}/Catalogs/ItemSearch
```

### Parameters

- `Keyword`: Search keywords
- `Page`: Page number (default: 1)
- `PageSize`: Number of items per page (default: 100)

### Authentication

Uses Basic Authentication with Impact username and password.

## Product Transformation

Fanatics products are transformed to match the standard Mula product format:

```javascript
{
  position: 1,
  title: "Product Title",
  product_link: "https://fanatics.com/product",
  product_id: "fanatics-123",
  source: "Fanatics",
  source_icon: "https://cdn.makemula.ai/fanatics-icon.png",
  price: "$29.99",
  thumbnail: "https://fanatics.com/image.jpg",
  data_source: "fanatics_impact"
}
```

## Usage

The Fanatics strategy is automatically used when:

1. A page from on3.com is processed
2. The search orchestrator determines the appropriate platform based on domain
3. The `FanaticsSearchStrategy` is selected and executed

## Testing

To test the integration:

1. Ensure environment variables are set
2. Process a page from on3.com
3. Verify that Fanatics products are returned
4. Check that products are properly transformed and stored in S3

## Error Handling

The integration includes:
- Retry logic for failed API calls
- Fallback to default category if LLM selection fails
- Graceful error handling with logging
- Rate limiting protection (1 second delay between requests)

## Monitoring

Monitor the integration through:
- Application logs with `FanaticsSearchStrategy` prefix
- Search orchestration logs
- S3 storage of search results
- Slack notifications for search completion 