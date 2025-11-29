/**
 * Google Apps Script: Import Notion CSV Data from Google Drive
 * 
 * This script imports Notion CSV exports from Google Drive into the MulaOS database.
 * 
 * Setup:
 * 1. Upload CSV files to Google Drive (in a folder called "Notion Export" or specify folder ID)
 * 2. Run importAllData() function
 * 3. Or run individual import functions: importAccounts(), importContacts(), etc.
 * 
 * Required CSV files:
 * - Mula Partners (Companies) *_all.csv
 * - Mula Partners (Contacts) *_all.csv
 * - Mula Pilot Partners (or Relational_Programs.csv)
 * - Mula Ops Projects *_all.csv
 * - Mula Ops Tasks *_all.csv
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Google Drive folder name containing CSV files
  CSV_FOLDER_NAME: 'Notion Export',
  
  // Or specify folder ID directly (more reliable)
  CSV_FOLDER_ID: null, // Set this if you know the folder ID
  
  // CSV file name patterns (will match files containing these strings)
  FILE_PATTERNS: {
    companies: ['Mula Partners (Companies)', 'Companies'],
    contacts: ['Mula Partners (Contacts)', 'Mula Partner Contacts'],
    programs: ['Mula Pilot Partners', 'Relational_Programs'],
    projects: ['Mula Ops Projects'],
    tasks: ['Mula Ops Tasks', 'Relational_Tasks']
  }
};

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

function importAllData() {
  /**
   * Main function to import all data in correct order
   * Returns summary of import results
   */
  const results = {
    accounts: { imported: 0, errors: [] },
    contacts: { imported: 0, errors: [] },
    programs: { imported: 0, errors: [] },
    projects: { imported: 0, errors: [] },
    tasks: { imported: 0, errors: [] }
  };
  
  try {
    // Step 1: Import Accounts (no dependencies)
    Logger.log('Starting Accounts import...');
    const accountMap = importAccounts();
    results.accounts.imported = accountMap.size;
    Logger.log(`Imported ${accountMap.size} accounts`);
    
    // Step 2: Import Contacts (needs Account IDs)
    Logger.log('Starting Contacts import...');
    const contactsResult = importContacts(accountMap);
    results.contacts.imported = contactsResult.imported;
    results.contacts.errors = contactsResult.errors;
    Logger.log(`Imported ${contactsResult.imported} contacts`);
    
    // Step 3: Import Programs (needs Account IDs)
    Logger.log('Starting Programs import...');
    const programsResult = importPrograms(accountMap);
    results.programs.imported = programsResult.imported;
    results.programs.errors = programsResult.errors;
    Logger.log(`Imported ${programsResult.imported} programs`);
    
    // Step 4: Import Projects (needs Account IDs)
    Logger.log('Starting Projects import...');
    const projectMap = importProjects(accountMap);
    results.projects.imported = projectMap.size;
    Logger.log(`Imported ${projectMap.size} projects`);
    
    // Step 5: Import Tasks (needs Project IDs)
    Logger.log('Starting Tasks import...');
    const tasksResult = importTasks(projectMap);
    results.tasks.imported = tasksResult.imported;
    results.tasks.errors = tasksResult.errors;
    Logger.log(`Imported ${tasksResult.imported} tasks`);
    
    // Summary
    const totalImported = 
      results.accounts.imported +
      results.contacts.imported +
      results.programs.imported +
      results.projects.imported +
      results.tasks.imported;
    
    Logger.log('\n=== Import Summary ===');
    Logger.log(`Total records imported: ${totalImported}`);
    Logger.log(`Accounts: ${results.accounts.imported}`);
    Logger.log(`Contacts: ${results.contacts.imported}`);
    Logger.log(`Programs: ${results.programs.imported}`);
    Logger.log(`Projects: ${results.projects.imported}`);
    Logger.log(`Tasks: ${results.tasks.imported}`);
    
    if (results.contacts.errors.length > 0 || 
        results.programs.errors.length > 0 || 
        results.tasks.errors.length > 0) {
      Logger.log('\nErrors occurred. Check logs above.');
    }
    
    return results;
    
  } catch (error) {
    Logger.log('Error during import: ' + error.toString());
    throw error;
  }
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

