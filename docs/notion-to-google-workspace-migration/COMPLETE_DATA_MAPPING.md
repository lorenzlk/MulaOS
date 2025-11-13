# Complete Data Mapping: Notion → Google Sheets

This document provides comprehensive field-by-field mapping from all Notion CSV exports to our Google Sheets database structure.

## Import Order

1. **Accounts** (Companies) - No dependencies
2. **Contacts** - Depends on Accounts (for Account ID matching)
3. **Programs** - Depends on Accounts (for Account ID matching)
4. **Projects** - Depends on Accounts (for Account ID matching)
5. **Tasks** - Depends on Projects (for Project ID matching)

---

## 1. Accounts → Accounts Sheet

### Source: `Mula Partners (Companies) 21c03985e9be80d380eccab86015869f_all.csv`

| Notion Column | Google Sheets Column | Type | Transformation Rules |
|--------------|---------------------|------|---------------------|
| Name | Account Name | Text | Use as-is (primary identifier) |
| Type | Type | Dropdown | Map: Publisher→Publisher, Channel→Channel, Demand→Demand, Data→Data, LLM Chat App→LLM Chat App |
| Segment | Segment | Dropdown | Map: Tier 1→Tier 1, Tier 2→Tier 2, Tier 3→Tier 3 |
| Stage | Stage | Dropdown | Map: Pilot Live→Pilot Live, Live→Live, Onboarding→Onboarding, GTM→GTM, Paused→Paused, Signed→Signed, N/A→N/A |
| Widgets | Widgets | Text | Use as-is (can be comma-separated) |
| Platform | Platform | Dropdown | Map: "Mobile, Web"→"Desktop, Mobile", "Mobile"→"Mobile", "Web"→"Desktop" |
| Ads Enabled | KVP Enabled | Dropdown | Map: Yes→Yes, No→No, NA→NA, (empty)→NA |
| Goal RPM/RPS | Goal RPM/RPS | Currency | Parse currency, leave empty if blank |
| Launch Date | Launch Date | Date | Parse date format, leave empty if blank |
| Last Update | Last Updated | Date | Parse "September 18, 2025 2:10 PM" → "2025-09-18" |
| Mula Product Roadmap | Mula Product Roadmap | URL | Extract URL from Notion link format |
| Related Projects | Related Projects | Text | Extract project names, will be converted to Project IDs after Projects import |
| Mula Pub Contacts | (Not imported directly) | - | Will be used to link Contacts to Accounts |

### Additional Fields (Auto-generated)
- **ID**: `ACC-{uuid}` - Generate unique ID
- **Created Date**: Migration date

### Company Name Matching
- Extract company name from "Related Mula Partner" field in Contacts
- Match to Account Name for linking

---

## 2. Contacts → Contacts Sheet

### Source: `Mula Partners (Contacts) 26a03985e9be8106ba09dde07a1e5f68_all.csv` (PRIMARY)

**Also merge with**: `Relational_Contacts.csv` + `Relational_Contacts_from_Gmail.csv`

| Notion Column | Google Sheets Column | Type | Transformation Rules |
|--------------|---------------------|------|---------------------|
| First Name | First Name | Text | Use as-is |
| Last Name | Last Name | Text | Use as-is |
| E-mail | Email | Email | Use as-is (primary identifier for deduplication) |
| Title | Title | Text | Use as-is (job title) |
| Related Mula Partner | Account IDs | Text | Extract company name, match to Account ID, comma-separate if multiple |
| Related Mula Partner | Related Companies | Text | Extract company names for reference |
| Notes | Notes | Text | Use as-is |
| Last Update | Last Update | Date | Parse "September 10, 2025 11:30 AM" → "2025-09-10" |

### Additional Fields (Auto-generated)
- **ID**: `CON-{uuid}` - Generate unique ID
- **Status**: Default to "Active"
- **Created Date**: Migration date

### Deduplication Strategy
1. Use Email as unique identifier
2. If email exists in multiple sources:
   - Prefer `Mula Partners (Contacts)` CSV (most complete)
   - Merge Notes fields
   - Merge Related Mula Partner fields
   - Keep most recent Last Update date

### Company Name Extraction
- Extract from "Related Mula Partner" field
- Handle formats:
  - "On3 (https://www.notion.so/...)" → "On3"
  - "RevContent (Channel), RevContent (Demand)" → "RevContent (Channel), RevContent (Demand)"
- Match to Account Name to get Account ID

---

## 3. Programs → Programs Sheet

### Source: `Mula Pilot Partners 21c03985e9be80d380eccab86015869f_all.csv`

