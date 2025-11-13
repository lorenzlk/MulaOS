# Data Mapping: Notion → Google Sheets

This document maps the exported Notion data to our Google Sheets database structure.

## Data Analysis Summary

### Entities Identified
1. **Publishers** - Publisher/company information
2. **Contacts** - People/contacts (from Gmail and relational)
3. **Programs** - Pilot programs and partnerships
4. **Tasks** - Task management

### Relationships
- Publishers ↔ Contacts (many-to-many)
- Programs ↔ Publishers (many-to-one via Company)
- Tasks ↔ Programs/Companies (many-to-one via Company)
- Contacts ↔ Programs (many-to-many, via Company)

---

## 1. Publishers → Accounts Sheet

### Source: `publishers.csv`

| Notion Column | Google Sheets Column | Type | Notes |
|--------------|---------------------|------|-------|
| Publisher | Account Name | Text | Primary identifier |
| Signed Date | Signed Date | Date | Format: YYYY-MM-DD |
| Launch Date | Launch Date | Date | Format: YYYY-MM-DD |
| Stage | Status | Dropdown | Map: Live→Active, Waiting to Launch→Onboarding, Pending→Pipeline |
| Category | Category | Text | Sports, Lifestyle, etc. |
| Target Coverage % | Target Coverage | Percentage | Convert to decimal (50 → 0.50) |
| Current Coverage % | Current Coverage | Percentage | Convert to decimal (22 → 0.22) |
| Traffic (Monthly Impressions) | Monthly Impressions | Number | Remove commas |
| RPM Baseline | RPM Baseline | Currency | $2 → 2.00 |
| Blocks | Blocks | Text | Comma-separated or multi-select |
| Owner | Owner | Dropdown | Logan, Elliott → Team member names |
| Current Gross Revenue | Current Revenue | Currency | $2800 → 2800.00 |

### Additional Fields to Add
- **ID** - Auto-generated: `ACC-{uuid}`
- **Created Date** - Migration date
- **Last Updated** - Auto-updated
- **Notes** - Additional notes field

### Mapping Rules
- **Stage Mapping**:
  - "Live" → "Active"
  - "Waiting to Launch" → "Onboarding"
  - "Pending" → "Pipeline"
- **Empty values**: Leave blank or use default values
- **Dates**: Parse and validate format

---

## 2. Contacts → Contacts Sheet

### Source: `Relational_Contacts.csv` + `Relational_Contacts_from_Gmail.csv`

| Notion Column | Google Sheets Column | Type | Notes |
|--------------|---------------------|------|-------|
| Name | First Name + Last Name | Text | Split if space exists, else First Name |
| Role | Role/Title | Text | Editor, Partnerships Lead, etc. |
| Email | Email | Email | Primary identifier, validate format |
| Phone | Phone | Text | Keep as-is |
| Company | Company | Text | Link to Accounts via lookup |
| Influence | Influence Level | Dropdown | Champion, Decision Maker, User → map to dropdown |
| Notes | Notes | Text | Additional notes |

### Additional Fields to Add
- **ID** - Auto-generated: `CON-{uuid}`
- **Account ID** - Lookup to Accounts sheet (via Company name)
- **Created Date** - Migration date
- **Last Updated** - Auto-updated
- **Status** - Default: "Active"
- **Tags** - Extract from Notes if contains "* Other Contacts"

### Data Cleaning Required
1. **Merge duplicate contacts** - Same email in both files
2. **Split names** - "Logan Lorenz" → First: "Logan", Last: "Lorenz"
3. **Company matching** - Match company names to Accounts
4. **Email validation** - Remove invalid emails
5. **Influence mapping**:
   - "Champion" → "Champion"
   - "Decision Maker" → "Decision Maker"
   - "User" → "User"
   - Empty → "Other"

### Duplicate Handling
- If email exists in both files, merge data:
  - Prefer Relational_Contacts.csv (more detailed)
  - Merge Notes fields
  - Keep most complete data

---

## 3. Programs → Programs Sheet (New Entity)

### Source: `Mula Pilot Partners 21c03985e9be80d380eccab86015869f_all.csv` (PRIMARY)

**Note**: Programs are pilot partnerships. The "Name" field is the company/publisher name. Each company has one program.

