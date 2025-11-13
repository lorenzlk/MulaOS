# Architecture Document: Notion to Google Workspace Migration

## Project Name
Notion to Google Workspace Migration

## Version
1.0.0

## Date
November 2025

---

## 1. Overview

This system replicates Notion's CRM, project tracking, roadmap, and operations functionality using Google Workspace tools (Sheets, Drive, Docs), enhanced with Google Apps Script for custom functionality, and integrated with Pipedream for automation.

## 2. System Architecture

### 2.1 High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  Google Sheets (UI) | Google Forms | Google Docs | Sites   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│              Google Apps Script Functions                    │
│  • Custom menu items                                        │
│  • Data validation                                         │
│  • Relationship management                                 │
│  • Automated workflows                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Storage Layer                        │
│              Google Sheets (Database)                        │
│  • Contacts Sheet                                           │
│  • Deals Sheet                                              │
│  • Projects Sheet                                           │
│  • Tasks Sheet                                              │
│  • Roadmap Sheet                                            │
│  • Activity Log Sheet                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Automation & Integration Layer               │
│                    Pipedream Workflows                       │
│  • Data sync workflows                                      │
│  • Notification workflows                                   │
│  • Reporting workflows                                      │
│  • Integration workflows                                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

#### 2.2.1 Google Sheets Database Structure

**Master Database Spreadsheet: `MulaOS_Database`**

Each entity type gets its own sheet:

1. **Contacts Sheet**
   - Columns: ID, First Name, Last Name, Email, Company, Role, Phone, Tags, Created Date, Last Updated, Owner, Status, Notes
   - Unique ID: `CON-{timestamp}` or `CON-{increment}`

2. **Deals Sheet**
   - Columns: ID, Deal Name, Contact ID, Company, Value, Currency, Stage, Probability, Owner, Created Date, Close Date, Last Updated, Status, Notes
   - Unique ID: `DEAL-{timestamp}`
   - Links to Contacts via Contact ID

3. **Projects Sheet**
   - Columns: ID, Project Name, Description, Status, Owner, Team Members, Start Date, End Date, Created Date, Last Updated, Priority, Tags, Notes
   - Unique ID: `PROJ-{timestamp}`

4. **Tasks Sheet**
   - Columns: ID, Task Name, Description, Project ID, Assignee, Status, Priority, Due Date, Created Date, Completed Date, Tags, Notes
   - Unique ID: `TASK-{timestamp}`
   - Links to Projects via Project ID

5. **Roadmap Sheet**
   - Columns: ID, Feature Name, Description, Status, Priority, Target Release, Owner, Dependencies, Created Date, Updated Date, Tags, Notes
   - Unique ID: `FEAT-{timestamp}`

6. **Activity Log Sheet**
   - Columns: ID, Entity Type, Entity ID, Action, User, Timestamp, Details, Changes
   - Unique ID: `ACT-{timestamp}`
   - Tracks all changes across entities

7. **Lookup Tables**
   - Status Options
   - Priority Levels
   - Deal Stages
   - Tags
   - Users/Team Members

#### 2.2.2 Google Apps Script Functions

**File: `Code.gs` (in Apps Script editor)**

```javascript
// Custom menu
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('MulaOS')
    .addItem('Add Contact', 'showContactForm')
    .addItem('Add Deal', 'showDealForm')
    .addItem('Add Task', 'showTaskForm')
    .addItem('Generate Report', 'generateReport')
    .addToUi();
}

// Generate unique IDs
function generateID(prefix) {
  return prefix + '-' + Utilities.getUuid().substring(0, 8);
}

// Get related records
function getRelatedTasks(projectID) {
  // Query Tasks sheet for matching Project ID
}

// Data validation
function validateContact(email) {
  // Validate email format, check duplicates
}

// Automated workflows
function updateDealStage(dealID, newStage) {
  // Update deal, log activity, trigger notifications
}
```

#### 2.2.3 Pipedream Workflows

**Workflow Categories:**

1. **Data Sync Workflows**
   - Notion → Google Sheets (one-time migration)
   - External data → Google Sheets (ongoing syncs)
   - Google Sheets → External systems

2. **Notification Workflows**
   - Task assignment notifications
   - Deal stage change alerts
   - Project deadline reminders
   - Daily/weekly summaries

3. **Reporting Workflows**
   - Weekly CRM reports
   - Project status reports
   - Roadmap updates
   - Activity summaries

4. **Integration Workflows**
   - Email → Google Sheets (contact creation)
   - Calendar → Google Sheets (meeting notes)
   - Slack → Google Sheets (updates)

## 3. Data Flow

### 3.1 Contact Creation Flow
```
User fills Google Form
    ↓
Form submits to Contacts Sheet
    ↓
Apps Script validates data
    ↓
Generates unique ID
    ↓
Logs activity
    ↓
Pipedream workflow triggered (webhook)
    ↓
Sends notification
```