function getCSVFolder() {
  /**
   * Gets the Google Drive folder containing CSV files
   */
  if (CONFIG.CSV_FOLDER_ID) {
    try {
      return DriveApp.getFolderById(CONFIG.CSV_FOLDER_ID);
    } catch (e) {
      Logger.log('Could not find folder by ID: ' + CONFIG.CSV_FOLDER_ID);
    }
  }
  
  // Search by name
  const folders = DriveApp.getFoldersByName(CONFIG.CSV_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  
  throw new Error(`Could not find folder: ${CONFIG.CSV_FOLDER_NAME}. Please set CSV_FOLDER_ID in CONFIG.`);
}

function findCSVFile(patterns) {
  /**
   * Finds CSV file matching given patterns
   * @param {string[]} patterns - Array of strings to match in filename
   * @return {GoogleAppsScript.Drive.File} File object or null
   */
  const folder = getCSVFolder();
  const files = folder.getFilesByType('text/csv');
  
  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    
    // Check if filename contains any of the patterns
    for (const pattern of patterns) {
      if (fileName.includes(pattern)) {
        Logger.log(`Found CSV file: ${fileName}`);
        return file;
      }
    }
  }
  
  // Also check for .csv extension files
  const allFiles = folder.getFiles();
  while (allFiles.hasNext()) {
    const file = allFiles.next();
    const fileName = file.getName();
    if (!fileName.endsWith('.csv')) continue;
    
    for (const pattern of patterns) {
      if (fileName.includes(pattern)) {
        Logger.log(`Found CSV file: ${fileName}`);
        return file;
      }
    }
  }
  
  Logger.log(`Could not find CSV file matching: ${patterns.join(', ')}`);
  return null;
}

function readCSVFile(file) {
  /**
   * Reads CSV file and returns array of rows
   * @param {GoogleAppsScript.Drive.File} file
   * @return {string[][]} Array of rows, each row is array of values
   */
  if (!file) return [];
  
  const content = file.getBlob().getDataAsString();
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    Logger.log('CSV file has no data rows');
    return [];
  }
  
  const rows = [];
  for (const line of lines) {
    rows.push(parseCSVLine(line));
  }
  
  return rows;
}

