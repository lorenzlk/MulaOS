/**
 * Google Apps Script: MulaOS Custom Functions
 * 
 * This file contains all custom functions for the MulaOS database.
 * Add these functions to your Apps Script project.
 * 
 * Functions include:
 * - ID generation
 * - Relationship queries
 * - Data validation
 * - Activity logging
 * - Custom menu items
 */

// ============================================================================
// MENU SETUP
// ============================================================================

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('MulaOS')
    .addItem('Add Account', 'showAddAccountDialog')
    .addItem('Add Contact', 'showAddContactDialog')
    .addItem('Add Project', 'showAddProjectDialog')
    .addItem('Add Task', 'showAddTaskDialog')
    .addSeparator()
    .addItem('Generate Report', 'showReportDialog')
    .addItem('View Account Details', 'showAccountDetails')
    .addSeparator()
    .addItem('Refresh Lookups', 'refreshLookups')
    .addToUi();
}

// ============================================================================
// ID GENERATION (URL-Based)
// ============================================================================

function generateAccountID(accountName, websiteDomain) {
  /**
   * Generates URL-based ID for account using publisher's website domain
   * @param {string} accountName - Account/company name
   * @param {string} websiteDomain - Publisher's website domain (e.g., "twsn.net", "on3.com")
   * @return {string} URL-based ID like "https://twsn.net" or "https://on3.com"
   * 
   * If websiteDomain is provided, uses that. Otherwise, tries to infer from account name.
   */
  if (!accountName) return '';
  
  // If website domain is provided, use it
  if (websiteDomain && websiteDomain.trim() !== '') {
    // Normalize domain (add https:// if missing, remove www.)
    let domain = websiteDomain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, ''); // Remove existing protocol
    domain = domain.replace(/^www\./, ''); // Remove www.
    domain = domain.split('/')[0]; // Remove any path
    return `https://${domain}`;
  }
  
  // Fallback: Try to infer domain from account name
  // This is a best-guess fallback - ideally websiteDomain should be provided
  const normalized = accountName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '')  // Remove spaces and special chars
    .replace(/^-+|-+$/g, '');
  
  // Common domain patterns (add more as needed)
  const commonTLDs = ['.com', '.net', '.org', '.io', '.co'];
  for (const tld of commonTLDs) {
    // This is just a fallback - the actual domain should come from data
    return `https://${normalized}${tld}`;
  }
  
  return `https://${normalized}.com`; // Default fallback
}

function generateContactID(email) {
  /**
   * Generates ID for contact using email
   * @param {string} email - Contact email
   * @return {string} Contact ID (email-based)
   */
  if (!email) return '';
  
  // Use email as the ID (or encode if needed)
  return email.toLowerCase().trim();
}

function generateProgramID(companyName, accountID) {
  /**
   * Generates ID for program
   * @param {string} companyName - Company name
   * @param {string} accountID - Account ID (publisher's website URL)
   * @return {string} Program ID
   */
  if (!companyName) return '';
  
  // Use account ID (publisher's website) + program suffix
  if (accountID) {
    return `${accountID}/program`;
  }
  
  // Fallback: use company name
  const normalized = companyName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${normalized}-pilot-program`;
}

function generateProjectID(projectName, accountID) {
  /**
   * Generates ID for project
   * @param {string} projectName - Project name
   * @param {string} accountID - Account ID (publisher's website URL)
   * @return {string} Project ID
   */
  if (!projectName) return '';
  
  // Use account ID (publisher's website) + project name
  if (accountID) {
    const normalized = projectName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${accountID}/projects/${normalized}`;
  }
  
  // Fallback: use project name only
  const normalized = projectName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized;
}

function generateTaskID(taskName, projectID) {
  /**
   * Generates ID for task
   * @param {string} taskName - Task name
   * @param {string} projectID - Project ID
   * @return {string} Task ID
   */
  if (!taskName) return '';
  
  const normalized = taskName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (projectID) {
    // Use project ID + task name
    return `${projectID}/tasks/${normalized}`;
  }
  
  return normalized;
}

function generateActivityID() {
  /**
   * Generates ID for activity log entry
   * Uses timestamp for uniqueness
   * @return {string} Activity ID
   */
  const timestamp = Date.now();
  return `activity-${timestamp}`;
}

