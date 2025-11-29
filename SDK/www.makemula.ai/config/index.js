const config = {
  amazon: {
    host: 'webservices.amazon.com',
    region: 'us-east-1',
    retries: 3,
    pageSize: 10,
    minRating: 4,
    pagesToFetch: 4
  },
  openai: {
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.7
  },
  storage: {
    cacheControl: 'public, s-maxage=3600, no-cache, must-revalidate, max-age=0',
    cloudfrontDistributionId: 'E1RRG9TJNFNES4'
  },
  serpapi: {
    location: 'United States',
    language: 'en',
    country: 'us'
  },
  impact: {
    baseUrl: 'https://api.impact.com/Mediapartners',
    accountId: process.env.IMPACT_ACCOUNT_ID || 'IRVS6cDH8DnE3783091LoyPwNc8YkkMTF1',
    username: process.env.IMPACT_USERNAME,
    password: process.env.IMPACT_PASSWORD,
    catalogId: process.env.IMPACT_CATALOG_ID || 'Catalogs/ItemSearch',
    retries: 3,
    pageSize: 100,
    maxPages: 1
  },
  crawler: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000
  },
  grafana: {
    url: 'https://g-e844782f82.grafana-workspace.us-east-1.amazonaws.com',
    apiKey: process.env.GRAFANA_API_KEY,
    dashboardUid: 'aez8t5wxrwkqof'
  }
};

module.exports = config; 