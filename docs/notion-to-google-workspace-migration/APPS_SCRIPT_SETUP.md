# Apps Script Functions Setup Guide

## Overview

This guide explains how to add custom Apps Script functions to your MulaOS database spreadsheet.

## Setup Steps

### 1. Open Apps Script Editor

1. Open your `MulaOS_Database` spreadsheet
2. Go to **Extensions** → **Apps Script**
3. The Apps Script editor will open

### 2. Add Custom Functions

1. In the Apps Script editor, you should see `Code.gs` (or create it if it doesn't exist)
2. Copy the contents of `workflows/notion-migration/apps-script-functions.js`
3. Paste into `Code.gs` (or create a new file)
4. Save the script (Ctrl+S or Cmd+S)

### 3. Authorize the Script

1. Run the `onOpen` function (or just open the spreadsheet - it runs automatically)
2. You'll be prompted to authorize the script
3. Click "Review Permissions"
4. Choose your Google account
5. Click "Advanced" → "Go to [Project Name] (unsafe)"
6. Click "Allow"

### 4. Verify Setup

1. Refresh your spreadsheet
2. You should see a new **"MulaOS"** menu in the menu bar
3. The menu should have options like:
   - Add Account
   - Add Contact
   - Add Project
   - Add Task
   - Generate Report
   - View Account Details
   - Refresh Lookups

## Available Functions

### ID Generation

- `generateAccountID()` - Generates ACC-{uuid}
- `generateContactID()` - Generates CON-{uuid}
- `generateProgramID()` - Generates PROG-{uuid}
- `generateProjectID()` - Generates PROJ-{uuid}
- `generateTaskID()` - Generates TASK-{uuid}

**Usage**: Can be used in formulas or called from other functions

### Relationship Queries

- `getAccountPrograms(accountID)` - Returns all programs for an account
- `getAccountContacts(accountID)` - Returns all contacts for an account
- `getAccountProjects(accountID)` - Returns all projects for an account
- `getProjectTasks(projectID)` - Returns all tasks for a project
- `getSubTasks(taskID)` - Returns all subtasks for a task

**Usage**: Call from other functions or use in custom formulas

### Data Validation

- `validateEmail(email)` - Validates email format
- `checkDuplicateEmail(email, excludeRow)` - Checks for duplicate emails
- `validateAccountName(name, excludeRow)` - Checks for duplicate account names

**Usage**: Use in data validation rules or call from other functions

### Activity Logging

- `logActivity(entityType, entityID, action, user, field, oldValue, newValue, details)` - Logs activity

**Usage**: Automatically called by `onEdit` trigger, or call manually

### Calculations

- `calculateProjectCompletion(projectID)` - Calculates % complete from tasks
- `updateProjectCompletion(projectID)` - Updates project completion field

**Usage**: Call manually or set up automatic triggers

## Automatic Features

### onOpen Trigger
- Runs automatically when spreadsheet opens
- Creates the MulaOS custom menu
- No setup required

### onEdit Trigger
- Runs automatically when cells are edited
- Logs changes to Activity Log
- Tracks: entity type, ID, field changed, old/new values

**To enable**:
1. Go to Apps Script editor
2. Click on the clock icon (Triggers) in left sidebar
3. Click "+ Add Trigger"
4. Select:
   - Function: `onEdit`
   - Event source: "From spreadsheet"
   - Event type: "On edit"
5. Save

**Note**: The `onEdit` function is a simple trigger that runs automatically. However, if you want to ensure it's set up as an installable trigger (for better reliability), you can run the `setupTriggers()` function (see Troubleshooting guide).

**Important**: Simple triggers like `onEdit` have limitations:
- Cannot access services that require authorization
- Cannot send emails
- Have a 30-second execution time limit

If you need more advanced features, set up an installable trigger instead.

## Testing Functions

### Test ID Generation

1. In a cell, type: `=generateAccountID("On3")`
2. Press Enter
3. Should generate an ID like "https://mula.com/pubs/on3"

**Note**: ID generation functions now require parameters:
- `generateAccountID(accountName)` - Requires account name
- `generateContactID(email)` - Requires email
- `generateProgramID(companyName)` - Requires company name
- `generateProjectID(projectName)` - Requires project name
- `generateTaskID(taskName, projectID)` - Requires task name and project ID

### Test Relationship Query

1. In a cell, type: `=getAccountPrograms("https://mula.com/pubs/on3")`
2. This will return a table with headers and matching rows
3. **Note**: The function returns a 2D array, so it will spill across multiple cells
4. If you get `#REF!` error, make sure:
   - The account ID exists in the Accounts sheet (use URL-based ID)
   - There are programs linked to that account
   - The function has been saved and authorized

### Test Activity Logging

1. Edit any cell in Accounts, Contacts, Projects, or Tasks sheet
2. Check Activity Log sheet
3. Should see a new entry logged

## Custom Menu Items

The custom menu provides quick access to common actions. Currently, menu items show alerts - you can implement full dialogs later.

### To Implement Full Dialogs

Replace the placeholder functions (`showAddAccountDialog`, etc.) with HTML dialogs:

```javascript
function showAddAccountDialog() {
  const html = HtmlService.createHtmlOutputFromFile('AddAccountDialog')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add Account');
}
```

## Troubleshooting

### Menu Not Appearing
- Refresh the spreadsheet
- Check that `onOpen` function exists
- Check for errors in Apps Script editor (View → Execution log)

### Functions Not Working
- Check that script is authorized
- Check execution log for errors
- Verify function names are correct

### Activity Log Not Working
- Verify `onEdit` trigger is set up
- Check that Activity Log sheet exists
- Check execution log for errors

## Next Steps

1. ✅ Add functions to Apps Script
2. ✅ Authorize script
3. ✅ Test ID generation
4. ✅ Set up onEdit trigger
5. ⏭️ Implement custom dialogs (optional)
6. ⏭️ Add more custom functions as needed

## Security Notes

- Scripts run with permissions of the user who authorized them
- Activity logging captures user email automatically
- All functions are scoped to the spreadsheet only
- No external API calls without explicit permission

