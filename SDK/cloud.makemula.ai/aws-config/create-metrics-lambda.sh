#!/bin/bash

# Create a simple Lambda function to send search phrase metrics to CloudWatch
cat > search-phrase-metrics.js << 'EOF'
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });

exports.handler = async (event) => {
    console.log('Processing search phrase events:', JSON.stringify(event, null, 2));
    
    const metrics = [];
    
    for (const record of event.Records) {
        try {
            const payload = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString());
            console.log('Parsed payload:', payload);
            
            if (payload.search_phrase && payload.host) {
                // Create custom metric for search phrase by host
                metrics.push({
                    MetricName: 'SearchPhraseCount',
                    Dimensions: [
                        {
                            Name: 'SearchPhrase',
                            Value: payload.search_phrase
                        },
                        {
                            Name: 'Host',
                            Value: payload.host
                        }
                    ],
                    Value: 1,
                    Unit: 'Count',
                    Timestamp: new Date(payload.event_time || Date.now())
                });
            }
        } catch (error) {
            console.error('Error processing record:', error);
        }
    }
    
    if (metrics.length > 0) {
        try {
            await cloudwatch.putMetricData({
                Namespace: 'Mula/SearchPhrases',
                MetricData: metrics
            }).promise();
            console.log(`Sent ${metrics.length} metrics to CloudWatch`);
        } catch (error) {
            console.error('Error sending metrics to CloudWatch:', error);
        }
    }
    
    return { statusCode: 200, body: 'Success' };
};
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "search-phrase-metrics",
  "version": "1.0.0",
  "dependencies": {
    "aws-sdk": "^2.1691.0"
  }
}
EOF

# Install dependencies
npm install

# Create deployment package
zip -r search-phrase-metrics.zip .

echo "✅ Lambda package created: search-phrase-metrics.zip"
echo "📦 Deploy with: aws lambda create-function --function-name search-phrase-metrics --runtime nodejs18.x --role arn:aws:iam::279472569836:role/KinesisAnalyticsServiceRole --handler index.handler --zip-file fileb://search-phrase-metrics.zip --profile kdmny30"
