require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const athena = new AWS.Athena();

const s3 = new AWS.S3();

/**
 * Loads a SQL query from file and applies parameter substitutions
 * @param {string} queryName - Name of the query file (without .sql extension)
 * @param {Object} parameters - Parameters to substitute in the query
 * @returns {string} - The processed SQL query
 */
async function loadQuery(queryName, parameters = {}) {
    try {
        const queryPath = path.join(__dirname, '..', 'queries', `${queryName}.sql`);
        let query = await fs.readFile(queryPath, 'utf8');
        
        // DEBUG: Print parameters
        console.log('Substitution parameters:', parameters);

        // More robust substitution: allow whitespace inside {{ }}
        for (const [key, value] of Object.entries(parameters)) {
            const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
            query = query.replace(regex, String(value));
        }

        // DEBUG: Print query after substitution
        console.log('Query after substitution:');
        console.log(query);
        
        return query;
    } catch (error) {
        throw new Error(`Failed to load query ${queryName}: ${error.message}`);
    }
}

/**
 * Executes a query in Athena
 * @param {string} queryName - Name of the query file (without .sql extension)
 * @param {Object} options - Execution options
 * @param {string} options.output_location - S3 location for results
 * @param {Object} options.parameters - Query parameters
 * @param {number} options.timeout - Query timeout in seconds (default: 300)
 * @returns {Object} - Query execution result
 */
async function executeQuery(queryName, options = {}) {
    const {
        output_location = 's3://prod.makemula.ai/athena-results/',
        parameters = {},
        timeout = 300
    } = options;

    try {
        console.log(`Loading query: ${queryName}`);
        const queryString = await loadQuery(queryName, parameters);
        
        // DEBUG: Print the final SQL query
        console.log('Final SQL to execute:');
        console.log(queryString);
        
        // Create unique output location
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueOutputLocation = `${output_location}${queryName}/${timestamp}/`;
        
        console.log(`Executing query: ${queryName}`);
        console.log(`Output location: ${uniqueOutputLocation}`);
        
        const params = {
            QueryString: queryString,
            ResultConfiguration: {
                OutputLocation: uniqueOutputLocation
            },
            QueryExecutionContext: {
                Database: 'mula'
            }
        };

        const startQueryResponse = await athena.startQueryExecution(params).promise();
        const queryExecutionId = startQueryResponse.QueryExecutionId;
        
        console.log(`Query started with ID: ${queryExecutionId}`);

        // Poll for query completion
        const result = await pollQueryExecution(queryExecutionId, timeout);
        
        if (result.status === 'SUCCEEDED') {
            console.log(`Query completed successfully: ${queryExecutionId}`);
            
            // Download results locally
            await downloadResults(result.outputLocation, queryName, timestamp);
            
            return {
                success: true,
                queryExecutionId,
                outputLocation: result.outputLocation,
                executionTime: result.executionTime,
                dataScanned: result.dataScanned
            };
        } else {
            throw new Error(`Query failed with status: ${result.status}`);
        }
        
    } catch (error) {
        console.error(`Error executing query ${queryName}:`, error);
        throw error;
    }
}

/**
 * Polls for query execution completion
 * @param {string} queryExecutionId - The query execution ID
 * @param {number} timeout - Timeout in seconds
 * @returns {Object} - Query execution status and metadata
 */
