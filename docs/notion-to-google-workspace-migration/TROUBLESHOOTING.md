# Troubleshooting Guide

## Common Issues and Solutions

### Activity Log Not Recording Changes

**Symptoms**: Changes to Accounts, Contacts, Projects, or Tasks are not being logged in Activity Log.

**Possible Causes**:
1. `onEdit` trigger not set up
2. Activity Log sheet doesn't exist
3. Script errors preventing logging
4. Editing header row or protected cells

**Solutions**:

#### 1. Check if Trigger is Set Up
1. Open Apps Script editor
2. Click on the clock icon (Triggers) in left sidebar
3. Look for `onEdit` trigger
4. If missing, add it:
   - Click "+ Add Trigger"
   - Function: `onEdit`
   - Event source: "From spreadsheet"
   - Event type: "On edit"
   - Save

#### 2. Verify Activity Log Sheet Exists
1. Check that "Activity Log" sheet exists in your spreadsheet
2. Verify it has the correct headers:
   - ID, Timestamp, Entity Type, Entity ID, Action, User, Field, Old Value, New Value, Details

#### 3. Check Execution Log
1. In Apps Script editor, go to "Executions" (clock icon)
2. Look for recent `onEdit` executions
3. Check for errors
4. Click on execution to see details

#### 4. Test Activity Logging Manually
1. In Apps Script editor, run this test function:
```javascript
function testActivityLog() {
  logActivity('Account', 'ACC-test123', 'Updated', 'test@example.com', 'Account Name', 'Old Name', 'New Name', 'Test change');
}
```
2. Check Activity Log sheet for the entry
3. If this works, the issue is with the trigger

#### 5. Common Issues
- **Editing header row**: Changes to row 1 are skipped
- **Editing ID column**: Changes to ID column are skipped (auto-generated)
- **Bulk edits**: Paste operations may not trigger properly
- **Protected cells**: Editing protected cells may not trigger

### Apps Script Functions Not Working

**Symptoms**: Custom functions return errors or don't work.

**Solutions**:
1. **Check Authorization**: Ensure script is authorized
   - Run any function manually
   - Authorize if prompted

2. **Check Function Names**: Ensure exact spelling matches
   - Case-sensitive
   - No typos

3. **Check Return Types**: 
   - ID functions return strings
   - Query functions return 2D arrays

4. **Check Sheet Names**: Ensure sheet names match exactly
   - "Accounts" not "Account"
   - "Activity Log" not "ActivityLog"

### Data Validation Not Working

**Symptoms**: Dropdowns don't appear or show wrong values.

**Solutions**:
1. **Re-run Setup Script**: Run `setupDatabase()` again
2. **Check Lookups Sheet**: Ensure lookup values exist
3. **Manual Setup**: 
   - Select cells
   - Data → Data validation
   - Set criteria to "List of items"
   - Enter values separated by commas

### Import Errors

**Symptoms**: Data import fails or has errors.

**Solutions**:
1. **Check CSV Format**: Ensure CSV files are properly formatted
2. **Check Column Mapping**: Verify column order matches expected
3. **Check Data Types**: Ensure dates, numbers are in correct format
4. **Review Error Log**: Check import workflow error output

### Performance Issues

**Symptoms**: Spreadsheet is slow or functions timeout.

**Solutions**:
1. **Reduce Data**: Archive old records
2. **Optimize Formulas**: Use Apps Script instead of complex formulas
3. **Limit Queries**: Don't query entire sheets, use filters
4. **Cache Lookups**: Store lookup tables in memory

### Relationship Queries Return Empty

**Symptoms**: `getAccountPrograms()` returns "No programs found" when programs exist.

**Solutions**:
1. **Check Account ID**: Ensure Account ID matches exactly
   - Case-sensitive
   - No extra spaces
   - Full ID including prefix (ACC-xxx)

2. **Check Programs Sheet**: Verify programs have Account ID in correct column
   - Column C (index 2) for Account ID

3. **Test Manually**: 
   - Check Programs sheet
   - Find a program with Account ID
   - Use that exact ID in function

### Email Validation Errors

**Symptoms**: Valid emails are rejected.

**Solutions**:
1. **Check Format**: Ensure email is valid format
2. **Check Validation Rule**: May be too strict
3. **Disable Temporarily**: Remove validation to test
4. **Update Rule**: Modify regex pattern if needed

## Debugging Tips

### Enable Logging
1. Add `Logger.log()` statements in functions
2. View logs: View → Logs in Apps Script editor
3. Check execution transcript

### Test Functions Individually
1. Create test functions for each feature
2. Run manually to isolate issues
3. Check return values

### Check Permissions
1. Ensure you have edit access to spreadsheet
2. Check script authorization
3. Verify Google account permissions

## Getting Help

1. **Check Execution Log**: Apps Script → Executions
2. **Review Error Messages**: Read full error text
3. **Test in Isolation**: Create minimal test case
4. **Check Documentation**: Review function documentation

## Quick Fixes

### Reset Activity Logging
```javascript
function resetActivityLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Activity Log');
  if (sheet) {
    // Clear all data except headers
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
  }
}
```

### Test onEdit Trigger
```javascript
function testOnEdit() {
  // Simulate an edit event
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Accounts');
  const testRange = sheet.getRange(2, 2); // Row 2, Column B (Account Name)
  const oldValue = testRange.getValue();
  testRange.setValue('Test Value');
  
  // Check Activity Log
  const activitySheet = ss.getSheetByName('Activity Log');
  const lastRow = activitySheet.getLastRow();
  Logger.log('Last activity log entry: ' + activitySheet.getRange(lastRow, 1, 1, 10).getValues());
  
  // Restore value
  testRange.setValue(oldValue);
}
```

### Force Trigger Setup
```javascript
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEdit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('onEdit')
    .onEdit()
    .create();
  
  Logger.log('Trigger set up successfully');
}
```

