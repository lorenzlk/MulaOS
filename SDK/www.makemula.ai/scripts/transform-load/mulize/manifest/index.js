require('dotenv').config();
const AWS = require('aws-sdk');
const crypto = require('crypto');

// Configure AWS
AWS.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

// Import models using the existing setup
const { sequelize, Page, Search } = require('../../../../models');
const { getTargetingForDomain } = require('../../../../helpers/SiteTargetingHelpers');
const { getNextPageTargetingForDomain, calculatePriority } = require('../../../../helpers/NextPageTargetingHelpers');


// Helper function to create SHA256 hash (same as in BootLoader)
async function createSHA256Hash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Function to extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        // Normalize domain to lowercase since DNS is case-insensitive
        return urlObj.hostname.toLowerCase();
    } catch (error) {
        console.error(`Error extracting domain from URL ${url}:`, error);
        return null;
    }
}

// Function to get legacy pageIds from S3 for a domain
async function getLegacyPageIdsForDomain(domain) {
    try {
        // Ensure domain is lowercase for S3 consistency
        const normalizedDomain = domain.toLowerCase();
        const params = {
            Bucket: 'prod.makemula.ai',
            Prefix: `${normalizedDomain}/pages/`
        };

        const response = await s3.listObjectsV2(params).promise();
        
        // Filter for index.json files and extract page IDs
        const pageIds = response.Contents
            .filter(obj => obj.Key.endsWith('index.json'))
            .map(obj => {
                const parts = obj.Key.split('/');
                return parts[parts.length - 2]; // Get the directory name before index.json
            });

        return [...new Set(pageIds)]; // Remove duplicates
    } catch (error) {
        console.error(`Error getting legacy page IDs for domain ${domain}:`, error);
        return [];
    }
}

// Function to check if a file exists (local filesystem in dev, S3 in production)
async function checkFileExists(filePath) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // In development, check local filesystem first
    if (process.env.NODE_ENV !== 'production') {
        const localPath = path.join(__dirname, '..', '..', 'data', filePath);
        try {
            await fs.access(localPath);
            return true;
        } catch (error) {
            // File doesn't exist locally, fall through to check S3
        }
    }
    
    // Check S3 (or if local check failed in dev)
    try {
        const s3Params = {
            Bucket: 'prod.makemula.ai',
            Key: filePath
        };
        
        await s3.headObject(s3Params).promise();
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
}

// Function to create manifest mapping for a domain
async function createManifestForDomain(domain, pages) {
    const manifestMapping = {};
    const processedPageIds = new Set();
    
    // Process pages from database
    for (const page of pages) {
        try {
            const urlObj = new URL(page.url);
            // Preserve exact case of pathname for pageId generation
            const pageId = await createSHA256Hash(urlObj.pathname);
            processedPageIds.add(pageId);
            
            // Check if page has associated search
            if (page.Search && page.Search.phrase) {
                const phraseID = page.Search.phraseID;
                const searchResultsUrl = `searches/${phraseID}/results.json`;
                
                // Check if search results file exists
                const searchResultsExist = await checkFileExists(searchResultsUrl);
                
                if (searchResultsExist) {
                    manifestMapping[pageId] = searchResultsUrl;
                    console.log(`✓ Page ${pageId} mapped to search results: ${searchResultsUrl}`);
                } else {
                    // Search results don't exist, add to legacy
                    if (!manifestMapping._legacy) {
                        manifestMapping._legacy = [];
                    }
                    manifestMapping._legacy.push(pageId);
                    console.log(`⚠ Page ${pageId} added to legacy (no search results): ${searchResultsUrl}`);
                }
            } else {
                // No search associated, add to legacy
                if (!manifestMapping._legacy) {
                    manifestMapping._legacy = [];
                }
                manifestMapping._legacy.push(pageId);
                console.log(`⚠ Page ${pageId} added to legacy (no search association)`);
            }
        } catch (error) {
            console.error(`Error processing page ${page.url}:`, error);
        }
    }
    
    // Get legacy pageIds from S3 and add any that weren't processed from database
    const legacyPageIds = await getLegacyPageIdsForDomain(domain);
    for (const legacyPageId of legacyPageIds) {
        if (!processedPageIds.has(legacyPageId)) {
            if (!manifestMapping._legacy) {
                manifestMapping._legacy = [];
            }
            manifestMapping._legacy.push(legacyPageId);
            console.log(`⚠ Legacy pageId ${legacyPageId} added to legacy (not in database)`);
        }
    }
    
    return manifestMapping;
}

const CACHE_CONTROL = 'public, s-maxage=300, no-cache, must-revalidate, max-age=0';

async function writeManifest(domain, manifestData) {
    try {
        const manifestContent = JSON.stringify(manifestData, null, 2);
        // Ensure domain is lowercase for S3 consistency
        const normalizedDomain = domain.toLowerCase();
        const params = {
            Bucket: 'prod.makemula.ai',
            Key: `${normalizedDomain}/manifest.json`,
            Body: manifestContent,
            ContentType: 'application/json',
            ACL: 'public-read',
            CacheControl: CACHE_CONTROL,
            Expires: new Date(0)
        };

        if (process.env.NODE_ENV === 'production') {
            await s3.putObject(params).promise();
            console.log(`Successfully wrote manifest for ${normalizedDomain}`);
        } else {
            console.log(`Would write manifest for ${normalizedDomain} with content:`, manifestContent);
        }
    } catch (error) {
        console.error(`Error writing manifest for ${domain}:`, error);
    }
}

