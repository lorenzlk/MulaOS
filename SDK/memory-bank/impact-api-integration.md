# Impact API Integration

## Overview
Production-ready data collection system for individual click and action records from Impact API, enabling detailed A/B test analysis with subId2 session tracking for on3.com experiments.

## Core Components

### ImpactDataCollector.js
**Location**: `www.makemula.ai/helpers/ImpactDataCollector.js`

**Purpose**: Main production class for collecting individual click and action records from Impact API with detailed attribution fields.

**Key Features**:
- **Click Records**: Uses ClickExport endpoint for individual click events
- **Action Records**: Uses ReportExport endpoint with mp_action_listing_fast report
- **Attribution Fields**: Extracts subId1, subId2, subId3 for detailed tracking
- **Rich Data**: Includes device info, geographic data, campaign details, revenue data
- **Async Processing**: Handles job polling and result downloading
- **Error Handling**: Comprehensive error handling with detailed logging

**API Endpoints Used**:
- `ClickExport` - Individual click records with detailed attribution
- `ReportExport/mp_action_listing_fast` - Individual action records with revenue data

**Data Processing**:
- Handles different data formats (Clicks array vs Records array)
- Extracts attribution fields (subId1, subId2, subId3)
- Processes rich metadata (device, geographic, campaign data)
- Maps to standardized data structure

### test-impact-data-collection.js
**Location**: `www.makemula.ai/scripts/test-impact-data-collection.js`

**Purpose**: Comprehensive test and documentation script for ImpactDataCollector.

**Features**:
- **Validation**: Tests both click and action collection
- **Data Analysis**: Analyzes subId2/subId3 presence and attribution
- **Usage Examples**: Demonstrates proper usage patterns
- **Error Handling**: Comprehensive error handling and reporting

## Data Collection Capabilities

### Individual Click Records
- **Source**: ClickExport endpoint
- **Volume**: 41+ click records collected in test
- **Attribution**: subId2 values present in 22 out of 41 clicks (53% coverage)
- **Rich Metadata**: Device type, browser, OS, geographic location, campaign data

**Sample Click Record**:
```json
{
  "subId1": "mula",
  "subId2": "a4b958e0-b076-4e42-bea8-0e8003b7438d",
  "subId3": null,
  "clickId": "05nxnzRGMxycUbHTvQRwuW18Ukp1njTRR2kPyQ0",
  "clickDate": "2025-09-21T01:01:38-04:00",
  "campaignName": "Fanatics (Global)",
  "deviceType": "PHONE",
  "browser": "Safari",
  "operatingSystem": "iOS",
  "country": "US",
  "region": "Michigan",
  "city": "Saint Joseph"
}
```

### Individual Action Records
- **Source**: ReportExport/mp_action_listing_fast report
- **Volume**: 37+ action records collected in test
- **Revenue Data**: Earnings, sale amounts, conversion details
- **Attribution**: subId1, subId2, subId3 fields available

**Sample Action Record**:
```json
{
  "subId1": "mula",
  "subId2": null,
  "subId3": null,
  "actionId": "action_123",
  "actionDate": "2025-09-20T17:11:15-04:00",
  "earnings": 1.10,
  "saleAmount": 21.99,
  "actionTracker": "Online Sale",
  "campaignName": "Fanatics (Global)"
}
```

## A/B Test Analysis Integration

### Session Attribution
- **subId2 Tracking**: Use subId2 values to track which A/B test variants drive conversions
- **Session Mapping**: Link subId2 to A/B test variant assignments
- **Conversion Analysis**: Analyze click-to-conversion funnel by variant

### Revenue Attribution
- **Action Linking**: Link individual actions to specific test variants via subId2
- **Revenue Tracking**: Track revenue back to specific test variants
- **Performance Metrics**: Calculate variant-specific CTR, RPS, and conversion rates