| Notion Column | Google Sheets Column | Type | Transformation Rules |
|--------------|---------------------|------|---------------------|
| Name | Company | Text | Company name (for matching) |
| Name | Program Name | Text | Generate: "{Company} Pilot Program" |
| Name | Account ID | Lookup | Match Company name to Account Name → Account ID |
| Status | Status | Dropdown | Map: Active – Organic Launch→Active, Paid Pilot→Active, Onboarding→Onboarding, Late‑Stage Pipeline→Pipeline, Churned→Churned, Inactive→Inactive |
| Phase | Phase | Dropdown | Map: Live→Live, Onboarding→Onboarding, Inactive→Inactive |
| Widgets | Widgets | Text | Use as-is |
| Platform | Platform | Text | Use as-is |
| Ads | Ads | Dropdown | Map: Yes→Yes, No→No, NA→NA |
| Health | Health | Dropdown | Map: Needs Improvement→Needs Improvement, Ok→Good, In Danger→At Risk, (empty)→Unknown |
| Goal | Goal | Text | Use as-is |
| Next Steps | Next Steps | Text | Use as-is (may contain URLs) |
| Key KPI (Leading) | Leading KPI | Text | Use as-is |
| Key KPI (Lagging) | Lagging KPI | Text | Use as-is |
| Pilot Start | Pilot Start Date | Date | Parse "June '25" → "2025-06-01" |
| Baseline RPM | Baseline RPM | Currency | Parse "$16-18" → 17.00 (average) |
| Incremental RPM Lift | RPM Lift | Currency | Parse "$1.00" → 1.00 |
| Mula % Pageviews | Pageview Percent | Percentage | Parse "1-2%" → 0.015 (average) |
| Revenue Data | Revenue Data URL | URL | Use as-is |

### Additional Fields (Auto-generated)
- **ID**: `PROG-{uuid}` - Generate unique ID
- **Created Date**: Migration date
- **Last Updated**: Auto-updated

---

## 4. Projects → Projects Sheet

### Source: `Mula Ops Projects 26803985e9be813a988dd2ce4bf42e8d_all.csv`

| Notion Column | Google Sheets Column | Type | Transformation Rules |
|--------------|---------------------|------|---------------------|
| Project name | Project Name | Text | Use as-is |
| Summary | Summary | Text | Use as-is |
| Status | Status | Dropdown | Map: Done→Done, In Progress→In Progress, Planning→Planning, Backlog→Backlog |
| Owner | Owner | Dropdown | Use as-is (Logan Lorenz, Jason White, Kale McNaney, etc.) |
| Priority | Priority | Dropdown | Map: High→High, Medium→Medium, Low→Low, (empty)→Medium |
| Completion | Completion | Percentage | Parse decimal (0.75 = 75%) |
| Dates | Dates | Date | Parse "July 28, 2025" → "2025-07-28" |
| Last Updated | Last Updated | Date | Parse "September 8, 2025 4:05 PM" → "2025-09-08" |
| Tasks | (Not imported directly) | - | Will be used to link Tasks to Projects |

### Additional Fields (Auto-generated)
- **ID**: `PROJ-{uuid}` - Generate unique ID
- **Related Account IDs**: Extract from Project Name (e.g., "On3 Launch" → "On3") or use Related Projects field from Accounts
- **Created Date**: Migration date

### Account Matching Strategy
1. Extract company name from Project Name:
   - "On3 Launch" → "On3"
   - "On3 Expansion" → "On3"
   - "StyleCaster Launch" → "Stylecaster"
   - "Brit+Co Expansion" → "Brit + Co"
2. Match to Account Name → Account ID
3. Handle special cases:
   - "RevContent Demand Integration" → "RevContent (Demand)"
   - "GAM Attribution & Reporting" → No specific account

---

## 5. Tasks → Tasks Sheet

### Source: `Mula Ops Tasks 26803985e9be81a2b2b8e3a724d894eb_all.csv`

| Notion Column | Google Sheets Column | Type | Transformation Rules |
|--------------|---------------------|------|---------------------|
| Task name | Task Name | Text | Use as-is |
| Project | Project ID | Lookup | Extract project name from Notion link, match to Project Name → Project ID |
| Assignee | Assignee | Text | Use as-is (can be comma-separated) |
| Status | Status | Dropdown | Map: Done→Done, In Progress→In Progress, Not Started→Not Started |
| Priority | Priority | Dropdown | Map: High→High, Medium→Medium, Low→Low, (empty)→Medium |
| Due | Due Date | Date | Parse date format |
| Completed on | Completed Date | Date | Parse date format |
| Last Updated | Last Updated | Date | Parse "September 8, 2025 4:05 PM" → "2025-09-08" |
| Parent-task | Parent Task ID | Lookup | Extract task name from Notion link, match to Task Name → Task ID (after all tasks imported) |
| Sub-tasks | Sub Tasks | Text | Extract task names from Notion links, convert to Task IDs (after all tasks imported) |
| Place | Place | Text | Use as-is |
| Tags | Tags | Text | Use as-is (comma-separated) |