| Notion Column | Google Sheets Column | Type | Notes |
|--------------|---------------------|------|-------|
| Name | Company | Text | Company/publisher name (primary identifier) |
| Name | Program Name | Text | Generate: "{Company} Pilot Program" |
| Name | Account ID | Lookup | Link to Accounts sheet (via Company name) |
| Status | Status | Dropdown | Active – Organic Launch→Active, Paid Pilot→Active, Onboarding→Onboarding, Late‑Stage Pipeline→Pipeline, Churned→Churned, Inactive→Inactive |
| Phase | Phase | Dropdown | Live, Onboarding, Inactive |
| Widgets | Widgets | Text | Smart-Scroll, Top-Shelf, or comma-separated combination |
| Platform | Platform | Dropdown | Map: "Mobile, Web"→"Desktop, Mobile", "Mobile"→"Mobile", "Web"→"Desktop" |
| Ads | KVP | Dropdown | Yes, No, NA |
| Health | Health | Dropdown | Needs Improvement→Needs Improvement, Ok→Good, In Danger→At Risk, (empty)→Unknown |
| Goal | Goal | Text | Long text field |
| Next Steps | Next Steps | Text | Can contain URLs |
| Key KPI (Leading) | Leading KPI | Text | Comma-separated |
| Key KPI (Lagging) | Lagging KPI | Text | Comma-separated |
| Pilot Start | Pilot Start Date | Date | Parse "June '25" → "2025-06-01" |
| Baseline RPM | Baseline RPM | Currency | Parse "$16-18" → use average (17.00) |
| Incremental RPM Lift | RPM Lift | Currency | Parse "$1.00" → 1.00 |
| Mula % Pageviews | Pageview % | Percentage | Parse "1-2%" → 0.015 (average) |
| Revenue Data | Revenue Data URL | URL | Google Sheets link |

### Additional Fields to Add
- **ID** - Auto-generated: `PROG-{uuid}`
- **Created Date** - Migration date
- **Last Updated** - Auto-updated
- **Owner** - Default from Account Owner
- **Priority** - Based on Status/Health

### Status Mapping
- "Active – Organic Launch" → "Active"
- "Paid Pilot" → "Active"
- "Onboarding" → "Onboarding"
- "Late‑Stage Pipeline" → "Pipeline"
- "Churned" → "Churned"
- "Inactive" → "Inactive"

### Health Mapping
- "Needs Improvement" → "Needs Improvement"
- "Ok" → "Good"
- "In Danger" → "At Risk"
- Empty → "Unknown"

### Date Parsing
- "June '25" → "2025-06-01" (first day of month)
- "July '25" → "2025-07-01"
- Parse month name and year, default to 1st of month

---

## 4. Tasks → Tasks Sheet

### Source: `Relational_Tasks.csv`

| Notion Column | Google Sheets Column | Type | Notes |
|--------------|---------------------|------|-------|
| Task Name | Task Name | Text | Primary identifier |
| Type | Type | Dropdown | New Launch, Partnerships, Enhancement |
| Company | Account ID | Lookup | Link to Accounts sheet (via Company name) |
| Status | Status | Dropdown | In Progress→In Progress, Backlog→To Do |
| Priority | Priority | Dropdown | High→High, Medium→Medium, Low→Low |
| Owner | Assignee | Dropdown | Logan, Elliott → Team member names |
| Opportunity | Opportunity | Text | Additional notes |

### Additional Fields to Add
- **ID** - Auto-generated: `TASK-{uuid}`
- **Project ID** - Link to Programs (if applicable)
- **Description** - Empty initially
- **Due Date** - To be set manually
- **Created Date** - Migration date
- **Completed Date** - If Status = "Done"

### Status Mapping
- "In Progress" → "In Progress"
- "Backlog" → "To Do"
- Empty → "To Do"

### Type Mapping
- "New Launch" → "New Launch"
- "Partnerships" → "Partnerships"
- "Enhancement" → "Enhancement"

---

## 5. Relationships to Establish

### Account ↔ Contact Relationships
- **Many-to-Many**: One Account can have multiple Contacts
- **Implementation**: Create junction table or use Contact's Company field
- **Preferred**: Use Contact's Company field to link to Account

