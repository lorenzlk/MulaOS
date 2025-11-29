require('dotenv').config();
const ProductAdvertisingAPIv1 = require('paapi5-nodejs-sdk');
const fs = require('fs').promises;
const path = require('path');

// ASINs to fetch
const ASINS = [
  'B001NXUYZ4',
  'B08TPCHYLW',
  'B07C5MSTFP',
  'B0CMYQBRTW',
  'B00MNV8E0C',
  'B0DRW5JT6L',
  'B0DPF5YTMN',
  'B0CS3V8M9H',
  'B0DBGXXFX5',
  'B07F246YG1',
  'B000XGIXPU',
  'B000VCFB0G',
  '3911597304',
  'B08PNVSQ62',
  '1250409888',
  'B0B2RM68G2',
  'B08D98XBX8',
  'B0D467159K',
  'B0F7HGQWK8',
  'B0BSGBM9CD',
  'B0F2YZS674',
  'B0F4D48Z5J',
  'B085VWWJJT',
  'B0FMFK2THS',
  'B0D93DG1P4',
  'B0CSFKFPTV',
  'B077F331W4',
  'B0DK26P4ZL',
  'B08KXKVT4K',
  'B0DCW42CW2',
  'B01ABVJWK6',
  'B0FBSYXKBC',
  'B0D3DVLK2F',
  'B0B51C91KN',
  'B0DN1N8WXT',
  'B0B51B68S7',
  'B0D6GHYFDP',
  'B0D6GGS66W',
  'B0D6GJ336P',
  'B0D6RFPZ99'
];

// Transform Amazon product to match expected format
const transformAmazonProduct = (item, position) => {
  const itemInfo = item.ItemInfo;
  const offers = item.Offers?.Listings?.[0];
  const images = item.Images;
  
  // Get rating if available
  const customerReviews = item.CustomerReviews;
  const rating = customerReviews?.StarRating?.DisplayValue || "4";
  const reviews = customerReviews?.TotalCount || null;

  return {
    position,
    title: itemInfo.Title?.DisplayValue || "Product Title Not Available",
    product_link: item.DetailPageURL || "",
    product_id: item.ASIN,
    source: itemInfo.ByLineInfo?.Brand?.DisplayValue || "Amazon",
    source_icon: "https://cdn.makemula.ai/amazon-icon.png",
    multiple_sources: false,
    price: offers?.Price?.DisplayAmount || "Price not available",
    extracted_price: offers?.Price?.Amount || null,
    rating: rating.toString(),
    reviews: reviews,
    extensions: [],
    thumbnail: images?.Primary?.Large?.URL || images?.Primary?.Medium?.URL || images?.Primary?.Small?.URL || "",
    thumbnails: [
      images?.Primary?.Large?.URL,
      images?.Primary?.Medium?.URL,
      images?.Primary?.Small?.URL
    ].filter(Boolean),
    tag: null,
    delivery: offers?.DeliveryInfo?.IsPrimeEligible ? "Prime Eligible" : null,
    description: itemInfo.Features?.DisplayValues?.[0] || itemInfo.ProductInfo?.ProductType?.DisplayValue || "",
    brand: itemInfo.ByLineInfo?.Brand?.DisplayValue || null,
    about_the_product: itemInfo.Features?.DisplayValues?.join(" ") || "",
    stores: [{
      name: "Amazon",
      price: offers?.Price?.DisplayAmount || "Price not available",
      link: item.DetailPageURL || ""
    }],
    data_source: "amazon_associates"
  };
};

