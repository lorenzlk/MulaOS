# Setup Checklist: Notion to Google Workspace Migration

## Prerequisites

- [ ] Google Workspace account with Sheets access
- [ ] Pipedream account (free tier sufficient)
- [ ] All Notion CSV exports downloaded and accessible
- [ ] Access to Google Drive for file storage

## Phase 1: Google Sheets Database Setup

### Step 1: Create Spreadsheet
- [ ] Go to Google Sheets
- [ ] Create new blank spreadsheet
- [ ] Name it `MulaOS_Database`

### Step 2: Set Up Apps Script
- [ ] Open Apps Script editor (Extensions → Apps Script)
- [ ] Delete default `Code.gs` content
- [ ] Copy contents of `workflows/notion-migration/setup-google-sheets.js`
- [ ] Paste into Apps Script editor
- [ ] Save script
- [ ] Run `setupDatabase()` function
- [ ] Verify all sheets created successfully

### Step 3: Verify Sheet Structure
- [ ] Check that all sheets exist:
  - [ ] Accounts
  - [ ] Contacts
  - [ ] Programs
  - [ ] Projects
  - [ ] Tasks
  - [ ] Activity Log
  - [ ] Lookups
- [ ] Verify headers are formatted correctly
- [ ] Check data validation dropdowns work
- [ ] Verify column widths are appropriate

