const AWS = require('aws-sdk');
const config = require('../config');
const { createLogger } = require('./LoggingHelpers');
const { getStorageHandler } = require('./EnvironmentHelpers');

const logger = createLogger('S3Helpers');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Log AWS configuration at startup
logger.info('🔧 AWS S3 Configuration loaded', {
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  s3Bucket: process.env.AWS_S3_BUCKET,
  accessKeyPreview: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'MISSING',
  secretKeyPreview: process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8) + '...' : 'MISSING'
});

// Initialize S3 client
const s3 = new AWS.S3();
const storage = getStorageHandler();

/**
 * Uploads a JSON file to S3 or local filesystem
 * @param {string} urlStr - The URL string to use for the file path
 * @param {Object} jsonData - The JSON data to upload
 * @param {Object} options - Upload options
 * @param {number} options.ttlMinutes - TTL in minutes for cache control (default: 60)
 */
const uploadJsonToS3 = async (urlStr, jsonData, options = {}) => {
  const url = new URL(urlStr);
  const fileName = url.pathname;
  const { ttlMinutes = 60, bucket = null } = options;
  
  logger.info('🚀 Starting S3 upload process', { 
    fileName, 
    urlStr, 
    ttlMinutes, 
    bucket,
    dataSize: JSON.stringify(jsonData).length,
    dataKeys: Object.keys(jsonData)
  });

  try {
    logger.info('📝 Stringifying JSON data for S3 upload', {
      fileName,
      dataSize: JSON.stringify(jsonData).length,
      dataType: typeof jsonData,
      dataKeys: Object.keys(jsonData)
    });
    
    const jsonString = JSON.stringify(jsonData);
    logger.info('✅ JSON stringification complete', {
      fileName,
      stringLength: jsonString.length,
      firstChars: jsonString.substring(0, 100)
    });
    
    logger.info('📤 Calling storage.write() method', {
      fileName,
      bucket: bucket || process.env.AWS_S3_BUCKET,
      ttlMinutes,
      stringLength: jsonString.length
    });
    
    const result = await storage.write(fileName, jsonString, bucket, { ttlMinutes });
    
    logger.info('🎉 Successfully uploaded JSON to S3', { 
      fileName, 
      result,
      s3Location: result,
      bucket: bucket || process.env.AWS_S3_BUCKET
    });
    
    return result;
  } catch (error) {
    logger.error('💥 CRITICAL ERROR: Failed to upload JSON to S3', error, { 
      fileName,
      urlStr,
      bucket: bucket || process.env.AWS_S3_BUCKET,
      errorType: error.constructor.name,
      errorCode: error.code || error.statusCode,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
};

/**
 * Get a file from S3 or local filesystem
 * @param {string} fileUrl - The URL of the file to get
 * @param {string} bucket - Optional bucket name (defaults to AWS_S3_BUCKET env var)
 */
const getFile = async (fileUrl, bucket = null) => {
  logger.info('Getting file', { fileUrl, bucket });
  
  try {
    const content = await storage.read(fileUrl, bucket);
    if (!content) {
      logger.info('File not found', { fileUrl, bucket });
      return { ok: false };
    }

    return {
      json: async () => JSON.parse(content),
      text: async () => content,
      ok: true
    };
  } catch (error) {
    logger.error('Error reading file', error, { fileUrl, bucket });
    return { ok: false };
  }
};

/**
 * Invalidate a specific cache key (file path) in CloudFront
 * @param {string} cacheKey - The file path to invalidate (e.g., /images/logo.png)
 */
const invalidateCache = async (cacheKey) => {
  logger.info('Invalidating cache', { cacheKey });
  
  const cloudfront = new AWS.CloudFront();
  const params = {
    DistributionId: config.storage.cloudfrontDistributionId,
    InvalidationBatch: {
      CallerReference: `invalidate-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: [cacheKey]
      }
    }
  };

  try {
    const result = await cloudfront.createInvalidation(params).promise();
    logger.info('Cache invalidation submitted', { 
      invalidationId: result.Invalidation.Id,
      status: result.Invalidation.Status
    });
    return result;
  } catch (error) {
    logger.error('Error invalidating cache', error, { cacheKey });
    throw error;
  }
};

module.exports = {
  uploadJsonToS3,
  getFile,
  invalidateCache
}; 