async function buildManifestsFromDatabase() {
    try {
        // Get all pages from database with their associated searches
        const pages = await Page.findAll({
            include: [{
                model: Search,
                as: 'Search',
                required: false
            }]
        });

        console.log(`Found ${pages.length} pages in database`);

        // Group pages by domain
        const pagesByDomain = {};
        for (const page of pages) {
            const domain = extractDomain(page.url);
            if (domain) {
                if (!pagesByDomain[domain]) {
                    pagesByDomain[domain] = [];
                }
                pagesByDomain[domain].push(page);
            }
        }

        // Also discover domains from SiteTargeting and NextPageTargeting records
        const { SiteTargeting, NextPageTargeting } = require('../../../../models');
        const targetingDomains = await SiteTargeting.findAll({
            attributes: ['topLevelDomain'],
            group: ['topLevelDomain'],
            paranoid: true // Only active records
        });
        
        const nextPageTargetingDomains = await NextPageTargeting.findAll({
            attributes: ['topLevelDomain'],
            group: ['topLevelDomain'],
            paranoid: true // Only active records
        });

        console.log(`Found ${targetingDomains.length} domains with targeting rules`);
        console.log(`Found ${nextPageTargetingDomains.length} domains with next-page targeting rules`);

        // Add domains from targeting records that don't have pages
        for (const targetingDomain of targetingDomains) {
            const domain = targetingDomain.topLevelDomain.toLowerCase();
            if (!pagesByDomain[domain]) {
                pagesByDomain[domain] = []; // Empty array for domains with only targeting rules
                console.log(`Added domain from targeting: ${domain}`);
            }
        }
        
        // Add domains from next-page targeting records that don't have pages
        for (const nextPageTargetingDomain of nextPageTargetingDomains) {
            const domain = nextPageTargetingDomain.topLevelDomain.toLowerCase();
            if (!pagesByDomain[domain]) {
                pagesByDomain[domain] = []; // Empty array for domains with only next-page targeting rules
                console.log(`Added domain from next-page targeting: ${domain}`);
            }
        }

        console.log(`Total domains to process: ${Object.keys(pagesByDomain).length}`);

        // Process each domain
        for (const [domain, domainPages] of Object.entries(pagesByDomain)) {
            console.log(`\nProcessing domain: ${domain} (${domainPages.length} pages)`);
            
            // Create manifest mapping (handles empty pages array for targeting-only domains)
            const manifestMapping = await createManifestForDomain(domain, domainPages);
            
            // Add targeting information to manifest
            try {
                const targetingRecords = await getTargetingForDomain(domain);
                if (targetingRecords.length > 0) {
                    manifestMapping._targeting = targetingRecords.map(record => ({
                        type: record.targetingType,
                        value: record.targetingValue,
                        searchPhrase: record.searchPhrase,
                        phraseID: record.phraseID
                    }));
                    console.log(`✓ Added ${targetingRecords.length} targeting rules to manifest for ${domain}`);
                }
            } catch (error) {
                console.error(`Error adding targeting to manifest for ${domain}:`, error);
            }
            
            // Add next-page targeting information to manifest
            try {
                const nextPageTargetingRecords = await getNextPageTargetingForDomain(domain);
                if (nextPageTargetingRecords.length > 0) {
                    const validNextPageTargeting = [];
                    
                    for (const record of nextPageTargetingRecords) {
                        const sectionManifestPath = `${domain}/next-page/${record.sectionName}/manifest.json`;
                        const sectionManifestExists = await checkFileExists(sectionManifestPath);
                        
                        if (sectionManifestExists) {
                            validNextPageTargeting.push({
                                type: record.targetingType,
                                value: record.targetingValue,
                                section: record.sectionName,
                                manifest: `next-page/${record.sectionName}/manifest.json`,
                                priority: calculatePriority(record.targetingType, record.targetingValue)
                            });
                            console.log(`✓ Added next-page targeting rule for section: ${record.sectionName}`);
                        } else {
                            console.log(`⚠ Skipping next-page targeting rule for section: ${record.sectionName} (manifest file does not exist)`);
                        }
                    }
                    
                    if (validNextPageTargeting.length > 0) {
                        manifestMapping._nextPageTargeting = validNextPageTargeting;
                        console.log(`✓ Added ${validNextPageTargeting.length} next-page targeting rules to manifest for ${domain} (${nextPageTargetingRecords.length - validNextPageTargeting.length} skipped due to missing manifests)`);
                    } else if (nextPageTargetingRecords.length > 0) {
                        console.log(`⚠ No valid next-page targeting rules for ${domain} (all ${nextPageTargetingRecords.length} section manifests are missing)`);
                    }
                }
            } catch (error) {
                console.error(`Error adding next-page targeting to manifest for ${domain}:`, error);
            }
            
            // Write manifest if we have any mappings OR targeting rules
            if (Object.keys(manifestMapping).length > 0) {
                await writeManifest(domain, manifestMapping);
            } else {
                console.log(`No manifest data for domain: ${domain}`);
            }
        }

    } catch (error) {
        console.error('Error building manifests from database:', error);
    } finally {
        // Close database connection
        await sequelize.close();
    }
}

buildManifestsFromDatabase(); 