### Usage Pattern
```javascript
const collector = new ImpactDataCollector();
const data = await collector.getClickAndActionData({
  startDate: '2025-09-14',
  endDate: '2025-09-21',
  subId1: 'mula'
});

// Analyze by subId2 (session ID) to see which variants convert
const variantAnalysis = analyzeByVariant(data.clicks, data.actions);
```

## Technical Implementation

### API Authentication
- **Configuration**: Uses Impact API settings from `config/index.js`
- **Authentication**: Basic auth with username/password
- **Endpoints**: Properly configured baseUrl and accountId

### Job Management
- **Async Processing**: Creates export jobs and polls for completion
- **Job Polling**: Configurable polling intervals and max attempts
- **Result Download**: Handles redirect URLs and file downloads
- **Error Handling**: Comprehensive error handling for job failures

### Data Processing
- **Format Handling**: Handles different data formats from different endpoints
- **Field Mapping**: Maps API fields to standardized internal format
- **Attribution Extraction**: Extracts subId1, subId2, subId3 fields
- **Metadata Processing**: Processes device, geographic, and campaign data

## Business Value

### A/B Test Analysis
- **Variant Performance**: Enable detailed analysis of which variants drive most conversions
- **Revenue Attribution**: Track revenue back to specific test variants
- **Session Tracking**: Use subId2 to understand user journey through test variants
- **Performance Optimization**: Data-driven decisions for variant selection

### Conversion Funnel Analysis
- **Click Tracking**: Individual click records with detailed attribution
- **Action Tracking**: Individual action records with revenue data
- **Funnel Analysis**: Complete click-to-conversion analysis by variant
- **Performance Metrics**: Variant-specific CTR, RPS, and conversion rates

## Next Steps for A/B Test Analysis

### Integration with A/B Test System
1. **Connect subId2 Tracking**: Link subId2 values to A/B test variant assignments
2. **Revenue Attribution**: Link actions to specific variants for RPS calculation
3. **Conversion Analysis**: Build conversion funnel analysis by variant
4. **Performance Reports**: Create variant-specific performance dashboards

### Implementation Tasks
1. **Variant Mapping**: Create mapping between subId2 and A/B test variants
2. **Analytics Queries**: Build Athena queries for variant-specific analysis
3. **Reporting Dashboard**: Create reports showing variant performance
4. **Automated Analysis**: Set up automated analysis for ongoing experiments

## File Structure
```
www.makemula.ai/
├── helpers/
│   └── ImpactDataCollector.js          # Main production class
└── scripts/
    └── test-impact-data-collection.js  # Test and documentation script
```

## Dependencies
- **Impact API**: Requires valid Impact API credentials
- **Node.js**: Standard Node.js environment
- **HTTPS**: Built-in Node.js https module
- **Config**: Uses existing config system for API credentials

## Usage Examples

### Basic Data Collection
```javascript
const { ImpactDataCollector } = require('./helpers/ImpactDataCollector');
const collector = new ImpactDataCollector();

// Collect click and action data
const data = await collector.getClickAndActionData({
  startDate: '2025-09-14',
  endDate: '2025-09-21',
  subId1: 'mula'
});

console.log(`Found ${data.clicks.length} clicks and ${data.actions.length} actions`);
```

### A/B Test Analysis
```javascript
// Analyze by subId2 to see which variants convert
const clicksWithSubId2 = data.clicks.filter(click => click.subId2);
const actionsWithSubId2 = data.actions.filter(action => action.subId2);

// Group by subId2 to analyze variant performance
const variantAnalysis = groupByVariant(clicksWithSubId2, actionsWithSubId2);
```

## Error Handling
- **API Failures**: Comprehensive error handling for API failures
- **Job Failures**: Handles job creation and polling failures
- **Data Processing**: Graceful handling of malformed data
- **Logging**: Detailed logging for debugging and monitoring

## Production Readiness
- **Clean Code**: Well-documented, production-ready code
- **Error Handling**: Comprehensive error handling throughout
- **Logging**: Detailed logging for monitoring and debugging
- **Documentation**: Complete documentation and usage examples
- **Testing**: Comprehensive test script for validation