function parseCSVLine(line) {
  /**
   * Parses a CSV line handling quoted values
   */
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

function importAccounts() {
  /**
   * Imports Accounts from Companies CSV
   * Returns Map of Account Name -> Account ID
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Accounts');
  if (!sheet) throw new Error('Accounts sheet not found');
  
  const file = findCSVFile(CONFIG.FILE_PATTERNS.companies);
  if (!file) {
    Logger.log('Companies CSV file not found. Skipping Accounts import.');
    return new Map();
  }
  
  const rows = readCSVFile(file);
  if (rows.length < 2) {
    Logger.log('No data rows in Companies CSV');
    return new Map();
  }
  
  const headers = rows[0];
  const accountMap = new Map();
  const today = new Date();
  
  // Find column indices
  const nameIdx = findColumnIndex(headers, ['Name', 'Account Name', 'Company']);
  const domainIdx = findColumnIndex(headers, ['Website Domain', 'Domain', 'Website']);
  const typeIdx = findColumnIndex(headers, ['Type']);
  const segmentIdx = findColumnIndex(headers, ['Segment']);
  const stageIdx = findColumnIndex(headers, ['Stage']);
  const widgetsIdx = findColumnIndex(headers, ['Widgets']);
  const platformIdx = findColumnIndex(headers, ['Platform']);
  const kvpIdx = findColumnIndex(headers, ['Ads Enabled', 'KVP Enabled', 'Ads']);
  const goalRPMIdx = findColumnIndex(headers, ['Goal RPM/RPS', 'Goal RPM', 'RPM']);
  const launchDateIdx = findColumnIndex(headers, ['Launch Date', 'Launch']);
  const lastUpdateIdx = findColumnIndex(headers, ['Last Update', 'Last Updated']);
  const roadmapIdx = findColumnIndex(headers, ['Mula Product Roadmap', 'Roadmap']);
  
  // Import rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[nameIdx] || row[nameIdx].trim() === '') continue;
    
    const accountName = row[nameIdx].trim();
    const websiteDomain = domainIdx >= 0 ? (row[domainIdx] || '').trim() : '';
    
    // Generate ID using Apps Script function
    const accountID = generateAccountID(accountName, websiteDomain);
    
    // Prepare row data
    const values = [
      accountID,                                    // ID
      accountName,                                  // Account Name
      websiteDomain,                                // Website Domain
      typeIdx >= 0 ? (row[typeIdx] || 'Publisher') : 'Publisher',  // Type
      segmentIdx >= 0 ? (row[segmentIdx] || 'Tier 3') : 'Tier 3', // Segment
      stageIdx >= 0 ? (row[stageIdx] || 'GTM') : 'GTM',           // Stage
      widgetsIdx >= 0 ? (row[widgetsIdx] || '') : '',              // Widgets
      platformIdx >= 0 ? mapPlatformValue(row[platformIdx] || '') : '', // Platform
      kvpIdx >= 0 ? (row[kvpIdx] || 'NA') : 'NA',                 // KVP Enabled
      goalRPMIdx >= 0 ? parseCurrency(row[goalRPMIdx] || '') : '', // Goal RPM/RPS
      launchDateIdx >= 0 ? parseDate(row[launchDateIdx] || '') : '', // Launch Date
      lastUpdateIdx >= 0 ? parseDate(row[lastUpdateIdx] || '') : today, // Last Updated
      roadmapIdx >= 0 ? extractURL(row[roadmapIdx] || '') : '',   // Mula Product Roadmap
      '',                                          // Related Projects (will be filled later)
      today,                                        // Created Date
      ''                                           // Notes
    ];
    
    sheet.appendRow(values);
    accountMap.set(accountName, accountID);
    Logger.log(`Imported account: ${accountName} (${accountID})`);
  }
  
  return accountMap;
}

function importContacts(accountMap) {
  /**
   * Imports Contacts from Contacts CSV
   * @param {Map} accountMap - Map of Account Name -> Account ID
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) throw new Error('Contacts sheet not found');
  
  const file = findCSVFile(CONFIG.FILE_PATTERNS.contacts);
  if (!file) {
    Logger.log('Contacts CSV file not found. Skipping Contacts import.');
    return { imported: 0, errors: [] };
  }
  
  const rows = readCSVFile(file);
  if (rows.length < 2) {
    Logger.log('No data rows in Contacts CSV');
    return { imported: 0, errors: [] };
  }
  
  const headers = rows[0];
  const emailMap = new Map(); // For deduplication
  const errors = [];
  const today = new Date();
  
  // Find column indices
  const firstNameIdx = findColumnIndex(headers, ['First Name', 'FirstName']);
  const lastNameIdx = findColumnIndex(headers, ['Last Name', 'LastName']);
  const emailIdx = findColumnIndex(headers, ['E-mail', 'Email', 'email']);
  const titleIdx = findColumnIndex(headers, ['Title', 'Job Title']);
  const companyIdx = findColumnIndex(headers, ['Related Mula Partner', 'Company', 'Account']);
  const notesIdx = findColumnIndex(headers, ['Notes']);
  const lastUpdateIdx = findColumnIndex(headers, ['Last Update', 'Last Updated']);
  
  let imported = 0;
  
  // Import rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const email = emailIdx >= 0 ? (row[emailIdx] || '').toLowerCase().trim() : '';
    
    if (!email || email === '') continue;
    
    // Deduplicate by email
    if (emailMap.has(email)) {
      Logger.log(`Skipping duplicate contact: ${email}`);
      continue;
    }
    emailMap.set(email, true);
    
    // Extract company names and match to Account IDs
    const companyStr = companyIdx >= 0 ? (row[companyIdx] || '') : '';
    const accountIDs = extractAccountIDs(companyStr, accountMap);
    
    // Generate Contact ID
    const contactID = generateContactID(email);
    
    // Prepare row data
    const values = [
      contactID,                                   // ID
      firstNameIdx >= 0 ? (row[firstNameIdx] || '') : '',  // First Name
      lastNameIdx >= 0 ? (row[lastNameIdx] || '') : '',    // Last Name
      email,                                       // Email
      titleIdx >= 0 ? (row[titleIdx] || '') : '',         // Title
      '',                                          // Phone
      accountIDs.join(','),                        // Account IDs
      extractCompanyNames(companyStr).join(','),  // Related Companies
      'Active',                                    // Status
      lastUpdateIdx >= 0 ? parseDate(row[lastUpdateIdx] || '') : today, // Last Update
      today,                                       // Created Date
      notesIdx >= 0 ? (row[notesIdx] || '') : ''  // Notes
    ];
    
    try {
      sheet.appendRow(values);
      imported++;
      Logger.log(`Imported contact: ${email}`);
    } catch (error) {
      errors.push({ email: email, error: error.toString() });
      Logger.log(`Error importing contact ${email}: ${error.toString()}`);
    }
  }
  
  return { imported, errors };
}

function importPrograms(accountMap) {
  /**
   * Imports Programs from Programs CSV
   * @param {Map} accountMap - Map of Account Name -> Account ID
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Programs');
  if (!sheet) throw new Error('Programs sheet not found');
  
  const file = findCSVFile(CONFIG.FILE_PATTERNS.programs);
  if (!file) {
    Logger.log('Programs CSV file not found. Skipping Programs import.');
    return { imported: 0, errors: [] };
  }
  
  const rows = readCSVFile(file);
  if (rows.length < 2) {
    Logger.log('No data rows in Programs CSV');
    return { imported: 0, errors: [] };
  }
  
  const headers = rows[0];
  const errors = [];
  const today = new Date();
  
  // Find column indices (adjust based on your CSV structure)
  const nameIdx = findColumnIndex(headers, ['Name', 'Company', 'Program Name']);
  const statusIdx = findColumnIndex(headers, ['Status']);
  const phaseIdx = findColumnIndex(headers, ['Phase']);
  const widgetsIdx = findColumnIndex(headers, ['Widgets']);
  const platformIdx = findColumnIndex(headers, ['Platform']);
  const kvpIdx = findColumnIndex(headers, ['Ads', 'KVP']);
  const healthIdx = findColumnIndex(headers, ['Health']);
  const goalIdx = findColumnIndex(headers, ['Goal']);
  const nextStepsIdx = findColumnIndex(headers, ['Next Steps']);
  const leadingKPIIdx = findColumnIndex(headers, ['Key KPI (Leading)', 'Leading KPI']);
  const laggingKPIIdx = findColumnIndex(headers, ['Key KPI (Lagging)', 'Lagging KPI']);
  const pilotStartIdx = findColumnIndex(headers, ['Pilot Start', 'Start Date']);
  const baselineRPMIdx = findColumnIndex(headers, ['Baseline RPM']);
  const rpmLiftIdx = findColumnIndex(headers, ['Incremental RPM Lift', 'RPM Lift']);
  const pageviewPercentIdx = findColumnIndex(headers, ['Mula % Pageviews', 'Pageview %']);
  const revenueDataIdx = findColumnIndex(headers, ['Revenue Data']);
  
  let imported = 0;
  
  // Import rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const companyName = nameIdx >= 0 ? (row[nameIdx] || '').trim() : '';
    
    if (!companyName || companyName === '') continue;
    
    // Match to Account ID
    const accountID = accountMap.get(companyName) || '';
    if (!accountID) {
      errors.push({ company: companyName, error: 'Account not found' });
      Logger.log(`Warning: Account not found for company: ${companyName}`);
      continue;
    }
    
    // Generate Program ID
    const programID = generateProgramID(companyName);
    const programName = `${companyName} Pilot Program`;
    
    // Prepare row data
    const values = [
      programID,                                   // ID
      programName,                                 // Program Name
      accountID,                                   // Account ID
      companyName,                                 // Company
      statusIdx >= 0 ? mapProgramStatus(row[statusIdx] || '') : 'Inactive', // Status
      phaseIdx >= 0 ? mapPhase(row[phaseIdx] || '') : 'Inactive', // Phase
      widgetsIdx >= 0 ? (row[widgetsIdx] || '') : '', // Widgets
      platformIdx >= 0 ? mapPlatformValue(row[platformIdx] || '') : '', // Platform
      kvpIdx >= 0 ? (row[kvpIdx] || 'NA') : 'NA', // KVP
      healthIdx >= 0 ? mapHealth(row[healthIdx] || '') : 'Unknown', // Health
      goalIdx >= 0 ? (row[goalIdx] || '') : '',   // Goal
      nextStepsIdx >= 0 ? (row[nextStepsIdx] || '') : '', // Next Steps
      leadingKPIIdx >= 0 ? (row[leadingKPIIdx] || '') : '', // Leading KPI
      laggingKPIIdx >= 0 ? (row[laggingKPIIdx] || '') : '', // Lagging KPI
      pilotStartIdx >= 0 ? parseMonthYear(row[pilotStartIdx] || '') : '', // Pilot Start Date
      baselineRPMIdx >= 0 ? parseRPMRange(row[baselineRPMIdx] || '') : '', // Baseline RPM
      rpmLiftIdx >= 0 ? parseCurrency(row[rpmLiftIdx] || '') : '', // RPM Lift
      pageviewPercentIdx >= 0 ? parsePageviewPercent(row[pageviewPercentIdx] || '') : '', // Pageview %
      revenueDataIdx >= 0 ? extractURL(row[revenueDataIdx] || '') : '', // Revenue Data URL
      today,                                       // Created Date
      today,                                       // Last Updated
      ''                                           // Notes
    ];
    
    try {
      sheet.appendRow(values);
      imported++;
      Logger.log(`Imported program: ${programName}`);
    } catch (error) {
      errors.push({ company: companyName, error: error.toString() });
      Logger.log(`Error importing program ${companyName}: ${error.toString()}`);
    }
  }
  
  return { imported, errors };
}

function importProjects(accountMap) {
  /**
   * Imports Projects from Projects CSV
   * @param {Map} accountMap - Map of Account Name -> Account ID
   * Returns Map of Project Name -> Project ID
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Projects');
  if (!sheet) throw new Error('Projects sheet not found');
  
  const file = findCSVFile(CONFIG.FILE_PATTERNS.projects);
  if (!file) {
    Logger.log('Projects CSV file not found. Skipping Projects import.');
    return new Map();
  }
  
  const rows = readCSVFile(file);
  if (rows.length < 2) {
    Logger.log('No data rows in Projects CSV');
    return new Map();
  }
  
  const headers = rows[0];
  const projectMap = new Map();
  const today = new Date();
  
  // Find column indices
  const nameIdx = findColumnIndex(headers, ['Name', 'Project Name']);
  const summaryIdx = findColumnIndex(headers, ['Summary', 'Description']);
  const statusIdx = findColumnIndex(headers, ['Status']);
  const ownerIdx = findColumnIndex(headers, ['Owner', 'Assignee']);
  const priorityIdx = findColumnIndex(headers, ['Priority']);
  const completionIdx = findColumnIndex(headers, ['Completion', '% Complete']);
  const datesIdx = findColumnIndex(headers, ['Dates', 'Date Range']);
  const lastUpdateIdx = findColumnIndex(headers, ['Last Update', 'Last Updated']);
  const accountIdx = findColumnIndex(headers, ['Related Account', 'Account', 'Company']);
  const notesIdx = findColumnIndex(headers, ['Notes']);
  
  // Import rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const projectName = nameIdx >= 0 ? (row[nameIdx] || '').trim() : '';
    
    if (!projectName || projectName === '') continue;
    
    // Match to Account ID if available
    const accountName = accountIdx >= 0 ? (row[accountIdx] || '').trim() : '';
    const accountID = accountName ? (accountMap.get(accountName) || '') : '';
    
    // Generate Project ID
    const projectID = generateProjectID(projectName);
    
    // Prepare row data
    const values = [
      projectID,                                   // ID
      projectName,                                 // Project Name
      summaryIdx >= 0 ? (row[summaryIdx] || '') : '', // Summary
      statusIdx >= 0 ? mapProjectStatus(row[statusIdx] || '') : 'Planning', // Status
      ownerIdx >= 0 ? (row[ownerIdx] || '') : '', // Owner
      priorityIdx >= 0 ? mapPriority(row[priorityIdx] || '') : 'Medium', // Priority
      completionIdx >= 0 ? parseCompletion(row[completionIdx] || '') : '', // Completion
      datesIdx >= 0 ? (row[datesIdx] || '') : '',  // Dates
      lastUpdateIdx >= 0 ? parseDate(row[lastUpdateIdx] || '') : today, // Last Updated
      accountID,                                   // Related Account IDs
      today,                                       // Created Date
      notesIdx >= 0 ? (row[notesIdx] || '') : ''  // Notes
    ];
    
    sheet.appendRow(values);
    projectMap.set(projectName, projectID);
    Logger.log(`Imported project: ${projectName} (${projectID})`);
  }
  
  return projectMap;
}

function importTasks(projectMap) {
  /**
   * Imports Tasks from Tasks CSV
   * @param {Map} projectMap - Map of Project Name -> Project ID
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Tasks');
  if (!sheet) throw new Error('Tasks sheet not found');
  
  const file = findCSVFile(CONFIG.FILE_PATTERNS.tasks);
  if (!file) {
    Logger.log('Tasks CSV file not found. Skipping Tasks import.');
    return { imported: 0, errors: [] };
  }
  
  const rows = readCSVFile(file);
  if (rows.length < 2) {
    Logger.log('No data rows in Tasks CSV');
    return { imported: 0, errors: [] };
  }
  
  const headers = rows[0];
  const errors = [];
  const today = new Date();
  
  // Find column indices
  const nameIdx = findColumnIndex(headers, ['Name', 'Task Name']);
  const projectIdx = findColumnIndex(headers, ['Related Project', 'Project', 'Project Name']);
  const assigneeIdx = findColumnIndex(headers, ['Assignee', 'Owner']);
  const statusIdx = findColumnIndex(headers, ['Status']);
  const priorityIdx = findColumnIndex(headers, ['Priority']);
  const dueDateIdx = findColumnIndex(headers, ['Due Date', 'Due']);
  const completedDateIdx = findColumnIndex(headers, ['Completed Date', 'Completed']);
  const parentTaskIdx = findColumnIndex(headers, ['Parent Task', 'Parent']);
  const placeIdx = findColumnIndex(headers, ['Place']);
  const tagsIdx = findColumnIndex(headers, ['Tags']);
  const lastUpdateIdx = findColumnIndex(headers, ['Last Update', 'Last Updated']);
  const notesIdx = findColumnIndex(headers, ['Notes']);
  
  let imported = 0;
  
  // Import rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const taskName = nameIdx >= 0 ? (row[nameIdx] || '').trim() : '';
    
    if (!taskName || taskName === '') continue;
    
    // Match to Project ID
    const projectName = projectIdx >= 0 ? (row[projectIdx] || '').trim() : '';
    const projectID = projectName ? (projectMap.get(projectName) || '') : '';
    
    if (!projectID && projectName) {
      errors.push({ task: taskName, error: `Project not found: ${projectName}` });
      Logger.log(`Warning: Project not found for task: ${taskName}`);
    }
    
    // Generate Task ID
    const taskID = generateTaskID(taskName, projectID);
    
    // Prepare row data
    const values = [
      taskID,                                      // ID
      taskName,                                    // Task Name
      projectID,                                   // Project ID
      assigneeIdx >= 0 ? (row[assigneeIdx] || '') : '', // Assignee
      statusIdx >= 0 ? mapTaskStatus(row[statusIdx] || '') : 'Not Started', // Status
      priorityIdx >= 0 ? mapPriority(row[priorityIdx] || '') : 'Medium', // Priority
      dueDateIdx >= 0 ? parseDate(row[dueDateIdx] || '') : '', // Due Date
      completedDateIdx >= 0 ? parseDate(row[completedDateIdx] || '') : '', // Completed Date
      parentTaskIdx >= 0 ? (row[parentTaskIdx] || '') : '', // Parent Task ID (will need to match)
      '',                                          // Sub Tasks (calculated)
      placeIdx >= 0 ? (row[placeIdx] || '') : '', // Place
      tagsIdx >= 0 ? (row[tagsIdx] || '') : '',   // Tags
      lastUpdateIdx >= 0 ? parseDate(row[lastUpdateIdx] || '') : today, // Last Updated
      today,                                       // Created Date
      notesIdx >= 0 ? (row[notesIdx] || '') : ''  // Notes
    ];
    
    try {
      sheet.appendRow(values);
      imported++;
      Logger.log(`Imported task: ${taskName}`);
    } catch (error) {
      errors.push({ task: taskName, error: error.toString() });
      Logger.log(`Error importing task ${taskName}: ${error.toString()}`);
    }
  }
  
  return { imported, errors };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function findColumnIndex(headers, possibleNames) {
  /**
   * Finds column index by matching header names (case-insensitive)
   */
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();
    for (const name of possibleNames) {
      if (header === name.toLowerCase().trim()) {
        return i;
      }
    }
  }
  return -1;
}

