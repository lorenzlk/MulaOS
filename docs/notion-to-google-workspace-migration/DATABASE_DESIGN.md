# Database Design: Google Sheets Structure

## Master Database Spreadsheet

**Name**: `MulaOS_Database`

**Location**: Google Drive → `MulaOS/` folder

## Sheet Structure

### 1. Accounts Sheet (Companies/Partners)

**Purpose**: Store all company/partner information (Publishers, Channels, Demand partners, etc.)

| Column Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| ID | URL | Yes | Unique identifier (publisher's website URL) | https://twsn.net |
| Account Name | Text | Yes | Company/partner name | TWSN |
| Website Domain | Text | No | Publisher's website domain | twsn.net |
| Type | Dropdown | Yes | Company type | Publisher, Channel, Demand, Data, LLM Chat App |
| Segment | Dropdown | Yes | Tier/segment | Tier 1, Tier 2, Tier 3 |
| Stage | Dropdown | Yes | Current stage | Pilot Live, Live, Onboarding, GTM, Paused, Signed, N/A |
| Widgets | Dropdown | No | Widget types (multiple allowed) | Smart-Scroll, Top-Shelf, or "Smart-Scroll, Top-Shelf" |
| Platform | Dropdown | No | Platform types (multiple allowed) | Desktop, Mobile, or "Desktop, Mobile" |
| KVP Enabled | Dropdown | No | KVP enabled | Yes, No, NA |
| Goal RPM/RPS | Currency | No | Goal RPM or RPS | 3.00 |
| Launch Date | Date | No | Launch date | 2025-08-01 |
| Last Updated | Date | Yes | Auto-updated | 2025-11-07 |
| Mula Product Roadmap | URL | No | Roadmap link | https://notion.so/... |
| Related Projects | Text | No | Comma-separated project IDs | PROJ-123,PROJ-456 |
| Created Date | Date | Yes | Auto-generated | 2025-11-07 |
| Notes | Text | No | Additional notes | |

**Lookup Values**:
- Type: Publisher, Channel, Demand, Data, LLM Chat App
- Segment: Tier 1, Tier 2, Tier 3
- Stage: Pilot Live, Live, Onboarding, GTM, Paused, Signed, N/A
- KVP Enabled: Yes, No, NA
- Widgets: Smart-Scroll, Top-Shelf (can be comma-separated)
- Platform: Desktop, Mobile, Desktop, Mobile (multiple selections allowed via comma-separated dropdown)

**Apps Script Functions**:
- `generateAccountID(accountName)` - Creates URL-based ID: https://mula.com/pubs/{name}
- `validateAccountName(name)` - Checks for duplicates
- `getAccountPrograms(accountID)` - Returns related programs

---

### 2. Contacts Sheet

**Purpose**: Store all contact information (CRM)

| Column Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| ID | URL | Yes | Unique identifier (URL-based) | https://mula.com/contacts/user@example.com |
| First Name | Text | Yes | Contact first name | John |
| Last Name | Text | Yes | Contact last name | Doe |
| Email | Email | Yes | Primary email address | john@example.com |
| Title | Text | No | Job title | Editor, CEO, Founder |
| Phone | Text | No | Phone number | +1-555-0123 |
| Account IDs | Text | No | Comma-separated Account IDs | ACC-123,ACC-456 |
| Related Companies | Text | No | Company names (for reference) | On3, RevContent |
| Status | Dropdown | Yes | Contact status | Active, Inactive |
| Last Update | Date | No | Last update date | 2025-09-10 |
| Created Date | Date | Yes | Auto-generated | 2025-11-07 |
| Notes | Text | No | Additional notes | Handles content ops |

**Lookup Values**:
- Status: Active, Inactive
- Account IDs: Links to Accounts sheet (comma-separated for multiple companies)

**Apps Script Functions**:
- `generateContactID()` - Creates CON-{uuid}
- `validateEmail(email)` - Validates email format
- `checkDuplicate(email)` - Checks for existing contact
- `linkToAccount(contactID, accountID)` - Links contact to account

---

### 3. Programs Sheet

**Purpose**: Track pilot programs and partnerships

| Column Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| ID | URL | Yes | Unique identifier (URL-based) | https://mula.com/programs/on3-pilot |
| Program Name | Text | Yes | Program name | On3 Pilot Program |
| Account ID | Lookup | Yes | Link to Accounts | https://mula.com/pubs/on3 |
| Company | Text | Yes | Company name | On3 |
| Status | Dropdown | Yes | Program status | Active, Onboarding, Pipeline, Churned, Inactive |
| Phase | Dropdown | Yes | Program phase | Live, Onboarding, Inactive |
| Widgets | Dropdown | No | Widget types (multiple allowed) | Smart-Scroll, Top-Shelf, or "Smart-Scroll, Top-Shelf" |
| Platform | Dropdown | No | Platform types (multiple allowed) | Desktop, Mobile, or "Desktop, Mobile" |
| KVP | Dropdown | No | KVP enabled | Yes, No, NA |
| Health | Dropdown | No | Program health | Good, Needs Improvement, At Risk, Unknown |
| Goal | Text | No | Program goal | Evaluate where $2-3 RPM baseline sits |
| Next Steps | Text | No | Next steps | Grow pageviews |
| Leading KPI | Text | No | Leading KPIs | Activation speed, Revenue Velocity |
| Lagging KPI | Text | No | Lagging KPIs | Revenue lift, expansion |
| Pilot Start Date | Date | No | Pilot start date | 2025-07-01 |
| Baseline RPM | Currency | No | Baseline RPM | 2.50 |
| RPM Lift | Currency | No | Incremental RPM lift | 1.00 |
| Pageview Percent | Percentage | No | Mula % pageviews | 0.015 |
| Revenue Data URL | URL | No | Revenue data sheet link | https://docs.google.com/... |
| Created Date | Date | Yes | Auto-generated | 2025-11-07 |
| Last Updated | Date | Yes | Auto-updated | 2025-11-07 |
| Notes | Text | No | Additional notes | |

**Lookup Values**:
- Status: Active, Onboarding, Pipeline, Churned, Inactive
- Phase: Live, Onboarding, Inactive
- Health: Good, Needs Improvement, At Risk, Unknown
- KVP: Yes, No, NA
- Widgets: Smart-Scroll, Top-Shelf, Smart-Scroll, Top-Shelf (multiple selections allowed via comma-separated dropdown)
- Platform: Desktop, Mobile, Desktop, Mobile (multiple selections allowed via comma-separated dropdown)
- Account ID: Links to Accounts sheet

**Relationships**:
- Account ID → Accounts.ID (lookup)

**Apps Script Functions**:
- `getAccountPrograms(accountID)` - Returns all programs for account
- `updateProgramHealth(programID, health)` - Updates health status
- `calculateProgramMetrics(programID)` - Calculates KPIs

---

### 4. Deals Sheet (Optional - for future use)

**Purpose**: Track sales deals through pipeline

| Column Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| ID | Text | Yes | Unique identifier | DEAL-xyz67890 |
| Deal Name | Text | Yes | Deal name | Q4 Enterprise Deal |
| Contact ID | Text | Yes | Link to Contacts | CON-abc12345 |
| Company | Text | Yes | Company name | Acme Corp |
| Value | Currency | Yes | Deal value | $50,000 |
| Currency | Text | Yes | Currency code | USD |
| Stage | Dropdown | Yes | Pipeline stage | Qualified, Proposal, Negotiation, Closed Won, Closed Lost |
| Probability | Percentage | Yes | Win probability | 75% |
| Owner | Dropdown | Yes | Deal owner | Jane Smith |
| Created Date | Date | Yes | Auto-generated | 2025-11-01 |
| Close Date | Date | No | Expected close date | 2025-12-31 |
| Last Updated | Date | Yes | Auto-updated | 2025-11-07 |
| Status | Dropdown | Yes | Deal status | Open, Won, Lost |
| Notes | Text | No | Deal notes | Key decision maker is CEO |

**Lookup Values**:
- Stage: Qualified, Discovery, Proposal, Negotiation, Closed Won, Closed Lost
- Status: Open, Won, Lost, Abandoned
- Owner: [Team member names]

**Relationships**:
- Contact ID → Contacts.ID (lookup)

**Apps Script Functions**:
- `getContactInfo(contactID)` - Returns contact details
- `updateDealStage(dealID, newStage)` - Updates stage and logs activity
- `calculatePipelineValue()` - Sums all open deals

---

### 5. Projects Sheet

**Purpose**: Track projects and initiatives

| Column Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| ID | URL | Yes | Unique identifier (URL-based) | https://mula.com/projects/on3-launch |
| Project Name | Text | Yes | Project name | On3 Launch |
| Summary | Text | No | Project summary | Project description |
| Status | Dropdown | Yes | Project status | Done, In Progress, Planning, Backlog |
| Owner | Dropdown | Yes | Project owner | Logan Lorenz, Jason White, Kale McNaney |
| Priority | Dropdown | Yes | Priority level | High, Medium, Low |
| Completion | Percentage | No | Completion percentage | 0.75 (75%) |
| Dates | Date | No | Project dates | 2025-07-28 |
| Last Updated | Date | Yes | Auto-updated | 2025-11-07 |
| Created Date | Date | Yes | Auto-generated | 2025-11-07 |
| Related Account IDs | Text | No | Comma-separated Account IDs | ACC-123 |
| Notes | Text | No | Additional notes | |

**Lookup Values**:
- Status: Done, In Progress, Planning, Backlog
- Priority: High, Medium, Low
- Owner: Logan Lorenz, Jason White, Kale McNaney, [Other team members]

**Apps Script Functions**:
- `calculateProjectCompletion(projectID)` - Calculates % complete from tasks
- `getProjectTasks(projectID)` - Returns all tasks for project
- `updateProjectStatus(projectID, newStatus)` - Updates status
- `getAccountProjects(accountID)` - Returns all projects for account

---

### 6. Tasks Sheet

**Purpose**: Track individual tasks

| Column Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| ID | URL | Yes | Unique identifier (URL-based) | https://mula.com/tasks/on3-launch/task-name |
| Task Name | Text | Yes | Task name | On3 launch Michigan section |
| Project ID | Lookup | Yes | Link to Projects | https://mula.com/projects/on3-launch |
| Assignee | Text | No | Assigned to (comma-separated) | Logan Lorenz, Kale McNaney |
| Status | Dropdown | Yes | Task status | Done, In Progress, Not Started |
| Priority | Dropdown | No | Priority level | High, Medium, Low |
| Due Date | Date | No | Task due date | 2025-09-15 |
| Completed Date | Date | No | Completion date | 2025-09-12 |
| Parent Task ID | Lookup | No | Parent task (for subtasks) | TASK-11111111 |
| Sub Tasks | Text | No | Comma-separated subtask IDs | TASK-22222222,TASK-33333333 |
| Place | Text | No | Place/location | |
| Tags | Text | No | Comma-separated tags | Programmatic, Affiliate |
| Last Updated | Date | Yes | Auto-updated | 2025-11-07 |
| Created Date | Date | Yes | Auto-generated | 2025-11-07 |
| Notes | Text | No | Task notes | |

**Lookup Values**:
- Status: Done, In Progress, Not Started
- Priority: High, Medium, Low
- Project ID: Links to Projects sheet
- Parent Task ID: Links to Tasks sheet (self-reference)

**Relationships**:
- Project ID → Projects.ID (lookup)
- Parent Task ID → Tasks.ID (lookup, optional)

**Apps Script Functions**:
- `getProjectTasks(projectID)` - Returns all tasks for project
- `getAccountTasks(accountID)` - Returns all tasks for account (via projects)
- `getSubTasks(taskID)` - Returns all subtasks for a task
- `updateTaskStatus(taskID, newStatus)` - Updates status and logs

---

### 7. Roadmap Sheet (Optional - for future use)

**Purpose**: Track product features and releases

| Column Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| ID | Text | Yes | Unique identifier | FEAT-abcdefgh |
| Feature Name | Text | Yes | Feature name | User Dashboard |
| Description | Text | No | Feature description | New user dashboard with analytics |
| Status | Dropdown | Yes | Feature status | Planned, In Progress, Testing, Shipped, Cancelled |
| Priority | Dropdown | Yes | Priority level | P0, P1, P2, P3 |
| Target Release | Text | No | Release version | Q1 2026 |
| Release Date | Date | No | Target release date | 2026-03-31 |
| Owner | Dropdown | Yes | Feature owner | John Doe |
| Dependencies | Text | No | Comma-separated feature IDs | FEAT-11111111 |
| Created Date | Date | Yes | Auto-generated | 2025-11-01 |
| Updated Date | Date | Yes | Auto-updated | 2025-11-07 |
| Tags | Text | No | Comma-separated tags | frontend,analytics |
| Notes | Text | No | Feature notes | Requires API v2 |

**Lookup Values**:
- Status: Planned, In Progress, Testing, Shipped, Cancelled
- Priority: P0, P1, P2, P3
- Owner: [Team member names]

**Apps Script Functions**:
- `getReleaseFeatures(release)` - Returns all features for release
- `checkDependencies(featureID)` - Validates dependencies
- `updateFeatureStatus(featureID, newStatus)` - Updates status

---

### 6. Activity Log Sheet

**Purpose**: Track all changes and activities across all entities

| Column Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| ID | Text | Yes | Unique identifier | ACT-12345678 |
| Timestamp | DateTime | Yes | Auto-generated | 2025-11-07 10:30:00 |
| Entity Type | Dropdown | Yes | Type of entity | Contact, Deal, Project, Task, Feature |
| Entity ID | Text | Yes | ID of changed entity | CON-abc12345 |
| Action | Dropdown | Yes | Action performed | Created, Updated, Deleted, Status Changed |
| User | Text | Yes | User who made change | Jane Smith |
| Field | Text | No | Field that changed | Status |
| Old Value | Text | No | Previous value | Active |
| New Value | Text | No | New value | Inactive |
| Details | Text | No | Additional details | Contact marked as inactive |

**Lookup Values**:
- Entity Type: Contact, Deal, Project, Task, Feature
- Action: Created, Updated, Deleted, Status Changed, Assigned

**Apps Script Functions**:
- `logActivity(entityType, entityID, action, details)` - Logs activity
- `getEntityHistory(entityType, entityID)` - Returns activity history
- `getUserActivity(user, dateRange)` - Returns user's activities

---

### 7. Lookups Sheet

**Purpose**: Centralized lookup values and reference data

| Column Name | Type | Description |
|------------|------|-------------|
| Category | Text | Lookup category |
| Value | Text | Lookup value |
| Display Order | Number | Sort order |
| Active | Boolean | Is this value active? |

**Categories**:
- Status (Contacts)
- Status (Deals)
- Status (Projects)
- Status (Tasks)
- Status (Features)
- Priority
- Deal Stages
- Team Members
- Tags

**Apps Script Functions**:
- `getLookupValues(category)` - Returns active values for category
- `addLookupValue(category, value)` - Adds new lookup value

---

## Data Relationships

```
Accounts (30)
  ├── Contacts (many-to-many via Account IDs)
  ├── Programs (one-to-many via company name)
  └── Projects (many-to-many via Related Projects)

Projects (22)
  └── Tasks (one-to-many via Project ID)

Tasks (42)
  └── Tasks (self-referential via Parent Task ID for subtasks)

All Entities ──→ (Many) Activity Log
```

## Sheet Protection

- **Headers Row**: Protected (cannot edit)
- **ID Columns**: Protected (auto-generated)
- **Created Date**: Protected (auto-generated)
- **Last Updated**: Protected (auto-updated)
- **Formulas**: Protected (calculated fields)

## Data Validation Rules

1. **Email Format**: Contacts.Email must be valid email
2. **Date Ranges**: End dates must be after start dates
3. **Percentages**: Must be 0-100%
4. **Currency**: Must be positive numbers
5. **Required Fields**: Cannot be empty
6. **Lookup Values**: Must match dropdown options
7. **Relationships**: IDs must exist in related sheets

## Performance Considerations

1. **Row Limits**: Google Sheets supports 10 million cells
2. **Query Optimization**: Use Apps Script for complex queries
3. **Filtered Views**: Create separate sheets for common filters
4. **Caching**: Cache lookup tables in Apps Script
5. **Batch Operations**: Use batch updates for bulk changes

## Backup Strategy

1. **Daily Backups**: Apps Script time-driven trigger
2. **Version History**: Google Sheets native version history
3. **Export**: Weekly CSV exports to Google Drive
4. **Archive**: Move old records to Archive sheets

