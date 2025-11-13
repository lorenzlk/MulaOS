/**
 * Google Apps Script: Setup MulaOS Database Spreadsheet
 * 
 * This script creates the complete Google Sheets database structure
 * with all sheets, columns, data validation, and formatting.
 * 
 * Usage:
 * 1. Create a new Google Spreadsheet
 * 2. Open Apps Script editor
 * 3. Paste this code
 * 4. Run setupDatabase() function
 */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Set spreadsheet name
  ss.rename('MulaOS_Database');
  
  // Create all sheets
  createAccountsSheet(ss);
  createContactsSheet(ss);
  createProgramsSheet(ss);
  createProjectsSheet(ss);
  createTasksSheet(ss);
  createActivityLogSheet(ss);
  createLookupsSheet(ss);
  
  // Set up protection and formatting
  protectHeaders(ss);
  formatSheets(ss);
  
  Logger.log('Database setup complete!');
}

function createAccountsSheet(ss) {
  // Delete if exists, create new
  let sheet = ss.getSheetByName('Accounts');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Accounts');
  
  // Headers
  const headers = [
    'ID', 'Account Name', 'Website Domain', 'Type', 'Segment', 'Stage', 'Widgets', 'Platform',
    'KVP Enabled', 'Goal RPM/RPS', 'Launch Date', 'Last Updated',
    'Mula Product Roadmap', 'Related Projects', 'Created Date', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
  
  // Set column widths
  sheet.setColumnWidth(1, 200); // ID (website URL)
  sheet.setColumnWidth(2, 200); // Account Name
  sheet.setColumnWidth(3, 150); // Website Domain
  sheet.setColumnWidth(4, 120); // Type
  sheet.setColumnWidth(5, 100); // Segment
  sheet.setColumnWidth(6, 120); // Stage
  sheet.setColumnWidth(7, 150); // Widgets
  sheet.setColumnWidth(8, 120); // Platform
  sheet.setColumnWidth(9, 100); // KVP Enabled
  sheet.setColumnWidth(10, 120); // Goal RPM/RPS
  sheet.setColumnWidth(11, 120); // Launch Date
  sheet.setColumnWidth(12, 120); // Last Updated
  sheet.setColumnWidth(13, 300); // Mula Product Roadmap
  sheet.setColumnWidth(14, 200); // Related Projects
  sheet.setColumnWidth(15, 120); // Created Date
  sheet.setColumnWidth(16, 300); // Notes
  
  // Data validation
  // Column positions: A=ID, B=Account Name, C=Website Domain, D=Type, E=Segment, F=Stage, G=Widgets, H=Platform, I=KVP Enabled
  
  const typeRange = sheet.getRange('D2:D1000'); // Type column (column D)
  const typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Publisher', 'Channel', 'Demand', 'Data', 'LLM Chat App'], true)
    .build();
  typeRange.setDataValidation(typeRule);
  
  const segmentRange = sheet.getRange('E2:E1000'); // Segment column (column E)
  const segmentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Tier 1', 'Tier 2', 'Tier 3'], true)
    .build();
  segmentRange.setDataValidation(segmentRule);
  
  const stageRange = sheet.getRange('F2:F1000'); // Stage column (column F)
  const stageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pilot Live', 'Live', 'Onboarding', 'GTM', 'Paused', 'Signed', 'N/A'], true)
    .build();
  stageRange.setDataValidation(stageRule);
  
  // Widgets - Allow multiple selections (comma-separated)
  // Note: Users can type "Smart-Scroll, Top-Shelf" or select from dropdown
  const widgetsRange = sheet.getRange('G2:G1000'); // Widgets column (column G)
  const widgetsRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Smart-Scroll', 'Top-Shelf', 'Smart-Scroll, Top-Shelf', 'Top-Shelf, Smart-Scroll'], true)
    .setAllowInvalid(false)
    .setHelpText('Select one or both widgets. For both, use: "Smart-Scroll, Top-Shelf"')
    .build();
  widgetsRange.setDataValidation(widgetsRule);
  
  // Platform - Allow multiple selections (comma-separated)
  const platformRange = sheet.getRange('H2:H1000'); // Platform column (column H)
  const platformRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Desktop', 'Mobile', 'Desktop, Mobile', 'Mobile, Desktop'], true)
    .setAllowInvalid(false)
    .setHelpText('Select one or both platforms. For both, use: "Desktop, Mobile"')
    .build();
  platformRange.setDataValidation(platformRule);
  
  const kvpRange = sheet.getRange('I2:I1000'); // KVP Enabled column (column I)
  const kvpRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No', 'NA'], true)
    .build();
  kvpRange.setDataValidation(kvpRule);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add filter to header row
  sheet.getRange(1, 1, 1, headers.length).createFilter();
  
  // Note: Protection will be set up after data is imported
  // ID and Created Date columns should be protected later
}

function createContactsSheet(ss) {
  let sheet = ss.getSheetByName('Contacts');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Contacts');
  
  const headers = [
    'ID', 'First Name', 'Last Name', 'Email', 'Title', 'Phone',
    'Account IDs', 'Related Companies', 'Status', 'Last Update',
    'Created Date', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#34a853');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // ID
  sheet.setColumnWidth(2, 120); // First Name
  sheet.setColumnWidth(3, 120); // Last Name
  sheet.setColumnWidth(4, 200); // Email
  sheet.setColumnWidth(5, 150); // Title
  sheet.setColumnWidth(6, 120); // Phone
  sheet.setColumnWidth(7, 200); // Account IDs
  sheet.setColumnWidth(8, 200); // Related Companies
  sheet.setColumnWidth(9, 100); // Status
  sheet.setColumnWidth(10, 120); // Last Update
  sheet.setColumnWidth(11, 120); // Created Date
  sheet.setColumnWidth(12, 300); // Notes
  
  // Data validation
  const statusRange = sheet.getRange('I2:I1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'Inactive'], true)
    .build();
  statusRange.setDataValidation(statusRule);
  
  // Email format validation (basic)
  const emailRange = sheet.getRange('D2:D1000');
  const emailRule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied('=REGEXMATCH(D2, "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")')
    .setAllowInvalid(false)
    .setHelpText('Please enter a valid email address')
    .build();
  emailRange.setDataValidation(emailRule);
  
  sheet.setFrozenRows(1);
  
  // Add filter to header row
  sheet.getRange(1, 1, 1, headers.length).createFilter();
}

function createProgramsSheet(ss) {
  let sheet = ss.getSheetByName('Programs');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Programs');
  
  const headers = [
    'ID', 'Program Name', 'Account ID', 'Company', 'Status', 'Phase',
    'Widgets', 'Platform', 'KVP', 'Health', 'Goal', 'Next Steps',
    'Leading KPI', 'Lagging KPI', 'Pilot Start Date', 'Baseline RPM',
    'RPM Lift', 'Pageview Percent', 'Revenue Data URL', 'Created Date',
    'Last Updated', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#ea4335');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // ID
  sheet.setColumnWidth(2, 200); // Program Name
  sheet.setColumnWidth(3, 120); // Account ID
  sheet.setColumnWidth(4, 150); // Company
  sheet.setColumnWidth(5, 120); // Status
  sheet.setColumnWidth(6, 100); // Phase
  sheet.setColumnWidth(7, 150); // Widgets
  sheet.setColumnWidth(8, 120); // Platform
  sheet.setColumnWidth(9, 80); // KVP
  sheet.setColumnWidth(10, 150); // Health
  sheet.setColumnWidth(11, 300); // Goal
  sheet.setColumnWidth(12, 300); // Next Steps
  sheet.setColumnWidth(13, 250); // Leading KPI
  sheet.setColumnWidth(14, 250); // Lagging KPI
  sheet.setColumnWidth(15, 120); // Pilot Start Date
  sheet.setColumnWidth(16, 120); // Baseline RPM
  sheet.setColumnWidth(17, 100); // RPM Lift
  sheet.setColumnWidth(18, 120); // Pageview Percent
  sheet.setColumnWidth(19, 300); // Revenue Data URL
  sheet.setColumnWidth(20, 120); // Created Date
  sheet.setColumnWidth(21, 120); // Last Updated
  sheet.setColumnWidth(22, 300); // Notes
  
  // Data validation
  const statusRange = sheet.getRange('E2:E1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'Onboarding', 'Pipeline', 'Churned', 'Inactive'], true)
    .build();
  statusRange.setDataValidation(statusRule);
  
  const phaseRange = sheet.getRange('F2:F1000');
  const phaseRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Live', 'Onboarding', 'Inactive'], true)
    .build();
  phaseRange.setDataValidation(phaseRule);
  
  const kvpRange = sheet.getRange('I2:I1000');
  const kvpRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No', 'NA'], true)
    .build();
  kvpRange.setDataValidation(kvpRule);
  
  const healthRange = sheet.getRange('J2:J1000');
  const healthRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Good', 'Needs Improvement', 'At Risk', 'Unknown'], true)
    .build();
  healthRange.setDataValidation(healthRule);
  
  // Widgets - Allow multiple selections (comma-separated)
  const widgetsRange = sheet.getRange('G2:G1000');
  const widgetsRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Smart-Scroll', 'Top-Shelf', 'Smart-Scroll, Top-Shelf', 'Top-Shelf, Smart-Scroll'], true)
    .setAllowInvalid(false)
    .setHelpText('Select one or both widgets. For both, use: "Smart-Scroll, Top-Shelf"')
    .build();
  widgetsRange.setDataValidation(widgetsRule);
  
  // Platform - Allow multiple selections (comma-separated)
  const platformRange = sheet.getRange('H2:H1000');
  const platformRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Desktop', 'Mobile', 'Desktop, Mobile', 'Mobile, Desktop'], true)
    .setAllowInvalid(false)
    .setHelpText('Select one or both platforms. For both, use: "Desktop, Mobile"')
    .build();
  platformRange.setDataValidation(platformRule);
  
  sheet.setFrozenRows(1);
  
  // Add filter to header row
  sheet.getRange(1, 1, 1, headers.length).createFilter();
}

function createProjectsSheet(ss) {
  let sheet = ss.getSheetByName('Projects');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Projects');
  
  const headers = [
    'ID', 'Project Name', 'Summary', 'Status', 'Owner', 'Priority',
    'Completion', 'Dates', 'Last Updated', 'Related Account IDs',
    'Created Date', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#fbbc04');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // ID
  sheet.setColumnWidth(2, 200); // Project Name
  sheet.setColumnWidth(3, 400); // Summary
  sheet.setColumnWidth(4, 120); // Status
  sheet.setColumnWidth(5, 150); // Owner
  sheet.setColumnWidth(6, 100); // Priority
  sheet.setColumnWidth(7, 100); // Completion
  sheet.setColumnWidth(8, 120); // Dates
  sheet.setColumnWidth(9, 120); // Last Updated
  sheet.setColumnWidth(10, 200); // Related Account IDs
  sheet.setColumnWidth(11, 120); // Created Date
  sheet.setColumnWidth(12, 300); // Notes
  
  // Data validation
  const statusRange = sheet.getRange('D2:D1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Done', 'In Progress', 'Planning', 'Backlog'], true)
    .build();
  statusRange.setDataValidation(statusRule);
  
  const priorityRange = sheet.getRange('F2:F1000');
  const priorityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['High', 'Medium', 'Low'], true)
    .build();
  priorityRange.setDataValidation(priorityRule);
  
  sheet.setFrozenRows(1);
  
  // Add filter to header row
  sheet.getRange(1, 1, 1, headers.length).createFilter();
}

function createTasksSheet(ss) {
  let sheet = ss.getSheetByName('Tasks');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Tasks');
  
  const headers = [
    'ID', 'Task Name', 'Project ID', 'Assignee', 'Status', 'Priority',
    'Due Date', 'Completed Date', 'Parent Task ID', 'Sub Tasks',
    'Place', 'Tags', 'Last Updated', 'Created Date', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#9aa0a6');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // ID
  sheet.setColumnWidth(2, 300); // Task Name
  sheet.setColumnWidth(3, 120); // Project ID
  sheet.setColumnWidth(4, 200); // Assignee
  sheet.setColumnWidth(5, 120); // Status
  sheet.setColumnWidth(6, 100); // Priority
  sheet.setColumnWidth(7, 120); // Due Date
  sheet.setColumnWidth(8, 120); // Completed Date
  sheet.setColumnWidth(9, 120); // Parent Task ID
  sheet.setColumnWidth(10, 200); // Sub Tasks
  sheet.setColumnWidth(11, 100); // Place
  sheet.setColumnWidth(12, 150); // Tags
  sheet.setColumnWidth(13, 120); // Last Updated
  sheet.setColumnWidth(14, 120); // Created Date
  sheet.setColumnWidth(15, 300); // Notes
  
  // Data validation
  const statusRange = sheet.getRange('E2:E1000');
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Done', 'In Progress', 'Not Started'], true)
    .build();
  statusRange.setDataValidation(statusRule);
  
  const priorityRange = sheet.getRange('F2:F1000');
  const priorityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['High', 'Medium', 'Low'], true)
    .build();
  priorityRange.setDataValidation(priorityRule);
  
  sheet.setFrozenRows(1);
  
  // Add filter to header row
  sheet.getRange(1, 1, 1, headers.length).createFilter();
}

function createActivityLogSheet(ss) {
  let sheet = ss.getSheetByName('Activity Log');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Activity Log');
  
  const headers = [
    'ID', 'Timestamp', 'Entity Type', 'Entity ID', 'Action', 'User',
    'Field', 'Old Value', 'New Value', 'Details'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#5f6368');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
  
  // Set column widths
  headers.forEach((_, i) => {
    sheet.setColumnWidth(i + 1, 150);
  });
  
  sheet.setFrozenRows(1);
  
  // Add filter to header row
  sheet.getRange(1, 1, 1, headers.length).createFilter();
}

function createLookupsSheet(ss) {
  let sheet = ss.getSheetByName('Lookups');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Lookups');
  
  const headers = ['Category', 'Value', 'Display Order', 'Active'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Populate lookup values
  const lookups = [
    ['Type', 'Publisher', 1, true],
    ['Type', 'Channel', 2, true],
    ['Type', 'Demand', 3, true],
    ['Type', 'Data', 4, true],
    ['Type', 'LLM Chat App', 5, true],
    ['Segment', 'Tier 1', 1, true],
    ['Segment', 'Tier 2', 2, true],
    ['Segment', 'Tier 3', 3, true],
    ['Stage', 'Pilot Live', 1, true],
    ['Stage', 'Live', 2, true],
    ['Stage', 'Onboarding', 3, true],
    ['Stage', 'GTM', 4, true],
    ['Stage', 'Paused', 5, true],
    ['Stage', 'Signed', 6, true],
    ['Stage', 'N/A', 7, true],
    ['Status', 'Active', 1, true],
    ['Status', 'Onboarding', 2, true],
    ['Status', 'Pipeline', 3, true],
    ['Status', 'Churned', 4, true],
    ['Status', 'Inactive', 5, true],
    ['Status', 'Done', 6, true],
    ['Status', 'In Progress', 7, true],
    ['Status', 'Planning', 8, true],
    ['Status', 'Backlog', 9, true],
    ['Status', 'Not Started', 10, true],
    ['Priority', 'High', 1, true],
    ['Priority', 'Medium', 2, true],
    ['Priority', 'Low', 3, true],
  ];
  
  sheet.getRange(2, 1, lookups.length, 4).setValues(lookups);
  sheet.setFrozenRows(1);
}

function protectHeaders(ss) {
  const sheets = ['Accounts', 'Contacts', 'Programs', 'Projects', 'Tasks'];
  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const lastCol = sheet.getLastColumn();
      if (lastCol > 0) {
        try {
          const headerRange = sheet.getRange(1, 1, 1, lastCol);
          const protection = headerRange.protect().setDescription(`Protect ${sheetName} headers`);
          protection.addEditor(Session.getEffectiveUser());
          protection.setWarningOnly(true); // Allow editing but show warning
        } catch (e) {
          Logger.log(`Could not protect headers for ${sheetName}: ${e.message}`);
        }
      }
    }
  });
}

function formatSheets(ss) {
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    // Skip if sheet is empty (only header row)
    if (lastRow <= 1 || lastCol < 1) {
      return;
    }
    
    // Format date columns
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    const headers = headerRange.getValues()[0];
    
    headers.forEach((header, colIndex) => {
      if (!header) return;
      
      const column = colIndex + 1;
      const dataRowCount = lastRow - 1; // Exclude header row
      
      // Skip if no data rows
      if (dataRowCount <= 0) return;
      
      const dataRange = sheet.getRange(2, column, dataRowCount, 1);
      
      // Format date columns
      if (header.toString().includes('Date') || header.toString().includes('Update')) {
        dataRange.setNumberFormat('yyyy-mm-dd');
      }
      
      // Format currency columns
      if (header.toString().includes('RPM') || header.toString().includes('RPS') || header.toString().includes('Revenue')) {
        dataRange.setNumberFormat('$#,##0.00');
      }
      
      // Format percentage columns
      if (header.toString().includes('Percent') || header.toString().includes('Completion') || header.toString().includes('Coverage')) {
        dataRange.setNumberFormat('0.00%');
      }
    });
  });
}