// Legacy function for backward compatibility (if needed)
function generateID(prefix) {
  /**
   * Legacy ID generation - kept for compatibility
   * Prefer URL-based functions above
   */
  const uuid = Utilities.getUuid().substring(0, 8);
  return `${prefix}-${uuid}`;
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

function validateEmail(email) {
  /**
   * Validates email format
   * @param {string} email - Email address to validate
   * @return {boolean} True if valid email format
   */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function checkDuplicateEmail(email, excludeRow = null) {
  /**
   * Checks if email already exists in Contacts sheet
   * @param {string} email - Email to check
   * @param {number} excludeRow - Row to exclude from check (for updates)
   * @return {boolean} True if duplicate found
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return false;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (excludeRow && i === excludeRow) continue;
    if (data[i][3] && data[i][3].toLowerCase() === email.toLowerCase()) {
      return true;
    }
  }
  return false;
}

function validateAccountName(name, excludeRow = null) {
  /**
   * Checks if account name already exists
   * @param {string} name - Account name to check
   * @param {number} excludeRow - Row to exclude from check
   * @return {boolean} True if duplicate found
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Accounts');
  if (!sheet) return false;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (excludeRow && i === excludeRow) continue;
    if (data[i][1] && data[i][1].toLowerCase() === name.toLowerCase()) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// RELATIONSHIP QUERIES
// ============================================================================

function getAccountPrograms(accountID) {
  /**
   * Gets all programs for an account
   * @param {string} accountID - Account ID
   * @return {Array} 2D array of program data (for display in Sheets)
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Programs');
  if (!sheet) return [['No Programs sheet found']];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [['No programs found']];
  
  const headers = data[0];
  const programs = [];
  
  // Add header row
  programs.push(headers);
  
  // Add matching program rows
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === accountID) { // Account ID column (index 2)
      programs.push(data[i]);
    }
  }
  
  if (programs.length === 1) {
    return [['No programs found for this account']];
  }
  
  return programs;
}

function getAccountContacts(accountID) {
  /**
   * Gets all contacts for an account
   * @param {string} accountID - Account ID
   * @return {Array} 2D array of contact data (for display in Sheets)
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return [['No Contacts sheet found']];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [['No contacts found']];
  
  const headers = data[0];
  const contacts = [];
  
  // Add header row
  contacts.push(headers);
  
  // Add matching contact rows
  for (let i = 1; i < data.length; i++) {
    const accountIDs = data[i][6]; // Account IDs column (index 6, comma-separated)
    if (accountIDs && accountIDs.toString().includes(accountID)) {
      contacts.push(data[i]);
    }
  }
  
  if (contacts.length === 1) {
    return [['No contacts found for this account']];
  }
  
  return contacts;
}

function getAccountProjects(accountID) {
  /**
   * Gets all projects for an account
   * @param {string} accountID - Account ID
   * @return {Array} 2D array of project data (for display in Sheets)
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Projects');
  if (!sheet) return [['No Projects sheet found']];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [['No projects found']];
  
  const headers = data[0];
  const projects = [];
  
  // Add header row
  projects.push(headers);
  
  // Add matching project rows
  for (let i = 1; i < data.length; i++) {
    const accountIDs = data[i][9]; // Related Account IDs column (index 9)
    if (accountIDs && accountIDs.toString().includes(accountID)) {
      projects.push(data[i]);
    }
  }
  
  if (projects.length === 1) {
    return [['No projects found for this account']];
  }
  
  return projects;
}

function getProjectTasks(projectID) {
  /**
   * Gets all tasks for a project
   * @param {string} projectID - Project ID
   * @return {Array} 2D array of task data (for display in Sheets)
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Tasks');
  if (!sheet) return [['No Tasks sheet found']];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [['No tasks found']];
  
  const headers = data[0];
  const tasks = [];
  
  // Add header row
  tasks.push(headers);
  
  // Add matching task rows
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === projectID) { // Project ID column (index 2)
      tasks.push(data[i]);
    }
  }
  
  if (tasks.length === 1) {
    return [['No tasks found for this project']];
  }
  
  return tasks;
}

function getSubTasks(taskID) {
  /**
   * Gets all subtasks for a task
   * @param {string} taskID - Parent Task ID
   * @return {Array} 2D array of subtask data (for display in Sheets)
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Tasks');
  if (!sheet) return [['No Tasks sheet found']];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [['No subtasks found']];
  
  const headers = data[0];
  const subtasks = [];
  
  // Add header row
  subtasks.push(headers);
  
  // Add matching subtask rows
  for (let i = 1; i < data.length; i++) {
    if (data[i][8] === taskID) { // Parent Task ID column (index 8)
      subtasks.push(data[i]);
    }
  }
  
  if (subtasks.length === 1) {
    return [['No subtasks found for this task']];
  }
  
  return subtasks;
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

function logActivity(entityType, entityID, action, user, field, oldValue, newValue, details) {
  /**
   * Logs an activity to the Activity Log sheet
   * @param {string} entityType - Type of entity (Account, Contact, etc.)
   * @param {string} entityID - ID of the entity
   * @param {string} action - Action performed (Created, Updated, Deleted)
   * @param {string} user - User who performed the action
   * @param {string} field - Field that changed (optional)
   * @param {string} oldValue - Old value (optional)
   * @param {string} newValue - New value (optional)
   * @param {string} details - Additional details (optional)
   */
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Activity Log');
    if (!sheet) {
      Logger.log('Activity Log sheet not found');
      return;
    }
    
    const activityID = generateActivityID();
    const timestamp = new Date();
    const userName = user || Session.getActiveUser().getEmail();
    
    const row = [
      activityID,
      timestamp,
      entityType || '',
      entityID || '',
      action || '',
      userName,
      field || '',
      oldValue || '',
      newValue || '',
      details || ''
    ];
    
    sheet.appendRow(row);
    Logger.log(`Activity logged: ${action} on ${entityType} ${entityID}`);
  } catch (error) {
    Logger.log('Error logging activity: ' + error.toString());
  }
}

// ============================================================================
// AUTOMATED TRIGGERS
// ============================================================================

function onEdit(e) {
  /**
   * Triggered when a cell is edited
   * Logs changes to Activity Log
   */
  try {
    const sheet = e.source.getActiveSheet();
    const sheetName = sheet.getName();
    const row = e.range.getRow();
    const col = e.range.getColumn();
    
    // Skip header row
    if (row === 1) return;
    
    // Skip Activity Log and Lookups sheets
    if (sheetName === 'Activity Log' || sheetName === 'Lookups') return;
    
    // Skip if editing multiple cells at once (paste operations)
    if (e.range.getNumRows() > 1 || e.range.getNumColumns() > 1) {
      // For bulk edits, log once with details
      return;
    }
    
    // Get entity type (handle singular/plural)
    let entityType = sheetName;
    if (sheetName.endsWith('s')) {
      entityType = sheetName.slice(0, -1); // Remove 's' from plural
    }
    
    // Get ID from column A (can be URL or legacy format)
    const entityID = sheet.getRange(row, 1).getValue();
    
    // Skip if no ID (new row being created)
    if (!entityID || entityID === '') {
      // This might be a new row - log as Created if ID column was just filled
      if (col === 1 && e.value && e.value !== '') {
        logActivity(
          entityType,
          e.value,
          'Created',
          Session.getActiveUser().getEmail(),
          'ID',
          '',
          e.value.toString(),
          `New ${entityType} created`
        );
      }
      return;
    }
    
    // Validate ID format (should be URL or legacy format)
    // Accept both URL-based and legacy IDs for compatibility
    
    // Get field name from header
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const fieldName = headers[col - 1] || `Column ${col}`;
    
    // Skip logging changes to ID, Created Date, Last Updated (auto-generated fields)
    if (fieldName === 'ID' || fieldName === 'Created Date' || fieldName === 'Last Updated') {
      return;
    }
    
    // Get old and new values
    const oldValue = e.oldValue || '';
    const newValue = e.value || '';
    
    // Log the change
    if (oldValue !== newValue) {
      logActivity(
        entityType,
        entityID,
        'Updated',
        Session.getActiveUser().getEmail(),
        fieldName,
        oldValue.toString(),
        newValue.toString(),
        `${fieldName} changed from "${oldValue}" to "${newValue}"`
      );
    }
  } catch (error) {
    // Log error but don't break the edit
    Logger.log('Error in onEdit: ' + error.toString());
  }
}

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateProjectCompletion(projectID) {
  /**
   * Calculates completion percentage for a project based on tasks
   * @param {string} projectID - Project ID
   * @return {number} Completion percentage (0-1)
   */
  const tasks = getProjectTasks(projectID);
  if (tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(task => task.Status === 'Done').length;
  return completedTasks / tasks.length;
}

function updateProjectCompletion(projectID) {
  /**
   * Updates the Completion field for a project
   * @param {string} projectID - Project ID
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Projects');
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const completionCol = 7; // Completion column index
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === projectID) { // ID column
      const completion = calculateProjectCompletion(projectID);
      sheet.getRange(i + 1, completionCol).setValue(completion);
      break;
    }
  }
}

// ============================================================================
// DIALOGS (Placeholder functions - implement UI as needed)
// ============================================================================

function showAddAccountDialog() {
  SpreadsheetApp.getUi().alert('Add Account dialog - To be implemented');
}

function showAddContactDialog() {
  SpreadsheetApp.getUi().alert('Add Contact dialog - To be implemented');
}

function showAddProjectDialog() {
  /**
   * Shows the Add Project dialog
   */
  const html = HtmlService.createHtmlOutputFromFile('AddProjectDialog')
    .setWidth(500)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add New Project');
}

function getAccountsForDialog() {
  /**
   * Gets accounts for the dialog dropdown
   * @return {Array} Array of {id, name} objects
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Accounts');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const accounts = [];
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const accountID = data[i][0]; // Column A (ID)
    const accountName = data[i][1]; // Column B (Account Name)
    
    if (accountID && accountName) {
      accounts.push({
        id: accountID,
        name: accountName
      });
    }
  }
  
  return accounts;
}

function addProject(formData) {
  /**
   * Adds a new project from the dialog form
   * @param {Object} formData - Form data from dialog
   * @return {Object} Result object with success/error
   */
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Projects');
    if (!sheet) {
      return { success: false, error: 'Projects sheet not found' };
    }
    
    // Validate required fields
    if (!formData.projectName || formData.projectName.trim() === '') {
      return { success: false, error: 'Project name is required' };
    }
    
    if (!formData.status) {
      return { success: false, error: 'Status is required' };
    }
    
    if (!formData.priority) {
      return { success: false, error: 'Priority is required' };
    }
    
    // Generate Project ID
    const projectID = generateProjectID(formData.projectName);
    
    // Get current date
    const today = new Date();
    
    // Prepare account IDs (comma-separated)
    const accountIDs = formData.accountIds && formData.accountIds.length > 0
      ? formData.accountIds.join(',')
      : '';
    
    // Prepare row data (matching Projects sheet columns)
    const values = [
      projectID,                                    // ID
      formData.projectName.trim(),                   // Project Name
      formData.summary || '',                       // Summary
      formData.status,                              // Status
      formData.owner || '',                         // Owner
      formData.priority,                            // Priority
      '',                                           // Completion (calculated later)
      formData.dates || '',                         // Dates
      today,                                        // Last Updated
      accountIDs,                                   // Related Account IDs
      today,                                        // Created Date
      formData.notes || ''                          // Notes
    ];
    
    // Add row to sheet
    sheet.appendRow(values);
    
    // Log activity
    logActivity(
      'Project',
      projectID,
      'Created',
      Session.getActiveUser().getEmail(),
      'Project Name',
      '',
      formData.projectName,
      `New project created: ${formData.projectName}`
    );
    
    return { 
      success: true, 
      projectID: projectID,
      message: `Project "${formData.projectName}" added successfully`
    };
    
  } catch (error) {
    Logger.log('Error adding project: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function showAddTaskDialog() {
  SpreadsheetApp.getUi().alert('Add Task dialog - To be implemented');
}

function showReportDialog() {
  SpreadsheetApp.getUi().alert('Report dialog - To be implemented');
}

function showAccountDetails() {
  SpreadsheetApp.getUi().alert('Account Details - To be implemented');
}

function refreshLookups() {
  SpreadsheetApp.getUi().alert('Lookups refreshed');
}

