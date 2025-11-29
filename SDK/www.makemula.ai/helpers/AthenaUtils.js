const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

// Configure AWS
AWS.config.update({
    region: 'us-east-1'
});

const athena = new AWS.Athena({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

/**
 * Executes a named query in Athena.
 *
 * @param {string} namedQueryId - The ID of the saved named query.
 * @param {string} s3OutputLocation - S3 location to store the results.
 */
async function executeNamedQuery(namedQueryId, s3OutputLocation) {
    try {
        // Retrieve the named query
        const namedQueryResponse = await athena.getNamedQuery({ NamedQueryId: namedQueryId }).promise();
        const query = namedQueryResponse.NamedQuery.QueryString;

        // Execute the query
        const params = {
            QueryString: query,
            ResultConfiguration: {
                OutputLocation: s3OutputLocation
            }
        };

        const startQueryResponse = await athena.startQueryExecution(params).promise();
        console.log('Query started:', startQueryResponse.QueryExecutionId);

        // Poll for query completion
        let queryStatus = 'RUNNING';
        let queryExecution;
        while (queryStatus === 'RUNNING') {
            queryExecution = await athena.getQueryExecution({
                QueryExecutionId: startQueryResponse.QueryExecutionId
            }).promise();

            queryStatus = queryExecution.QueryExecution.Status.State;
            if (queryStatus === 'FAILED' || queryStatus === 'CANCELLED') {
                throw new Error('Query failed or was cancelled');
            }
            // Wait for 2 seconds before checking the status again
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Get the full S3 output location from the query execution
        const outputLocation = queryExecution.QueryExecution.ResultConfiguration.OutputLocation;
        console.log('Query completed. Results stored in:', outputLocation);

        // In development, download the file and save it locally
        if (process.env.NODE_ENV !== 'production') {
            const s3Url = new URL(outputLocation);
            const localPath = path.join('data', s3Url.pathname);
            
            try {
                // Poll for file availability in S3
                const s3Params = {
                    Bucket: s3Url.hostname,
                    Key: s3Url.pathname.slice(1) // Remove leading slash
                };

                let fileAvailable = false;
                let attempts = 0;
                const maxAttempts = 20; // 60 seconds total (20 attempts * 3 seconds)
                
                while (!fileAvailable && attempts < maxAttempts) {
                    try {
                        await s3.headObject(s3Params).promise();
                        fileAvailable = true;
                    } catch (error) {
                        if (error.code === 'NotFound') {
                            console.log(`File not yet available, attempt ${attempts + 1}/${maxAttempts}`);
                            attempts++;
                            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
                        } else {
                            throw error; // Re-throw if it's not a "not found" error
                        }
                    }
                }

                if (!fileAvailable) {
                    throw new Error('File not available after 60 seconds of polling');
                }

                // Download the file from S3
                const data = await s3.getObject(s3Params).promise();
                
                // Create directory if it doesn't exist
                await fs.mkdir(path.dirname(localPath), { recursive: true });
                
                // Write file locally
                await fs.writeFile(localPath, data.Body);
                console.log(`Saved results locally to: ${localPath}`);
            } catch (error) {
                console.error('Error saving file locally:', error);
            }
        }
    } catch (error) {
        console.error('Error executing named query:', error);
    }
};

module.exports = {
    executeNamedQuery
};