function extractAccountIDs(companyStr, accountMap) {
  /**
   * Extracts Account IDs from company string
   * Handles formats like "Company (https://...)" or "Company1, Company2"
   */
  if (!companyStr) return [];
  
  const accountIDs = [];
  const companies = extractCompanyNames(companyStr);
  
  for (const companyName of companies) {
    const accountID = accountMap.get(companyName);
    if (accountID) {
      accountIDs.push(accountID);
    }
  }
  
  return accountIDs;
}

function extractCompanyNames(companyStr) {
  /**
   * Extracts company names from Notion format
   * Handles: "Company (https://...)" or "Company1, Company2"
   */
  if (!companyStr) return [];
  
  const names = [];
  
  // Split by comma first
  const parts = companyStr.split(',');
  
  for (const part of parts) {
    // Extract name before "(" or use whole string
    const match = part.match(/^([^(]+)/);
    if (match) {
      names.push(match[1].trim());
    } else {
      names.push(part.trim());
    }
  }
  
  return names.filter(name => name !== '');
}

function extractURL(str) {
  /**
   * Extracts URL from string (handles Notion link format)
   */
  if (!str) return '';
  const match = str.match(/https?:\/\/[^\s)]+/);
  return match ? match[0] : '';
}

function parseDate(dateStr) {
  /**
   * Parses date string to YYYY-MM-DD format
   */
  if (!dateStr || dateStr.trim() === '') return '';
  
  // Try parsing as Date object first
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Handle "September 18, 2025" format
  const months = {
    january: '01', jan: '01', february: '02', feb: '02',
    march: '03', mar: '03', april: '04', apr: '04',
    may: '05', june: '06', jun: '06', july: '07', jul: '07',
    august: '08', aug: '08', september: '09', sep: '09',
    october: '10', oct: '10', november: '11', nov: '11',
    december: '12', dec: '12',
  };
  
  const match = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/i);
  if (match) {
    const month = months[match[1].toLowerCase()] || '01';
    const day = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  
  return '';
}

