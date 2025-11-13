# Apps Script Update Checklist

## What Changed: URL-Based IDs

The ID system has been updated from UUID-based (`ACC-abc12345`) to URL-based (`https://mula.com/pubs/on3`).

## Step-by-Step Update Instructions

### 1. Copy Updated Functions

Copy the entire `apps-script-functions.js` file into your Apps Script editor, replacing the old code.

**Location**: `workflows/notion-migration/apps-script-functions.js`

### 2. Key Functions That Changed

#### ✅ ID Generation Functions (REQUIRED UPDATE)

**Old Format** (no longer works):
```javascript
=generateAccountID()  // ❌ No parameters
```

**New Format** (requires parameters):
```javascript
=generateAccountID("On3")  // ✅ Requires account name
=generateContactID("user@example.com")  // ✅ Requires email
=generateProgramID("On3")  // ✅ Requires company name
=generateProjectID("On3 Launch")  // ✅ Requires project name
=generateTaskID("Task Name", "https://mula.com/projects/on3-launch")  // ✅ Requires task name and project ID
```

### 3. Update Any Formulas in Sheets

If you have formulas in your sheets that use ID generation, update them:

#### Accounts Sheet
- **Old**: `=generateAccountID()`
- **New**: `=generateAccountID(B2)` (where B2 is Account Name)

#### Contacts Sheet
- **Old**: `=generateContactID()`
- **New**: `=generateContactID(D2)` (where D2 is Email)

#### Programs Sheet
- **Old**: `=generateProgramID()`
- **New**: `=generateProgramID(D2)` (where D2 is Company)

#### Projects Sheet
- **Old**: `=generateProjectID()`
- **New**: `=generateProjectID(B2)` (where B2 is Project Name)

#### Tasks Sheet
- **Old**: `=generateTaskID()`
- **New**: `=generateTaskID(B2, C2)` (where B2 is Task Name, C2 is Project ID)

### 4. Update Relationship Query Functions

The relationship query functions (`getAccountPrograms`, `getAccountContacts`, etc.) now accept URL-based IDs:

**Old**:
```javascript
=getAccountPrograms("ACC-12345")
```

**New**:
```javascript
=getAccountPrograms("https://mula.com/pubs/on3")
```

### 5. Check Existing Data

If you already have data with old UUID-based IDs:

**Option A: Keep Both Formats** (Recommended for now)
- The functions accept both URL and legacy IDs
- New records will use URL-based IDs
- Old records can be migrated later

**Option B: Migrate Existing IDs**
- Create a migration script to convert old IDs to URLs
- Update all references

### 6. Test After Update

1. **Test ID Generation**:
   - In Accounts sheet, add formula: `=generateAccountID(B2)`
   - Should return: `https://mula.com/pubs/{normalized-name}`

2. **Test Relationship Queries**:
   - Use URL-based ID: `=getAccountPrograms("https://mula.com/pubs/on3")`
   - Should return matching programs

3. **Test Activity Logging**:
   - Edit a cell in Accounts sheet
   - Check Activity Log for entry with URL-based ID

## Functions That Stayed the Same

These functions didn't change:
- ✅ `validateEmail(email)` - Same signature
- ✅ `checkDuplicateEmail(email)` - Same signature
- ✅ `validateAccountName(name)` - Same signature
- ✅ `getAccountPrograms(accountID)` - Same signature (just accepts URLs now)
- ✅ `getAccountContacts(accountID)` - Same signature
- ✅ `getAccountProjects(accountID)` - Same signature
- ✅ `getProjectTasks(projectID)` - Same signature
- ✅ `getSubTasks(taskID)` - Same signature
- ✅ `logActivity(...)` - Same signature
- ✅ `onEdit(e)` - Same trigger function
- ✅ `onOpen()` - Same menu setup

## Quick Reference: New ID Formats

| Entity | Function | Example Input | Example Output |
|--------|----------|---------------|----------------|
| Account | `generateAccountID(name)` | "On3" | `https://mula.com/pubs/on3` |
| Contact | `generateContactID(email)` | "user@example.com" | `https://mula.com/contacts/user%40example.com` |
| Program | `generateProgramID(company)` | "On3" | `https://mula.com/programs/on3-pilot` |
| Project | `generateProjectID(name)` | "On3 Launch" | `https://mula.com/projects/on3-launch` |
| Task | `generateTaskID(name, projectID)` | "Task", "https://mula.com/projects/on3-launch" | `https://mula.com/tasks/on3-launch/task` |

## Troubleshooting

### Issue: "Function not found"
- **Solution**: Make sure you copied all functions from `apps-script-functions.js`

### Issue: "Wrong number of arguments"
- **Solution**: ID generation functions now require parameters. Update your formulas.

### Issue: "Old IDs still work"
- **Solution**: That's expected! The system accepts both formats for compatibility.

### Issue: "Activity log not working"
- **Solution**: Check that `onEdit` trigger is set up (see APPS_SCRIPT_SETUP.md)

## Next Steps

1. ✅ Copy updated `apps-script-functions.js` to Apps Script editor
2. ✅ Update any formulas using ID generation functions
3. ✅ Test ID generation with new format
4. ✅ Test relationship queries with URL-based IDs
5. ⏭️ (Optional) Migrate existing UUID-based IDs to URLs

## Need Help?

- Check `APPS_SCRIPT_SETUP.md` for setup instructions
- Check `TROUBLESHOOTING.md` for common issues
- Check `URL_BASED_IDS.md` for ID format details