async function pollQueryExecution(queryExecutionId, timeout) {
    const startTime = Date.now();
    const timeoutMs = timeout * 1000;
    
    while (true) {
        if (Date.now() - startTime > timeoutMs) {
            throw new Error(`Query execution timed out after ${timeout} seconds`);
        }
        
        const queryExecution = await athena.getQueryExecution({
            QueryExecutionId: queryExecutionId
        }).promise();
        
        const status = queryExecution.QueryExecution.Status.State;
        
        if (status === 'SUCCEEDED') {
            return {
                status,
                outputLocation: queryExecution.QueryExecution.ResultConfiguration.OutputLocation,
                executionTime: queryExecution.QueryExecution.Statistics.TotalExecutionTimeInMillis,
                dataScanned: queryExecution.QueryExecution.Statistics.DataScannedInBytes
            };
        } else if (status === 'FAILED' || status === 'CANCELLED') {
            const errorMessage = queryExecution.QueryExecution.Status.StateChangeReason || 'Unknown error';
            throw new Error(`Query failed: ${errorMessage}`);
        }
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

/**
 * Downloads query results from S3 (development only)
 * @param {string} s3Location - S3 location of results
 * @param {string} queryName - Name of the query
 * @param {string} timestamp - Timestamp for the execution
 */
async function downloadResults(s3Location, queryName, timestamp) {
    try {
        console.log(`Attempting to download results from: ${s3Location}`);
        const s3Url = new URL(s3Location);
        const localPath = path.join(__dirname, '..', '..', 'data', 'athena-results', queryName, timestamp);
        
        console.log(`Local path: ${localPath}`);
        
        // Create local directory
        await fs.mkdir(localPath, { recursive: true });
        
        // List objects in the S3 location
        const s3Params = {
            Bucket: s3Url.hostname,
            Prefix: s3Url.pathname.slice(1) // Remove leading slash
        };
        
        console.log(`S3 params:`, s3Params);
        
        const objects = await s3.listObjectsV2(s3Params).promise();
        
        console.log(`Found ${objects.Contents.length} objects in S3`);
        
        // Poll for results to become available
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds total
        let filesDownloaded = 0;
        
        while (attempts < maxAttempts && filesDownloaded === 0) {
            console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for results...`);
            
            try {
                // Download each file
                for (const object of objects.Contents) {
                    if (object.Key.endsWith('.csv') || object.Key.endsWith('.txt')) {
                        console.log(`Attempting to download: ${object.Key}`);
                        
                        const data = await s3.getObject({
                            Bucket: s3Url.hostname,
                            Key: object.Key
                        }).promise();
                        
                        const fileName = path.basename(object.Key);
                        const localFilePath = path.join(localPath, fileName);
                        
                        await fs.writeFile(localFilePath, data.Body);
                        console.log(`Downloaded: ${localFilePath}`);
                        filesDownloaded++;
                    }
                }
                
                if (filesDownloaded > 0) {
                    console.log(`Successfully downloaded ${filesDownloaded} files`);
                    break;
                }
            } catch (error) {
                console.log(`Download attempt ${attempts + 1} failed: ${error.message}`);
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            }
        }
        
        if (filesDownloaded === 0) {
            console.log('No files were downloaded after all attempts');
        }
    } catch (error) {
        console.error('Error downloading results:', error);
    }
}

/**
 * Lists available queries
 * @returns {Array} - Array of available query names
 */
async function listQueries() {
    try {
        const queriesPath = path.join(__dirname, '..', 'queries');
        const files = await fs.readdir(queriesPath);
        return files
            .filter(file => file.endsWith('.sql'))
            .map(file => file.replace('.sql', ''));
    } catch (error) {
        console.error('Error listing queries:', error);
        return [];
    }
}

/**
 * Gets query metadata (description, parameters, etc.)
 * @param {string} queryName - Name of the query
 * @returns {Object} - Query metadata
 */
async function getQueryMetadata(queryName) {
    try {
        const query = await loadQuery(queryName);
        
        // Extract metadata from comments
        const lines = query.split('\n');
        const metadata = {
            name: queryName,
            description: '',
            parameters: [],
            output: []
        };
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('--')) {
                const comment = trimmed.substring(2).trim();
                
                if (comment.startsWith('Description:')) {
                    metadata.description = comment.substring(12).trim();
                } else if (comment.startsWith('Parameters:')) {
                    metadata.parameters = comment.substring(11).trim();
                } else if (comment.startsWith('Output:')) {
                    metadata.output = comment.substring(7).trim();
                }
            } else if (trimmed && !trimmed.startsWith('--')) {
                break; // Stop at first non-comment line
            }
        }
        
        return metadata;
    } catch (error) {
        console.error(`Error getting metadata for query ${queryName}:`, error);
        return { name: queryName, description: '', parameters: [], output: [] };
    }
}

module.exports = {
    executeQuery,
    loadQuery,
    listQueries,
    getQueryMetadata,
    pollQueryExecution
}; 