### Step 4: Share Spreadsheet
- [ ] Share with team members who need access
- [ ] Set appropriate permissions (Viewer/Editor)
- [ ] Note the Spreadsheet ID (from URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`)

## Phase 2: Pipedream Setup

### Step 1: Create Pipedream Account
- [ ] Sign up at pipedream.com (if not already)
- [ ] Verify account is active

### Step 2: Connect Google Sheets
- [ ] In Pipedream, go to Accounts
- [ ] Connect Google Sheets account
- [ ] Authorize access to Google Sheets API
- [ ] Test connection

### Step 3: Create Import Workflow
- [ ] Create new workflow in Pipedream
- [ ] Name it "Notion Data Import"
- [ ] Set up workflow steps (see import workflow documentation)

## Phase 3: Data Preparation

### Step 1: Organize CSV Files
- [ ] Ensure all CSV files are accessible:
  - [ ] `Mula Partners (Companies) 21c03985e9be80d380eccab86015869f_all.csv`
  - [ ] `Mula Partners (Contacts) 26a03985e9be8106ba09dde07a1e5f68_all.csv`
  - [ ] `Mula Pilot Partners 21c03985e9be80d380eccab86015869f_all.csv`
  - [ ] `Mula Ops Projects 26803985e9be813a988dd2ce4bf42e8d_all.csv`
  - [ ] `Mula Ops Tasks 26803985e9be81a2b2b8e3a724d894eb_all.csv`
- [ ] Upload CSVs to Google Drive (optional, for Pipedream access)
- [ ] Or prepare to upload directly in Pipedream

### Step 2: Review Data Mapping
- [ ] Review `COMPLETE_DATA_MAPPING.md`
- [ ] Understand field mappings
- [ ] Note any custom transformations needed

## Phase 4: Import Execution

### Step 1: Test Import (Sample Data)
- [ ] Import 5-10 sample records from each entity
- [ ] Verify data imported correctly
- [ ] Check relationships are established
- [ ] Validate data formats

### Step 2: Full Import
- [ ] Import Accounts (30 records)
- [ ] Verify all accounts imported
- [ ] Check for duplicates
- [ ] Import Contacts (~110 records)
- [ ] Verify contact deduplication worked
- [ ] Check Account ID linking
- [ ] Import Programs (19 records)
- [ ] Verify Account ID linking
- [ ] Import Projects (22 records)
- [ ] Verify Account ID linking
- [ ] Import Tasks (42 records)
- [ ] Verify Project ID linking
- [ ] Resolve parent-child task relationships

### Step 3: Post-Import Validation
- [ ] Run validation checks:
  - [ ] All Accounts have valid IDs
  - [ ] All Contacts linked to Accounts
  - [ ] All Programs linked to Accounts
  - [ ] All Projects linked to Accounts (where applicable)
  - [ ] All Tasks linked to Projects
  - [ ] No orphaned records
- [ ] Check data quality:
  - [ ] Email formats valid
  - [ ] Dates formatted correctly
  - [ ] Currency values correct
  - [ ] Percentages correct

### Step 4: Manual Review
- [ ] Review error log (if any)
- [ ] Manually link any unmatched records
- [ ] Fix any data quality issues
- [ ] Update any missing relationships

## Phase 5: Apps Script Functions Setup

### Step 1: Add Custom Functions
- [ ] Add ID generation functions
- [ ] Add relationship query functions
- [ ] Add data validation functions
- [ ] Add activity logging functions

### Step 2: Create Custom Menu
- [ ] Add "MulaOS" menu to spreadsheet
- [ ] Add menu items:
  - [ ] Add Contact
  - [ ] Add Account
  - [ ] Add Project
  - [ ] Generate Report
- [ ] Test menu functions

### Step 3: Set Up Triggers
- [ ] Set up `onEdit` trigger for activity logging
- [ ] Set up `onOpen` trigger for menu initialization
- [ ] Test triggers work correctly

## Phase 6: Testing & Validation

### Step 1: Functional Testing
- [ ] Test adding new Account
- [ ] Test adding new Contact
- [ ] Test linking Contact to Account
- [ ] Test adding new Project
- [ ] Test adding new Task
- [ ] Test linking Task to Project
- [ ] Test status updates
- [ ] Test data validation

### Step 2: Relationship Testing
- [ ] Verify Account → Contacts relationship
- [ ] Verify Account → Programs relationship
- [ ] Verify Account → Projects relationship
- [ ] Verify Project → Tasks relationship
- [ ] Verify Task → Parent Task relationship

### Step 3: Data Integrity Testing
- [ ] Test duplicate prevention
- [ ] Test required field validation
- [ ] Test dropdown value validation
- [ ] Test date format validation
- [ ] Test email format validation

## Phase 7: Team Training & Rollout

### Step 1: Create Training Materials
- [ ] Document how to add Accounts
- [ ] Document how to add Contacts
- [ ] Document how to add Projects
- [ ] Document how to add Tasks
- [ ] Document how to use filters/views
- [ ] Create video walkthrough (optional)

### Step 2: Conduct Training
- [ ] Schedule training session
- [ ] Walk through basic operations
- [ ] Demonstrate key workflows
- [ ] Answer questions
- [ ] Collect feedback

### Step 3: Gradual Rollout
- [ ] Start with pilot users
- [ ] Monitor usage and issues
- [ ] Make adjustments based on feedback
- [ ] Roll out to full team
- [ ] Provide ongoing support

## Phase 8: Automation Setup (Optional)

### Step 1: Pipedream Workflows
- [ ] Set up notification workflows
- [ ] Set up reporting workflows
- [ ] Set up sync workflows
- [ ] Test all workflows

### Step 2: Scheduled Tasks
- [ ] Set up daily/weekly reports
- [ ] Set up reminder notifications
- [ ] Set up data sync schedules

## Troubleshooting

### Common Issues

**Issue**: Apps Script setup fails
- **Solution**: Check permissions, ensure you're the owner of the spreadsheet

**Issue**: Data validation not working
- **Solution**: Verify lookup values are in Lookups sheet, check data validation rules

**Issue**: Import fails with errors
- **Solution**: Check CSV format, verify field mappings, review error logs

**Issue**: Relationships not linking correctly
- **Solution**: Verify company name matching, check for typos, use fuzzy matching

## Success Criteria

- [ ] All data successfully imported
- [ ] All relationships established
- [ ] No data loss
- [ ] Team trained and using system
- [ ] Zero critical bugs
- [ ] Performance acceptable
- [ ] Documentation complete

## Next Steps After Setup

1. **Monitor Usage**: Track how team uses the system
2. **Gather Feedback**: Collect suggestions for improvements
3. **Iterate**: Make improvements based on feedback
4. **Expand**: Add new features as needed
5. **Optimize**: Improve performance and workflows

## Support Resources

- **Documentation**: See `docs/notion-to-google-workspace-migration/` folder
- **Data Mapping**: `COMPLETE_DATA_MAPPING.md`
- **Database Design**: `DATABASE_DESIGN.md`
- **Architecture**: `ARCHITECTURE.md`
- **Troubleshooting**: `TROUBLESHOOTING.md` (to be created)

## Estimated Time

- **Phase 1**: 30 minutes
- **Phase 2**: 15 minutes
- **Phase 3**: 15 minutes
- **Phase 4**: 2-4 hours (depending on data volume)
- **Phase 5**: 1-2 hours
- **Phase 6**: 1-2 hours
- **Phase 7**: 2-4 hours
- **Phase 8**: 2-4 hours (optional)

**Total**: ~8-16 hours (can be spread over multiple days)

