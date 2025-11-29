require('dotenv').config();
const ProductAdvertisingAPIv1 = require('paapi5-nodejs-sdk');

// Initialize the API client
const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;

// Specify your credentials here. These are used to create and sign the request.
defaultClient.accessKey = process.env.MULA_AMAZON_ASSOC_ACCESS_KEY_ID;
defaultClient.secretKey = process.env.MULA_AMAZON_ASSOC_SECRET_KEY;

/**
 * Specify Host and Region to which you want to send the request to.
 * For more details refer:
 * https://webservices.amazon.com/paapi5/documentation/common-request-parameters.html#host-and-region
 */
defaultClient.host = 'webservices.amazon.com';
defaultClient.region = 'us-east-1';

const api = new ProductAdvertisingAPIv1.DefaultApi();

/**
 * The following is a sample request for SearchItems operation.
 * For more information on Product Advertising API 5.0 Operations,
 * refer: https://webservices.amazon.com/paapi5/documentation/operations.html
 */
const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();

/** Enter your partner tag (store/tracking id) and partner type */
searchItemsRequest['PartnerTag'] = process.env.MULA_AMAZON_ASSOC_ACCOUNT_ID;
searchItemsRequest['PartnerType'] = 'Associates';

// Specify search keywords
searchItemsRequest['Keywords'] = 'trendy sunglasses';

/**
 * Specify the category in which search request is to be made.
 * For more details, refer:
 * https://webservices.amazon.com/paapi5/documentation/use-cases/organization-of-items-on-amazon/search-index.html
 */
searchItemsRequest['SearchIndex'] = 'All';

// Specify the number of items to be returned in search result
searchItemsRequest['ItemCount'] = 10;

// Filter for products with 4+ star ratings
searchItemsRequest['MinReviewsRating'] = 4;

/**
 * Choose resources you want from SearchItemsResource enum
 * For more details, refer: https://webservices.amazon.com/paapi5/documentation/search-items.html#resources-parameter
 */
searchItemsRequest['Resources'] = [
    'ItemInfo.Title',
    'ItemInfo.Features',
    'ItemInfo.ProductInfo',
    'ItemInfo.TechnicalInfo',
    'ItemInfo.ByLineInfo',
    'Offers.Listings.Price',
    'Images.Primary.Medium',
    'Images.Primary.Large',
    'CustomerReviews.StarRating'
];

// Function to search for a specific page
function searchPage(pageNumber) {
    return new Promise((resolve, reject) => {
        searchItemsRequest['ItemPage'] = pageNumber;
        
        const callback = function(error, data, response) {
            if (error) {
                console.log(`Error calling PA-API 5.0 for page ${pageNumber}!`);
                console.log('Printing Full Error Object:\n' + JSON.stringify(error, null, 1));
                console.log('Status Code: ' + error['status']);
                if (error['response'] !== undefined && error['response']['text'] !== undefined) {
                    console.log('Error Object: ' + JSON.stringify(error['response']['text'], null, 1));
                }
                reject(error);
            } else {
                console.log(`API called successfully for page ${pageNumber}.`);
                const searchItemsResponse = ProductAdvertisingAPIv1.SearchItemsResponse.constructFromObject(data);
                resolve(searchItemsResponse);
            }
        };

        try {
            api.searchItems(searchItemsRequest, callback);
        } catch (ex) {
            console.log('Exception: ' + ex);
            reject(ex);
        }
    });
}

// Function to process search results
function processResults(searchItemsResponse) {
    if (searchItemsResponse['SearchResult'] !== undefined) {
        searchItemsResponse['SearchResult']['Items'].forEach((item, index) => {
            console.log(`\n${index + 1}. ${item['ItemInfo']['Title']['DisplayValue']}`);
            
            // Display ByLineInfo if available
            if (item['ItemInfo']['ByLineInfo']) {
                if (item['ItemInfo']['ByLineInfo']['Brand']) {
                    console.log(`Brand: ${item['ItemInfo']['ByLineInfo']['Brand']['DisplayValue']}`);
                }
                if (item['ItemInfo']['ByLineInfo']['Manufacturer']) {
                    console.log(`Manufacturer: ${item['ItemInfo']['ByLineInfo']['Manufacturer']['DisplayValue']}`);
                }
            }

            // Display ProductInfo if available
            if (item['ItemInfo']['ProductInfo']) {
                if (item['ItemInfo']['ProductInfo']['ProductType']) {
                    console.log(`Product Type: ${item['ItemInfo']['ProductInfo']['ProductType']['DisplayValue']}`);
                }
                if (item['ItemInfo']['ProductInfo']['Color']) {
                    console.log(`Color: ${item['ItemInfo']['ProductInfo']['Color']['DisplayValue']}`);
                }
                if (item['ItemInfo']['ProductInfo']['Size']) {
                    console.log(`Size: ${item['ItemInfo']['ProductInfo']['Size']['DisplayValue']}`);
                }
            }

            // Display TechnicalInfo if available
            if (item['ItemInfo']['TechnicalInfo']) {
                if (item['ItemInfo']['TechnicalInfo']['Specifications']) {
                    console.log('Specifications:');
                    item['ItemInfo']['TechnicalInfo']['Specifications'].forEach(spec => {
                        console.log(`  ${spec['Name']}: ${spec['Value']}`);
                    });
                }
            }

            if (item['Offers'] && item['Offers']['Listings'] && item['Offers']['Listings'][0]['Price']) {
                console.log(`Price: ${item['Offers']['Listings'][0]['Price']['DisplayAmount']}`);
            }
            if (item['CustomerReviews'] && item['CustomerReviews']['StarRating']) {
                console.log(`Rating: ${item['CustomerReviews']['StarRating']} stars`);
            }
            if (item['Images'] && item['Images']['Primary'] && item['Images']['Primary']['Large']) {
                console.log(`Image URL: ${item['Images']['Primary']['Large']['URL']}`);
            }
            console.log(`URL: ${item['DetailPageURL']}`);
            console.log('----------------------------------------');
        });
    }

    if (searchItemsResponse['Errors'] !== undefined) {
        console.log('\nErrors:');
        searchItemsResponse['Errors'].forEach(error => {
            console.log(`Error Code: ${error['Code']}`);
            console.log(`Error Message: ${error['Message']}`);
        });
    }
}

// Main function to search all pages
async function searchAllPages() {
    try {
        console.log('Searching for trendy sunglasses with 4+ star ratings...\n');
        
        for (let page = 1; page <= 1; page++) {
            console.log(`\n=== Page ${page} ===`);
            const response = await searchPage(page);
            processResults(response);
            
            // Add a small delay between requests to avoid rate limiting
            if (page < 4) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.error('Error in searchAllPages:', error);
    }
}

// Run the search
searchAllPages(); 