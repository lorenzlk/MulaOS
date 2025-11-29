# Quick Import Guide: Import from Google Drive

## Prerequisites

- ✅ Google Sheets database set up (`MulaOS_Database`)
- ✅ Apps Script functions loaded
- ✅ CSV files uploaded to Google Drive

## Step-by-Step Import Process

### Step 1: Upload CSV Files to Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Create a folder called **"Notion Export"** (or use existing folder)
3. Upload these CSV files:
   - `Mula Partners (Companies) *_all.csv`
   - `Mula Partners (Contacts) *_all.csv`
   - `Mula Pilot Partners` or `Relational_Programs.csv`
   - `Mula Ops Projects *_all.csv`
   - `Mula Ops Tasks *_all.csv`

**Note**: The script will automatically find files matching these patterns.

### Step 2: Add Import Script to Apps Script

1. Open your `MulaOS_Database` spreadsheet
2. Go to **Extensions** → **Apps Script**
3. Create a new file (or add to existing file)
4. Copy the entire contents of `workflows/notion-migration/import-from-drive.js`
5. Paste into Apps Script editor
6. **Save** (Ctrl+S / Cmd+S)

### Step 3: Configure Folder (Optional)

If your Google Drive folder has a different name:

1. In Apps Script, find the `CONFIG` section at the top
2. Update `CSV_FOLDER_NAME` to match your folder name
3. Or, if you know the folder ID, set `CSV_FOLDER_ID`:
   - Right-click folder in Google Drive → "Get link"
   - Extract the ID from the URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`
   - Set `CSV_FOLDER_ID: 'your-folder-id-here'`

### Step 4: Run Import

1. In Apps Script editor, select `importAllData` function
2. Click **Run** (▶️)
3. **Authorize** if prompted (first time only)
4. Watch the execution log for progress

### Step 5: Verify Import

1. Go back to your spreadsheet
2. Check each sheet:
   - **Accounts** - Should have imported companies
   - **Contacts** - Should have imported contacts
   - **Programs** - Should have imported programs
   - **Projects** - Should have imported projects
   - **Tasks** - Should have imported tasks
3. Check **Activity Log** - Should have entries for imports

## Import Order

The script imports in this order (automatic):

1. **Accounts** (Companies) - No dependencies
2. **Contacts** - Links to Accounts
3. **Programs** - Links to Accounts
4. **Projects** - Links to Accounts
5. **Tasks** - Links to Projects

## Troubleshooting

### "Could not find folder" Error

**Solution**: 
- Check folder name matches `CONFIG.CSV_FOLDER_NAME`
- Or set `CSV_FOLDER_ID` directly
- Make sure folder is in your Google Drive (not shared folder)

### "CSV file not found" Warning

**Solution**:
- Check CSV file names match the patterns in `CONFIG.FILE_PATTERNS`
- Make sure files are in the correct folder
- Check file names contain the expected strings

### Import Errors

**Check Execution Log**:
1. In Apps Script, go to **Executions** (clock icon)
2. Click on the latest execution
3. Review errors and warnings
4. Common issues:
   - Missing required columns
   - Company name mismatches
   - Date format issues

### Company Name Mismatches

**Problem**: Contacts/Programs not linking to Accounts

**Solution**:
- Check company names match exactly between CSV files
- Review execution log for unmatched companies
- Manually fix relationships if needed

## Individual Import Functions

You can also run imports individually:

```javascript
// Import only Accounts
importAccounts()

// Import only Contacts (needs accountMap)
const accountMap = importAccounts()
importContacts(accountMap)

// Import only Programs (needs accountMap)
importPrograms(accountMap)

// Import only Projects (needs accountMap)
const projectMap = importProjects(accountMap)

// Import only Tasks (needs projectMap)
importTasks(projectMap)
```

## What Gets Imported

### Accounts
- Account Name, Website Domain, Type, Segment, Stage
- Widgets, Platform, KVP Enabled, Goal RPM/RPS
- Launch Date, Last Updated, Roadmap URL
- Auto-generated: ID (URL-based), Created Date

### Contacts
- First Name, Last Name, Email, Title
- Account IDs (linked), Related Companies
- Status, Last Update, Notes
- Auto-generated: ID (URL-based), Created Date
- **Deduplication**: By email address

### Programs
- Program Name, Account ID (linked), Company
- Status, Phase, Widgets, Platform, KVP
- Health, Goal, Next Steps, KPIs
- Pilot Start Date, RPM data, Pageview %
- Auto-generated: ID (URL-based), Created Date

### Projects
- Project Name, Summary, Status, Owner
- Priority, Completion, Dates
- Related Account IDs (linked)
- Auto-generated: ID (URL-based), Created Date

### Tasks
- Task Name, Project ID (linked), Assignee
- Status, Priority, Due Date, Completed Date
- Parent Task, Place, Tags
- Auto-generated: ID (URL-based), Created Date

## Post-Import Checklist

After import, verify:

- [ ] All Accounts imported with valid IDs
- [ ] All Contacts linked to Accounts
- [ ] All Programs linked to Accounts
- [ ] All Projects linked to Accounts (where applicable)
- [ ] All Tasks linked to Projects
- [ ] No orphaned records
- [ ] Dates formatted correctly
- [ ] Dropdown values valid
- [ ] Activity Log has entries

## Next Steps

After successful import:

1. ✅ Review all data
2. ✅ Fix any relationship issues manually
3. ✅ Test custom functions
4. ✅ Train team members
5. ✅ Start using the system!

## Need Help?

- Check execution log for detailed errors
- Review `COMPLETE_DATA_MAPPING.md` for field mappings
- Check `TROUBLESHOOTING.md` for common issues