### Account ↔ Program Relationships
- **One-to-Many**: One Account can have multiple Programs
- **Implementation**: Program's Account ID links to Account's ID

### Program ↔ Task Relationships
- **One-to-Many**: One Program can have multiple Tasks
- **Implementation**: Task's Company links to Account, then to Program
- **Note**: May need to match Task Company to Program Company

### Contact ↔ Program Relationships
- **Many-to-Many**: Contacts can be associated with multiple Programs
- **Implementation**: Via Account (Contact → Account → Programs)
- **Alternative**: Create Program Contacts junction table if needed

---

## 6. Data Transformation Script

### Pseudo-code for Import Process

```javascript
// 1. Import Accounts (Publishers)
function importAccounts() {
  // Read publishers.csv
  // For each row:
  //   - Generate ACC-{uuid}
  //   - Map columns
  //   - Transform Stage values
  //   - Parse dates
  //   - Write to Accounts sheet
}

// 2. Import Contacts
function importContacts() {
  // Read both contact CSVs
  // Merge duplicates (by email)
  // For each contact:
  //   - Generate CON-{uuid}
  //   - Split name
  //   - Match Company to Account ID
  //   - Map Influence
  //   - Write to Contacts sheet
}

// 3. Import Programs
function importPrograms() {
  // Read Relational_Programs.csv
  // For each program:
  //   - Generate PROG-{uuid}
  //   - Match Company to Account ID
  //   - Map Status and Health
  //   - Parse dates (June '25 → 2025-06-01)
  //   - Parse RPM ranges
  //   - Write to Programs sheet
}

// 4. Import Tasks
function importTasks() {
  // Read Relational_Tasks.csv
  // For each task:
  //   - Generate TASK-{uuid}
  //   - Match Company to Account ID
  //   - Optionally match to Program
  //   - Map Status and Priority
  //   - Write to Tasks sheet
}

// 5. Establish Relationships
function establishRelationships() {
  // Update Contacts with Account IDs
  // Update Programs with Account IDs
  // Update Tasks with Account IDs and Program IDs
  // Log all relationships in Activity Log
}
```

---

## 7. Data Quality Issues to Address

### Issues Found

1. **Missing Data**
   - Some contacts missing names (email only)
   - Some dates missing
   - Some fields empty

2. **Data Inconsistencies**
   - Company name variations (e.g., "SHE Media" vs "Stylecaster (SHE Media)")
   - Date formats vary
   - Status values need normalization

3. **Relationship Matching**
   - Need to match Company names across files
   - Some companies may not exist in Publishers file

### Solutions

1. **Data Cleaning**
   - Standardize company names
   - Fill missing names with email username
   - Default missing dates to migration date
   - Normalize all status values

2. **Matching Strategy**
   - Create company name mapping table
   - Fuzzy matching for similar names
   - Manual review for ambiguous matches

3. **Validation**
   - Validate all emails
   - Check for duplicate accounts
   - Verify relationships

---

## 8. Import Order

1. **Accounts** (Publishers) - No dependencies
2. **Contacts** - Depends on Accounts (for Company matching)
3. **Programs** - Depends on Accounts (for Company matching)
4. **Tasks** - Depends on Accounts and Programs (for Company/Program matching)
5. **Activity Log** - Log all imports

---

## 9. Post-Import Validation

### Validation Checks

1. **Count Validation**
   - Verify row counts match source files
   - Check for missing records

2. **Relationship Validation**
   - All Contacts have valid Account IDs
   - All Programs have valid Account IDs
   - All Tasks have valid Account IDs

3. **Data Integrity**
   - No duplicate emails in Contacts
   - No duplicate Account names
   - All required fields populated

4. **Data Quality**
   - Email format validation
   - Date format validation
   - Status values match dropdowns

---

## 10. Next Steps

1. **Review Mapping** - Confirm all mappings are correct
2. **Create Import Script** - Build Pipedream workflow or Apps Script
3. **Test Import** - Import sample data first
4. **Full Import** - Import all data
5. **Validate** - Run validation checks
6. **Fix Issues** - Address any data quality issues
7. **Go Live** - Start using new system

