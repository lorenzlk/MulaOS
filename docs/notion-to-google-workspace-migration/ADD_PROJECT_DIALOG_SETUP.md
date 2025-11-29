# Add Project Dialog Setup

## Overview

The Add Project dialog provides a user-friendly interface for adding new projects to the MulaOS database without manually editing the spreadsheet.

## Setup Instructions

### Step 1: Add HTML File to Apps Script

1. Open your `MulaOS_Database` spreadsheet
2. Go to **Extensions** → **Apps Script**
3. Click **+** (Add file) → **HTML**
4. Name it `AddProjectDialog`
5. Copy the contents of `workflows/notion-migration/AddProjectDialog.html`
6. Paste into the HTML file
7. **Save** (Ctrl+S / Cmd+S)

### Step 2: Update Apps Script Functions

1. In Apps Script, open `apps-script-functions.js` (or `Code.gs`)
2. The functions `showAddProjectDialog()`, `getAccountsForDialog()`, and `addProject()` should already be added
3. If not, copy them from `workflows/notion-migration/apps-script-functions.js`
4. **Save**

### Step 3: Test the Dialog

1. Refresh your spreadsheet
2. Click **MulaOS** menu → **Add Project**
3. The dialog should open

## Features

### Form Fields

- **Project Name** (Required) - Name of the project
- **Summary** (Optional) - Brief project description
- **Status** (Required) - Planning, In Progress, Done, Backlog
- **Owner** (Optional) - Project owner or lead
- **Priority** (Required) - High, Medium, Low (defaults to Medium)
- **Dates** (Optional) - Project timeline or target date
- **Related Accounts** (Optional) - Select multiple accounts via checkboxes
- **Notes** (Optional) - Additional project notes

### Automatic Features

- ✅ **ID Generation** - Automatically generates URL-based Project ID
- ✅ **Date Stamping** - Sets Created Date and Last Updated automatically
- ✅ **Activity Logging** - Logs project creation to Activity Log
- ✅ **Account Linking** - Links selected accounts to the project
- ✅ **Validation** - Validates required fields before submission

## Usage

1. Click **MulaOS** → **Add Project**
2. Fill in the form fields
3. Select related accounts (optional)
4. Click **Add Project**
5. The project will be added to the Projects sheet
6. Activity will be logged automatically

## Troubleshooting

### Dialog doesn't open
- Check that `AddProjectDialog.html` file exists in Apps Script
- Verify `showAddProjectDialog()` function exists
- Check execution log for errors

### Accounts not loading
- Verify `getAccountsForDialog()` function exists
- Check that Accounts sheet has data
- Check execution log for errors

### Project not added
- Check execution log for validation errors
- Verify Projects sheet exists
- Ensure required fields are filled

### HTML file not found error
- Make sure HTML file is named exactly `AddProjectDialog` (case-sensitive)
- Verify file is saved in Apps Script project
- Try refreshing the spreadsheet

## Customization

### Adding More Fields

To add more fields to the dialog:

1. Add input field to `AddProjectDialog.html`
2. Update `addProject()` function to handle new field
3. Update the `values` array to include new field in correct column position

### Changing Validation

Edit the validation logic in:
- HTML: Client-side validation in `<script>` section
- Apps Script: Server-side validation in `addProject()` function

### Styling

Edit the `<style>` section in `AddProjectDialog.html` to customize:
- Colors
- Fonts
- Layout
- Button styles

## Next Steps

Similar dialogs can be created for:
- Add Account
- Add Contact
- Add Task

Follow the same pattern:
1. Create HTML dialog file
2. Add dialog function
3. Add form submission handler
4. Add to menu