function parseMonthYear(monthYearStr) {
  /**
   * Parses "June '25" or "June 2025" to YYYY-MM-01
   */
  if (!monthYearStr || monthYearStr.trim() === '') return '';
  
  const months = {
    january: '01', jan: '01', february: '02', feb: '02',
    march: '03', mar: '03', april: '04', apr: '04',
    may: '05', june: '06', jun: '06', july: '07', jul: '07',
    august: '08', aug: '08', september: '09', sep: '09',
    october: '10', oct: '10', november: '11', nov: '11',
    december: '12', dec: '12',
  };
  
  const match = monthYearStr.toLowerCase().match(/(\w+)\s*['']?(\d{2,4})/);
  if (match) {
    const month = months[match[1]] || '01';
    let year = match[2];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-01`;
  }
  
  return '';
}

function parseCurrency(currencyStr) {
  /**
   * Parses currency string to number
   */
  if (!currencyStr || currencyStr.trim() === '') return '';
  const num = parseFloat(currencyStr.replace(/[$,]/g, ''));
  return isNaN(num) ? '' : num;
}

function parseRPMRange(rpmStr) {
  /**
   * Parses RPM range like "$3-5" to average
   */
  if (!rpmStr || rpmStr.trim() === '') return '';
  const match = rpmStr.match(/\$?(\d+)-(\d+)/);
  if (match) {
    return (parseFloat(match[1]) + parseFloat(match[2])) / 2;
  }
  return parseCurrency(rpmStr);
}

function parsePageviewPercent(percentStr) {
  /**
   * Parses percentage like "5-10%" to decimal (0.05-0.10)
   */
  if (!percentStr || percentStr.trim() === '') return '';
  const match = percentStr.match(/(\d+)-(\d+)%/);
  if (match) {
    return (parseFloat(match[1]) + parseFloat(match[2])) / 2 / 100;
  }
  const num = parseFloat(percentStr.replace('%', '')) / 100;
  return isNaN(num) ? '' : num;
}

function parseCompletion(completionStr) {
  /**
   * Parses completion percentage
   */
  if (!completionStr || completionStr.trim() === '') return '';
  const num = parseFloat(completionStr.replace('%', ''));
  return isNaN(num) ? '' : num / 100;
}

function mapPlatformValue(platform) {
  /**
   * Maps Platform values to Google Sheets format
   */
  if (!platform || platform.trim() === '') return '';
  
  const platformLower = platform.toLowerCase().trim();
  
  if (platformLower.includes('mobile') && platformLower.includes('web')) {
    return 'Desktop, Mobile';
  }
  if (platformLower === 'web') {
    return 'Desktop';
  }
  if (platformLower === 'mobile') {
    return 'Mobile';
  }
  
  return platform;
}

function mapProgramStatus(status) {
  const mapping = {
    'active – organic launch': 'Active',
    'paid pilot': 'Active',
    'onboarding': 'Onboarding',
    'late‑stage pipeline': 'Pipeline',
    'churned': 'Churned',
    'inactive': 'Inactive',
  };
  return mapping[status.toLowerCase()] || status || 'Inactive';
}

function mapPhase(phase) {
  const mapping = {
    'live': 'Live',
    'onboarding': 'Onboarding',
    'inactive': 'Inactive',
  };
  return mapping[phase.toLowerCase()] || phase || 'Inactive';
}

function mapHealth(health) {
  const mapping = {
    'needs improvement': 'Needs Improvement',
    'ok': 'Good',
    'in danger': 'At Risk',
  };
  return mapping[health.toLowerCase()] || health || 'Unknown';
}

function mapProjectStatus(status) {
  const mapping = {
    'done': 'Done',
    'in progress': 'In Progress',
    'planning': 'Planning',
    'backlog': 'Backlog',
  };
  return mapping[status.toLowerCase()] || status || 'Planning';
}

function mapTaskStatus(status) {
  const mapping = {
    'done': 'Done',
    'in progress': 'In Progress',
    'not started': 'Not Started',
  };
  return mapping[status.toLowerCase()] || status || 'Not Started';
}

function mapPriority(priority) {
  const mapping = {
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
  };
  return mapping[priority.toLowerCase()] || priority || 'Medium';
}

