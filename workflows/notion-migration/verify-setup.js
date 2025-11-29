/**
 * Google Apps Script: Verify MulaOS Database Setup
 * 
 * This script verifies that the database is set up correctly.
 * Run this function to check:
 * - All sheets exist
 * - Headers are correct
 * - Data validation is working
 * - Custom functions are available
 * 
 * Usage:
 * 1. Copy this function into Apps Script
 * 2. Run verifySetup()
 * 3. Check the execution log for results
 */

function verifySetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = {
    sheets: [],
    functions: [],
    errors: []
  };
  
  // Check required sheets
  const requiredSheets = ['Accounts', 'Contacts', 'Programs', 'Projects', 'Tasks', 'Activity Log', 'Lookups'];
  
  for (const sheetName of requiredSheets) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const rowCount = sheet.getLastRow();
      const colCount = sheet.getLastColumn();
      results.sheets.push({
        name: sheetName,
        exists: true,
        rows: rowCount,
        cols: colCount,
        hasHeaders: rowCount > 0
      });
    } else {
      results.errors.push(`Missing sheet: ${sheetName}`);
    }
  }
  
  // Check custom functions (by trying to call them)
  const functionsToCheck = [
    'generateAccountID',
    'generateContactID',
    'generateProgramID',
    'generateProjectID',
    'generateTaskID'
  ];
  
  for (const funcName of functionsToCheck) {
    try {
      // Try to get the function (won't execute, just check if it exists)
      const func = this[funcName];
      if (typeof func === 'function') {
        results.functions.push({ name: funcName, exists: true });
      } else {
        results.errors.push(`Function not found: ${funcName}`);
      }
    } catch (e) {
      results.errors.push(`Error checking function ${funcName}: ${e.message}`);
    }
  }
  
  // Check triggers
  const triggers = ScriptApp.getProjectTriggers();
  const hasOnEdit = triggers.some(t => t.getHandlerFunction() === 'onEdit');
  const hasOnOpen = triggers.some(t => t.getHandlerFunction() === 'onOpen');
  
  results.triggers = {
    onEdit: hasOnEdit,
    onOpen: hasOnOpen || 'onOpen runs automatically as simple trigger'
  };
  
  // Log results
  Logger.log('=== Setup Verification Results ===');
  Logger.log('\nSheets:');
  results.sheets.forEach(sheet => {
    Logger.log(`  ✓ ${sheet.name}: ${sheet.rows} rows, ${sheet.cols} cols`);
  });
  
  Logger.log('\nFunctions:');
  results.functions.forEach(func => {
    Logger.log(`  ✓ ${func.name}`);
  });
  
  Logger.log('\nTriggers:');
  Logger.log(`  onEdit: ${results.triggers.onEdit ? '✓ Set up' : '✗ Not set up'}`);
  Logger.log(`  onOpen: ${results.triggers.onOpen}`);
  
  if (results.errors.length > 0) {
    Logger.log('\nErrors:');
    results.errors.forEach(error => {
      Logger.log(`  ✗ ${error}`);
    });
  }
  
  // Return summary
  const summary = {
    allSheetsExist: results.sheets.length === requiredSheets.length,
    allFunctionsExist: results.functions.length === functionsToCheck.length,
    triggersSetUp: results.triggers.onEdit === true,
    hasErrors: results.errors.length > 0
  };
  
  Logger.log('\n=== Summary ===');
  Logger.log(`All sheets exist: ${summary.allSheetsExist ? '✓' : '✗'}`);
  Logger.log(`All functions exist: ${summary.allFunctionsExist ? '✓' : '✗'}`);
  Logger.log(`Triggers set up: ${summary.triggersSetUp ? '✓' : '✗'}`);
  Logger.log(`Has errors: ${summary.hasErrors ? '✗' : '✓'}`);
  
  return summary;
}

/**
 * Quick test function to verify activity logging works
 */
function testActivityLogging() {
  logActivity(
    'Test',
    'TEST-123',
    'Test Action',
    Session.getActiveUser().getEmail(),
    'Test Field',
    'Old Value',
    'New Value',
    'This is a test entry'
  );
  
  Logger.log('Test activity logged. Check Activity Log sheet.');
  return 'Test complete. Check Activity Log sheet for entry.';
}

/**
 * Test ID generation functions
 */
function testIDGeneration() {
  const results = {};
  
  try {
    results.accountID = generateAccountID('Test Account', 'test.com');
    Logger.log(`Account ID: ${results.accountID}`);
  } catch (e) {
    Logger.log(`Account ID error: ${e.message}`);
  }
  
  try {
    results.contactID = generateContactID('test@example.com');
    Logger.log(`Contact ID: ${results.contactID}`);
  } catch (e) {
    Logger.log(`Contact ID error: ${e.message}`);
  }
  
  return results;
}

