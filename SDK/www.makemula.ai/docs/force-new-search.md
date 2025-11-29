# Force New Search Functionality

## Overview

The Force New Search feature allows users to reset the search state for a page and initiate a completely new search, even if the page already has approved search results. This is useful when:

- The current products are no longer relevant
- You want to try different keywords or search strategies
- The page content has been updated
- You want to experiment with different product recommendations

## How It Works

When a force new search is triggered, the system:

1. **Resets Page State**: Clears all search-related fields on the page
2. **Clears Search History**: Removes the current search association
3. **Initiates New Search**: Queues a fresh search job with new keywords
4. **Maintains Page Record**: Keeps the page URL and basic information intact

### Fields Reset During Force New Search

- `searchId`: Set to `null` (removes association with current search)
- `searchIdStatus`: Set to `'pending'` (resets approval status)
- `searchStatus`: Set to `'pending'` (resets search process status)
- `searchAttempts`: Cleared to empty array
- `keywordFeedback`: Set to `null` (clears any previous feedback)

## Usage

### Web Interface

1. Navigate to a page that has approved search results
2. Click the **"Force New Search"** button (yellow warning button)
3. Confirm the action in the dialog
4. The page will refresh and show the searching state
5. New search results will be generated and sent for approval

### Slack Command

Use the `/mula-remulaize` command:

```
/mula-remulaize https://example.com/article
```

or

```
/mula-remulaize example.com/article
```

The command will:
- Find the page by URL
- Reset the search state
- Queue a new search
- Provide a link to track progress

## API Endpoint

### POST `/pages/:id/remulaize`

**Authentication**: Required

**Request Body**: None

**Response**:
```json
{
  "message": "Remulaization initiated successfully",
  "pageId": 123
}
```

**Error Responses**:
- `404`: Page not found
- `500`: Internal server error

## Technical Implementation

### Database Changes

No new database schema changes are required. The feature uses existing fields:

- `pages.searchId` - Foreign key to searches table
- `pages.searchIdStatus` - Approval status enum
- `pages.searchStatus` - Search process status
- `pages.searchAttempts` - JSONB array of attempted searches
- `pages.keywordFeedback` - Text field for feedback

### Search Orchestration

The force new search integrates with the existing search orchestration system:

1. **Search Queue**: Uses the existing `searchQueue` (Bull/Redis)
2. **Search Worker**: Leverages existing `searchWorker.js`
3. **Search Orchestrator**: Uses the same `SearchOrchestrator` class
4. **Approval Workflow**: Follows the same approval process as new searches

### State Management

The page state transitions:

```
Approved/Error → Force New Search → Pending → Searching → Awaiting Approval → Approved
```

## Testing

### Manual Testing

1. Create a page with approved search results
2. Use the web interface to force a new search
3. Verify the page state resets correctly
4. Confirm new search results are generated
5. Test the approval workflow

### Automated Testing

Run the test script:

```bash
cd www.makemula.ai
node scripts/test-force-new-search.js
```

The test script:
- Finds an approved page or creates a test page
- Simulates the force new search process
- Verifies all fields are reset correctly
- Restores the original state

## Error Handling

### Common Scenarios

1. **Page Not Found**: Returns 404 with helpful message
2. **Invalid URL**: Validates URL format before processing
3. **Search Queue Failure**: Logs error and returns 500
4. **Database Errors**: Handles transaction failures gracefully

### Logging

All force new search operations are logged with:
- Page ID and URL
- Original and new state
- Success/failure status
- Error details if applicable

## Security Considerations

- **Authentication Required**: All endpoints require authentication
- **URL Validation**: Input URLs are validated and sanitized
- **Rate Limiting**: Consider implementing rate limits for production
- **Audit Trail**: All operations are logged for audit purposes

## Future Enhancements

Potential improvements to consider:

1. **Bulk Operations**: Force new search for multiple pages
2. **Scheduled Resets**: Automatically refresh searches after a time period
3. **Search Strategy Selection**: Choose specific search strategies
4. **Feedback Integration**: Include previous feedback in new searches
5. **Analytics**: Track force new search usage and success rates

## Troubleshooting

### Common Issues

1. **Page Not Found in Slack Command**
   - Verify the URL exists in the system
   - Use `/mulaize` to create the page first

2. **Search Not Starting**
   - Check Redis connection for search queue
   - Verify search worker is running
   - Check logs for error details

3. **State Not Resetting**
   - Verify database permissions
   - Check for transaction conflicts
   - Review page model constraints

### Debug Commands

```bash
# Check page state
curl -X GET "https://www.makemula.ai/pages/123" -H "Authorization: Bearer <token>"

# Force new search via API
curl -X POST "https://www.makemula.ai/pages/123/remulaize" -H "Authorization: Bearer <token>"

# Check search queue status
redis-cli LLEN searchQueue
``` 