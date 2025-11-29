require('dotenv').config();
const AWS = require('aws-sdk');
const { Readable } = require('stream');
const fs = require('fs').promises;
const path = require('path');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

async function getAllObjects(bucket) {
  const allObjects = [];
  let continuationToken = undefined;

  do {
    const response = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: '',
      ContinuationToken: continuationToken,
    }).promise();

    allObjects.push(...(response.Contents || []));
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return allObjects;
}

async function aggregateKeywords() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

    // List all keywords.json files with pagination
    const allObjects = await getAllObjects('prod.makemula.ai');
    const keywordsFiles = allObjects.filter(obj => 
      obj.Key.match(/\/pages\/[^/]+\/keywords\.json$/)
    );

    // Group files by hostname
    const hostnameGroups = {};
    for (const file of keywordsFiles) {
      const match = file.Key.match(/^([^/]+)\/pages\//);
      if (match) {
        const hostname = match[1];
        if (!hostnameGroups[hostname]) {
          hostnameGroups[hostname] = [];
        }
        hostnameGroups[hostname].push(file.Key);
      }
    }

    // Store all keywords for local file output
    const allKeywords = {};

    // Process each hostname group
    for (const [hostname, files] of Object.entries(hostnameGroups)) {
      const keywords = [];

      // Read and aggregate keywords for this hostname
      for (const fileKey of files) {
        const response = await s3.getObject({
          Bucket: 'prod.makemula.ai',
          Key: fileKey,
        }).promise();

        const content = response.Body.toString('utf-8');
        const keyword = JSON.parse(content);
        keywords.push(keyword);
      }

      // Store keywords for this hostname
      allKeywords[hostname] = keywords;

      const targetKey = `${hostname}/keywords/index.json`;
      
      if (isProduction) {
        // Upload aggregated keywords
        await s3.putObject({
          Bucket: 'prod.makemula.ai',
          Key: targetKey,
          Body: JSON.stringify(keywords),
          ContentType: 'application/json',
          ACL: 'public-read',
          CacheControl: 'public, s-maxage=3600, no-cache, must-revalidate, max-age=0',
        }).promise();

        console.log(`Uploaded ${files.length} keywords to s3://prod.makemula.ai/${targetKey}`);
      } else {
        console.log(`[DEV MODE] Would upload ${files.length} keywords to s3://prod.makemula.ai/${targetKey}`);
        console.log(`[DEV MODE] Keywords content:`, JSON.stringify(keywords, null, 2));
      }
    }

    // Write all keywords to local file in non-production mode
    if (!isProduction) {
      const outputPath = path.join(__dirname, 'all-keywords.json');
      await fs.writeFile(outputPath, JSON.stringify(allKeywords, null, 2));
      console.log(`[DEV MODE] Wrote all keywords to ${outputPath}`);
    }

    console.log('Keywords aggregation completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
aggregateKeywords(); 