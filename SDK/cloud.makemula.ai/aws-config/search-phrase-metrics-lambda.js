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
                
                // Create metric for total search phrases
                metrics.push({
                    MetricName: 'TotalSearchPhrases',
                    Dimensions: [
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