async function fetchProductsByASINs(asins, credentials) {
  console.log(`Fetching ${asins.length} products from Amazon Associates API...`);
  
  // Initialize the API client
  const client = ProductAdvertisingAPIv1.ApiClient.instance;
  client.accessKey = credentials.accessKeyId;
  client.secretKey = credentials.secretKey;
  client.host = 'webservices.amazon.com';
  client.region = 'us-east-1';
  const api = new ProductAdvertisingAPIv1.DefaultApi();

  const allProducts = [];
  
  // Amazon API allows up to 10 ASINs per GetItems request
  const batchSize = 10;
  
  for (let i = 0; i < asins.length; i += batchSize) {
    const batch = asins.slice(i, i + batchSize);
    console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(asins.length / batchSize)}: ${batch.length} ASINs`);
    
    try {
      const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest();
      getItemsRequest['PartnerTag'] = credentials.accountId;
      getItemsRequest['PartnerType'] = 'Associates';
      getItemsRequest['ItemIds'] = batch;
      getItemsRequest['Resources'] = [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price',
        'Images.Primary.Medium',
        'Images.Primary.Large',
        'CustomerReviews.StarRating'
      ];

      const response = await new Promise((resolve, reject) => {
        const callback = function(error, data, response) {
          if (error) {
            console.error(`  ✗ API error:`, error.message);
            if (error.response) {
              console.error(`  Response:`, JSON.stringify(error.response, null, 2));
            }
            reject(error);
          } else {
            const getItemsResponse = ProductAdvertisingAPIv1.GetItemsResponse.constructFromObject(data);
            resolve(getItemsResponse);
          }
        };
        api.getItems(getItemsRequest, callback);
      });
      
      if (response.ItemsResult?.Items) {
        const items = response.ItemsResult.Items;
        console.log(`  ✓ Successfully fetched ${items.length} products`);
        
        items.forEach((item, idx) => {
          const position = i + idx + 1;
          const transformed = transformAmazonProduct(item, position);
          allProducts.push(transformed);
        });
      } else {
        console.log(`  ⚠ No items returned for this batch`);
        if (response.Errors) {
          console.log(`  Errors:`, response.Errors);
        }
      }
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < asins.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`  ✗ Error fetching batch:`, error.message);
      if (error.response) {
        console.error(`  Response:`, JSON.stringify(error.response, null, 2));
      }
    }
  }
  
  return allProducts;
}

async function main() {
  // Get credentials from environment
  const credentials = {
    accessKeyId: process.env.MCCLATCHY_AMAZON_ASSOC_ACCESS_KEY_ID,
    secretKey: process.env.MCCLATCHY_AMAZON_ASSOC_SECRET_KEY,
    accountId: process.env.MCCLATCHY_AMAZON_ASSOC_ACCOUNT_ID
  };

  if (!credentials.accessKeyId || !credentials.secretKey || !credentials.accountId) {
    console.error('Error: Missing Amazon Associates credentials in .env file');
    console.error('Required:');
    console.error('  MCCLATCHY_AMAZON_ASSOC_ACCESS_KEY_ID');
    console.error('  MCCLATCHY_AMAZON_ASSOC_SECRET_KEY');
    console.error('  MCCLATCHY_AMAZON_ASSOC_ACCOUNT_ID');
    process.exit(1);
  }

  console.log('Using McClatchy Amazon Associates credentials');
  console.log(`Account ID: ${credentials.accountId}`);
  console.log(`Access Key: ${credentials.accessKeyId.substring(0, 4)}...${credentials.accessKeyId.substring(credentials.accessKeyId.length - 4)}`);
  console.log('');

  // Fetch products
  const products = await fetchProductsByASINs(ASINS, credentials);

  if (products.length === 0) {
    console.error('No products were fetched. Exiting.');
    process.exit(1);
  }

  // Create the output structure matching the schema
  const output = {
    shopping_results: products,
    productCount: products.length,
    qualityScore: 0.5,
    platform: "amazon",
    searchIndex: "FashionWomen",
    indexOptimized: true
  };

  // Ensure directory exists - path relative to www.makemula.ai
  const outputDir = path.join(__dirname, '..', '..', 'sdk.makemula.ai', 'svelte-components', 'usmagazine.com');
  await fs.mkdir(outputDir, { recursive: true });

  // Write to file
  const outputPath = path.join(outputDir, 'fallback.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));

  console.log('');
  console.log(`✅ Successfully created fallback.json`);
  console.log(`   Location: ${outputPath}`);
  console.log(`   Products: ${products.length}/${ASINS.length}`);
  console.log('');
  
  // Show summary
  const successful = products.length;
  const failed = ASINS.length - successful;
  if (failed > 0) {
    console.log(`⚠️  ${failed} ASIN(s) could not be fetched.`);
    const fetchedAsins = new Set(products.map(p => p.product_id));
    const missingAsins = ASINS.filter(asin => !fetchedAsins.has(asin));
    console.log(`   Missing ASINs: ${missingAsins.join(', ')}`);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