### 3.2 Deal Update Flow
```
User updates Deal in Sheet
    ↓
Apps Script detects change (onEdit trigger)
    ↓
Validates stage transition
    ↓
Updates related fields
    ↓
Logs activity
    ↓
Pipedream workflow triggered
    ↓
Sends notification to owner
    ↓
Updates reporting dashboard
```

### 3.3 Task Assignment Flow
```
User assigns task via Sheet
    ↓
Apps Script validates assignment
    ↓
Updates task status
    ↓
Pipedream workflow triggered
    ↓
Sends Slack/Email notification
    ↓
Updates project progress
```

## 4. Technology Stack

### Core Platform
- **Google Sheets** - Primary database and UI
- **Google Forms** - Data entry forms
- **Google Drive** - File storage and attachments
- **Google Docs** - Rich documentation
- **Google Sites** - Knowledge base (optional)

### Automation
- **Pipedream** - Workflow automation platform
  - Google Sheets API integration
  - Webhook triggers
  - Scheduled workflows
  - Notification integrations (Slack, Email)

### Customization
- **Google Apps Script** - JavaScript-based automation
  - Custom functions
  - Menu items
  - Triggers (onEdit, onOpen, time-driven)
  - API integrations

### APIs Used
- Google Sheets API (via Pipedream)
- Google Drive API (via Pipedream)
- Google Apps Script API
- Webhook APIs for triggers

## 5. Key Files/Modules

### Google Sheets Structure
- `MulaOS_Database` - Main database spreadsheet
  - Sheet: Contacts
  - Sheet: Deals
  - Sheet: Projects
  - Sheet: Tasks
  - Sheet: Roadmap
  - Sheet: Activity Log
  - Sheet: Lookups

### Apps Script Files
- `Code.gs` - Main script file
  - Menu functions
  - ID generation
  - Data validation
  - Relationship queries
  - Automated workflows

### Pipedream Workflows
- `notion-migration-workflow.js` - One-time migration
- `contact-sync-workflow.js` - Contact synchronization
- `task-notification-workflow.js` - Task notifications
- `deal-pipeline-workflow.js` - Deal management
- `reporting-workflow.js` - Automated reports

## 6. Authentication & Security

### Google Workspace
- OAuth 2.0 for API access
- Service account for Pipedream
- Domain-wide delegation for Apps Script
- Role-based access control via Sheet sharing

### Pipedream
- API keys stored in Pipedream secrets
- Webhook authentication tokens
- Environment variables for sensitive data

### Data Security
- Protected ranges in Sheets (formulas, headers)
- Data validation rules
- Audit logging via Activity Log sheet
- Regular backups to Google Drive

## 7. Error Handling

### Apps Script
- Try-catch blocks for all functions
- Error logging to dedicated Error Log sheet
- User-friendly error messages
- Retry logic for API calls

### Pipedream
- Error handling in each step
- Retry configuration
- Failure notifications
- Error logging to monitoring sheet

## 8. Rate Limiting

### Google Sheets API
- 100 requests per 100 seconds per user (default)
- Batch requests where possible
- Caching frequently accessed data
- Queuing for high-volume operations

### Apps Script
- 6-minute execution time limit
- 20,000 URL fetch calls per day
- Optimize scripts for performance

## 9. Monitoring & Logging

### Activity Logging
- All changes logged to Activity Log sheet
- User, timestamp, action, entity tracked
- Change history maintained

### Error Logging
- Errors logged to Error Log sheet
- Pipedream workflow failures tracked
- Apps Script execution logs

### Performance Monitoring
- Track workflow execution times
- Monitor API quota usage
- User activity metrics

## 10. Scalability Considerations

### Data Volume
- Current: ~1000 records per entity
- Future: Support 10,000+ records
- Solutions:
  - Archive old records
  - Use Apps Script for queries instead of formulas
  - Implement pagination for views

### Performance
- Optimize Apps Script functions
- Use batch operations
- Cache lookup tables
- Minimize API calls

### Team Growth
- Template-based onboarding
- Role-based access control
- Training documentation
- Standardized processes

## 11. Cost Analysis

### Monthly Costs
- **Google Workspace**: $0 (existing licenses)
- **Pipedream**: $0 (free tier sufficient)
- **Apps Script**: $0 (included with Workspace)
- **Total**: $0/month

### One-Time Costs
- Development time: ~40-60 hours
- Migration time: ~10-20 hours
- Training time: ~5-10 hours

## 12. Migration Architecture

### Phase 1: Data Export
- Export Notion data (CSV/JSON)
- Parse and normalize structure
- Map to Google Sheets schema

### Phase 2: Data Import
- Create Google Sheets structure
- Import data via Apps Script or Pipedream
- Validate data integrity
- Generate relationships

### Phase 3: Workflow Setup
- Build Apps Script functions
- Create Pipedream workflows
- Test integrations
- User training

## 13. Future Enhancements

- Advanced reporting dashboards
- Mobile app (Progressive Web App)
- AI-powered insights
- Advanced automation
- Multi-workspace support
- API for external integrations

