
import AWS from 'aws-sdk';

// Initialize CloudWatch client with VPC endpoint
const cloudwatch = new AWS.CloudWatch({ 
  region: 'us-east-1',
  endpoint: 'https://vpce-0819b7bda5f3e46f5-e3gq3wp9.monitoring.us-east-1.vpce.amazonaws.com',
  httpOptions: {
    timeout: 5000 // 5 second timeout
  }
});

export const handler = async (event) => {
  // Accumulate metrics data for batch processing
  const searchPhraseMetrics = new Map(); // key: "searchPhrase|host", value: count
  const eventMetrics = new Map(); // key: "eventName|host|searchPhrase", value: count

  const output = await Promise.all(
    event.records.map(async (record) => {
      try {
        //console.log('Got record', record.data);
        const recordData = Buffer.from(record.data, 'base64').toString('utf8');
        const columns = recordData.split('\t');

        const decoded = decodeURIComponent(columns[7]);
        //console.log('columns[7]', columns[7]);
        //console.log('decoded', decoded);

        const jsonData = JSON.parse(Buffer.from(decoded, 'base64').toString('utf8'));
        const { href } = jsonData;
        const hostURL = new URL(href);
        jsonData.host = hostURL.host;
        jsonData.pathname = hostURL.pathname;
        jsonData.originAndPathname = `${hostURL.origin}${hostURL.pathname}`;
        jsonData.queryString = hostURL.search;

        // Convert arrays and objects to JSON strings for proper storage in map<string,string>
        // This ensures complex data structures are preserved and can be parsed back in Athena queries
        const processedData = {};
        for (const [key, value] of Object.entries(jsonData)) {
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            // Store arrays and objects as JSON strings so they can be parsed back in queries
            processedData[key] = JSON.stringify(value);
          } else {
            processedData[key] = value;
          }
        }

        // Prepare the transformed record
        const payload = {
          timestamp: new Date(parseInt(columns[0], 10) * 1000).toISOString(),
          context: {
            ip: columns[1],
            requestId: columns[3],
            ipVersion: columns[4],
            userAgent: decodeURI(columns[5]),
            cookie: columns[6],
          },
          properties: processedData,
        };
        console.log('Got payload', payload);

        // Accumulate metrics data instead of making individual calls
        // Note: Use original jsonData for metrics since we need the actual values, not JSON strings
        // 1. Search phrase metrics
        if (jsonData.search_phrase && jsonData.eventName === 'mula_widget_view') {
          const key = `${jsonData.search_phrase}|${jsonData.host}`;
          searchPhraseMetrics.set(key, (searchPhraseMetrics.get(key) || 0) + 1);
        }

        // 2. General event metrics
        if (jsonData.eventName && jsonData.eventName !== 'page_view') {
          const searchPhrase = jsonData.search_phrase || '';
          const key = `${jsonData.eventName}|${jsonData.host}|${searchPhrase}`;
          eventMetrics.set(key, (eventMetrics.get(key) || 0) + 1);
        }

        const resultPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

        return {
          recordId: record.recordId,
          result: 'Ok',
          data: resultPayload,
        };
      } catch (e) {
        console.error('Error processing record', e);

        return {
          recordId: record.recordId,
          result: 'Dropped',
          data: '',
        };
      }
    })
  );

  // Send batched metrics to CloudWatch after all records are processed
  // Wrap in try-catch to ensure CloudWatch failures don't block record processing
  try {
    //await sendBatchedMetrics(searchPhraseMetrics, eventMetrics);
  } catch (error) {
    // Log the error but don't fail the entire function
    console.error('CloudWatch metrics failed (non-blocking):', error.message);
  }

  console.log(`Processing completed. Successful records: ${output.length}`);
  return { records: output };
};

// Helper function to send batched metrics to CloudWatch
async function sendBatchedMetrics(searchPhraseMetrics, eventMetrics) {
  const allMetricData = [];

  // Convert search phrase metrics to CloudWatch format
  for (const [key, count] of searchPhraseMetrics) {
    const [searchPhrase, host] = key.split('|');
    allMetricData.push({
      MetricName: 'SearchPhraseCount',
      Dimensions: [
        { Name: 'SearchPhrase', Value: searchPhrase },
        { Name: 'Host', Value: host }
      ],
      Value: count,
      Unit: 'Count',
      Timestamp: new Date()
    });
  }

  // Convert event metrics to CloudWatch format
  for (const [key, count] of eventMetrics) {
    const [eventName, host, searchPhrase] = key.split('|');
    const dimensions = [
      { Name: 'EventName', Value: eventName },
      { Name: 'Host', Value: host }
    ];
    
    // Only add SearchPhrase dimension if it's not empty
    if (searchPhrase) {
      dimensions.push({ Name: 'SearchPhrase', Value: searchPhrase });
    }

    allMetricData.push({
      MetricName: 'EventCount',
      Dimensions: dimensions,
      Value: count,
      Unit: 'Count',
      Timestamp: new Date()
    });
  }

  // Separate metrics by namespace and send in batches
  const searchPhraseMetricsData = allMetricData.filter(metric => metric.MetricName === 'SearchPhraseCount');
  const eventMetricsData = allMetricData.filter(metric => metric.MetricName === 'EventCount');
  
  const cloudwatchPromises = [];
  
  // Send search phrase metrics
  if (searchPhraseMetricsData.length > 0) {
    const batchSize = 20;
    for (let i = 0; i < searchPhraseMetricsData.length; i += batchSize) {
      const batch = searchPhraseMetricsData.slice(i, i + batchSize);
      cloudwatchPromises.push(
        cloudwatch.putMetricData({
          Namespace: 'Mula/SearchPhrases',
          MetricData: batch
        }).promise()
      );
    }
  }
  
  // Send event metrics
  if (eventMetricsData.length > 0) {
    const batchSize = 20;
    for (let i = 0; i < eventMetricsData.length; i += batchSize) {
      const batch = eventMetricsData.slice(i, i + batchSize);
      cloudwatchPromises.push(
        cloudwatch.putMetricData({
          Namespace: 'Mula/Events',
          MetricData: batch
        }).promise()
      );
    }
  }

  // Execute all CloudWatch operations with timeout protection
  if (cloudwatchPromises.length > 0) {
    await Promise.race([
      Promise.all(cloudwatchPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('CloudWatch batch operations timed out after 5 seconds')), 5000)
      )
    ]);
    console.log(`Sent ${allMetricData.length} batched metric(s) to CloudWatch in ${cloudwatchPromises.length} batch(es)`);
  }
};