### Additional Fields (Auto-generated)
- **ID**: `TASK-{uuid}` - Generate unique ID
- **Created Date**: Migration date

### Project Matching Strategy
1. Extract project name from Notion link format:
   - "On3 Launch (https://www.notion.so/On3-Launch-26803985e9be806dbb1af8babcd459d4?pvs=21)" → "On3 Launch"
2. Match to Project Name → Project ID

### Parent-Child Task Relationships
1. First pass: Import all tasks with Project IDs
2. Second pass: Resolve Parent Task ID and Sub Tasks using task names
3. Match task names to Task IDs

---

## Data Transformation Functions

### Date Parsing

```javascript
function parseNotionDate(dateStr) {
  // Handle "September 18, 2025 2:10 PM" → "2025-09-18"
  // Handle "July 28, 2025" → "2025-07-28"
  // Handle "June '25" → "2025-06-01"
  // Return ISO date string or empty string
}

function parseMonthYear(monthYearStr) {
  // Handle "June '25" → "2025-06-01"
  // Handle "July '25" → "2025-07-01"
  // Return ISO date string or empty string
}
```

### Currency Parsing

```javascript
function parseCurrency(currencyStr) {
  // Handle "$16-18" → 17.00 (average)
  // Handle "$1.00" → 1.00
  // Handle "$2-3" → 2.50 (average)
  // Return number or empty string
}
```

### Percentage Parsing

```javascript
function parsePercentage(percentStr) {
  // Handle "1-2%" → 0.015 (average)
  // Handle "50" → 0.50
  // Return decimal (0-1) or empty string
}
```

### Notion Link Extraction

```javascript
function extractNotionLink(linkStr) {
  // Handle "On3 (https://www.notion.so/On3-21c03985e9be812ca199d3bfcfebc342?pvs=21)"
  // Return: { name: "On3", url: "https://..." }
}

function extractNotionLinks(linksStr) {
  // Handle multiple links separated by commas
  // Return array of { name, url } objects
}
```

### Company Name Normalization

```javascript
function normalizeCompanyName(name) {
  // Handle variations:
  // "Stylecaster" ↔ "Stylecaster (SHE Media)"
  // "DefPen" ↔ "Defpen"
  // "Brit+Co" ↔ "Brit + Co"
  // Return normalized name
}
```

---

## Import Validation Rules

### Accounts
- [ ] All required fields populated (Account Name, Type, Segment, Stage)
- [ ] No duplicate Account Names
- [ ] All IDs generated successfully

### Contacts
- [ ] All emails valid format
- [ ] No duplicate emails
- [ ] All Account IDs match existing Accounts
- [ ] All IDs generated successfully

### Programs
- [ ] All Account IDs match existing Accounts
- [ ] All Status values valid
- [ ] All IDs generated successfully

### Projects
- [ ] All Account IDs match existing Accounts (where applicable)
- [ ] All Status values valid
- [ ] All IDs generated successfully

### Tasks
- [ ] All Project IDs match existing Projects
- [ ] All Parent Task IDs match existing Tasks (after full import)
- [ ] All IDs generated successfully

---

## Post-Import Tasks

1. **Link Related Projects in Accounts**
   - Update Accounts.Related Projects with Project IDs
   - Match project names from Accounts CSV to Project IDs

2. **Link Contacts to Accounts**
   - Update Contacts.Account IDs based on Related Mula Partner field
   - Handle contacts linked to multiple companies

3. **Resolve Task Hierarchies**
   - Update Tasks.Parent Task ID
   - Update Tasks.Sub Tasks with Task IDs

4. **Validate Relationships**
   - Check all foreign key relationships
   - Verify no orphaned records
   - Validate data integrity

5. **Generate Activity Log**
   - Log all imports
   - Record migration date and source

---

## Error Handling

### Missing Data
- Leave fields empty if source data is missing
- Use default values where appropriate (Status="Active", Priority="Medium")

### Matching Failures
- Log unmatched records to error sheet
- Provide manual review list
- Allow manual linking after import

### Data Quality Issues
- Validate email formats
- Check date formats
- Verify currency/percentage formats
- Log all validation errors

---

## Import Statistics Tracking

Track during import:
- Total records processed
- Records imported successfully
- Records with errors
- Records requiring manual review
- Import duration
- Data quality metrics

