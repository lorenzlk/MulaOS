const fs = require('fs');
const path = require('path');

const isDevelopment = () => process.env.NODE_ENV !== 'production';

const getStorageHandler = () => {
  if (isDevelopment()) {
    return {
      write: async (filePath, data, bucket = null) => {
        if (!filePath.startsWith('.')) {
          filePath = filePath.startsWith('/data') ? `.${filePath}` : `./data${filePath}`;
        }
        const dirPath = path.dirname(filePath);
        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(filePath, data);
        return filePath;
      },
      read: async (filePath, bucket = null) => {
        if (!filePath.startsWith('.')) {
          filePath = filePath.startsWith('/data') ? `.${filePath}` : `./data${filePath}`;
        }
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath).toString();
        }
        return null;
      },
      delete: async (filePath, bucket = null) => {
        if (!filePath.startsWith('.')) {
          filePath = filePath.startsWith('/data') ? `.${filePath}` : `./data${filePath}`;
        }
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    };
  }
  
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3();
  
  return {
    write: async (filePath, data, bucket = null, options = {}) => {
      const { ttlMinutes = 60 } = options;
      const finalBucket = bucket || process.env.AWS_S3_BUCKET;
      const finalKey = filePath.replace(/^\/+/, '');
      
      console.log('🔧 S3 Storage.write() called with:', {
        filePath,
        finalKey,
        finalBucket,
        dataLength: data.length,
        dataType: typeof data,
        ttlMinutes,
        awsRegion: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyPreview: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'MISSING'
      });
      
      // s-maxage for shared caches (CDN), but no-cache, must-revalidate, max-age=0 for browsers
      const cacheControl = `public, s-maxage=${ttlMinutes * 60}, no-cache, must-revalidate, max-age=0`;
      
      const params = {
        Bucket: finalBucket,
        Key: finalKey,
        Body: data,
        ContentType: 'application/json',
        ACL: 'public-read',
        CacheControl: cacheControl,
        Expires: new Date(0)
      };
      
      console.log('📋 S3 Upload parameters:', {
        Bucket: params.Bucket,
        Key: params.Key,
        ContentType: params.ContentType,
        ACL: params.ACL,
        CacheControl: params.CacheControl,
        BodyLength: params.Body.length,
        BodyPreview: params.Body.substring(0, 200) + '...'
      });
      
      try {
        console.log('🚀 Calling s3.upload() with params...');
        const result = await s3.upload(params).promise();
        console.log('✅ S3 upload successful:', {
          Location: result.Location,
          ETag: result.ETag,
          Bucket: result.Bucket,
          Key: result.Key
        });
        return result.Location;
      } catch (error) {
        console.error('💥 S3 upload failed:', {
          errorType: error.constructor.name,
          errorCode: error.code,
          errorMessage: error.message,
          errorStatus: error.statusCode,
          errorRequestId: error.requestId,
          errorRegion: error.region,
          errorTime: error.time,
          errorRetryable: error.retryable,
          errorStack: error.stack,
          params: {
            Bucket: params.Bucket,
            Key: params.Key,
            ContentType: params.ContentType
          }
        });
        throw error;
      }
    },
    read: async (filePath, bucket = null) => {
      try {
        const params = {
          Bucket: bucket || process.env.AWS_S3_BUCKET,
          Key: filePath.replace(/^\/+/, '')
        };
        const result = await s3.getObject(params).promise();
        return result.Body.toString();
      } catch (error) {
        if (error.code === 'NoSuchKey') return null;
        throw error;
      }
    },
    delete: async (filePath, bucket = null) => {
      const params = {
        Bucket: bucket || process.env.AWS_S3_BUCKET,
        Key: filePath.replace(/^\/+/, '')
      };
      await s3.deleteObject(params).promise();
    }
  };
};

module.exports = {
  isDevelopment,
  getStorageHandler
}; 