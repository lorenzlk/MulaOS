/**
 * Google Apps Script: Fix Import Relationships
 * 
 * This script fixes unmatched relationships after import:
 * - Programs that couldn't find their Accounts
 * - Tasks that couldn't find their Projects
 * 
 * Run fixAllRelationships() to fix everything, or run individual fix functions.
 */

// ============================================================================
// COMPANY NAME MAPPING
// ============================================================================

const COMPANY_NAME_MAPPING = {
  'RevContent': ['RevContent (Demand)', 'RevContent (Channel)'],
  'Stylecaster (SHE Media)': 'Stylecaster',
  'SHE Media': 'Stylecaster',
  'Green Planet': 'One Green Planet',
  'One Green Planet': 'One Green Planet', // Already correct
};

// ============================================================================
// PROJECT NAME MAPPING
// ============================================================================

const PROJECT_NAME_MAPPING = {
  'On3 launch Michigan section': 'On3 Launch',
  'On3 launch Ohio State section': 'On3 Launch',
  'Identify expansion target for team sites': 'On3 Expansion',
  'Create Slack onboarding guide for On3 Team': 'On3 Expansion',
  'Update Stylecaster TopShelf Carousel with inverted CSS Styling': 'StyleCaster Launch',
  'RevContent Reporting API Integration': 'RevContent Demand Integration',
  'Implement TopShelf': 'StyleCaster Launch',
  'Curate SW feed': 'Swimming World Launch',
  'Curate Essence feed': 'Essence Launch',
  'Evaluate branded test W/Deep.ai': 'DeepAI Expansion',
  'Deploy Mula update to pass KVPs in GAM': 'GAM Attribution & Reporting',
  'Confirm GAM Reporting for KVPs': 'GAM Attribution & Reporting',
  'RevContent single placement rollout': 'RevContent Demand Integration',
  'Validate RevContent Test results': 'Validate RevContent Test results',
  'Validate RevContent Test results ,Logan Lorenz,,,September 29': 'Validate RevContent Test results',
  'Review Audience Acuity Docs': 'Audience Acuity Integration',
  'Finalize Next Article Rec PRD': 'Next Article Recommendation',
  'Add UTM parameters to links for attribution measurement': 'Publisher Attribution Tests',
  'Design a test to reorder offers dynamically': 'Personalization & Fatigue Reduction',
  'Scope light cookie-based personalization': 'Personalization & Fatigue Reduction',
  'Brit+Co GAM KVP': 'Brit+Co Expansion',
  'On3 GAM KVP': 'On3 Launch',
  'Prepare LinkedIn announcements': 'Q4 Go-to-Market (Marketing)',
  'Next Article PRD Phase 1': 'Next Article Recommendation',
  'Brit+Co taxonomy experiment': 'Brit+Co Expansion',
  'On3 taxonomy experiment': 'On3 Launch',
  'Reactivate tags': 'On3 Launch',
  'Implement test AA pixel': 'Publisher Attribution Tests',
  'Review Match Data': 'Publisher Attribution Tests',
  'AA Targeting PRD': 'Publisher Attribution Tests',
  'Run taxonomy experiment': 'On3 Launch',
  'MVP Demo': 'Next Article Recommendation',
  'Phase 2 (Pub Feedback)': 'Next Article Recommendation',
  'Measure Results': 'Next Article Recommendation',
  'Auburn Launch': 'On3 Expansion',
  'Notre Dame Launch': 'On3 Expansion',
  'Migrate to Brit Amazon Acct': 'Brit+Co Expansion',
  'McClatchy Amazon Associates Setup': 'McClatchy Launch',
  'Placement + Targeting': 'Publisher Attribution Tests',
  'Targeting (Slash Command)': 'Publisher Attribution Tests',
  'TestPub (Jeffrey)': 'Publisher Attribution Tests',
};

// ============================================================================
// MAIN FIX FUNCTION
// ============================================================================

function fixAllRelationships() {
  /**
   * Fixes all relationship issues
   */
  Logger.log('=== Fixing Relationships ===\n');
  
  const results = {
    programsFixed: 0,
    tasksFixed: 0,
    errors: []
  };
  
  try {
    // Fix Programs
    Logger.log('Fixing Programs...');
    results.programsFixed = fixProgramRelationships();
    Logger.log(`Fixed ${results.programsFixed} programs\n`);
    
    // Fix Tasks
    Logger.log('Fixing Tasks...');
    results.tasksFixed = fixTaskRelationships();
    Logger.log(`Fixed ${results.tasksFixed} tasks\n`);
    
    Logger.log('=== Fix Complete ===');
    Logger.log(`Programs fixed: ${results.programsFixed}`);
    Logger.log(`Tasks fixed: ${results.tasksFixed}`);
    
    return results;
    
  } catch (error) {
    Logger.log('Error fixing relationships: ' + error.toString());
    results.errors.push(error.toString());
    throw error;
  }
}

// ============================================================================
// FIX PROGRAM RELATIONSHIPS
// ============================================================================

function fixProgramRelationships() {
  /**
   * Fixes Programs that couldn't find their Accounts
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const programsSheet = ss.getSheetByName('Programs');
  const accountsSheet = ss.getSheetByName('Accounts');
  
  if (!programsSheet || !accountsSheet) {
    throw new Error('Programs or Accounts sheet not found');
  }
  
  // Build account name -> ID map
  const accountMap = new Map();
  const accountData = accountsSheet.getDataRange().getValues();
  for (let i = 1; i < accountData.length; i++) {
    const accountID = accountData[i][0]; // Column A
    const accountName = accountData[i][1]; // Column B
    if (accountID && accountName) {
      accountMap.set(accountName, accountID);
    }
  }
  
  // Find programs with missing Account IDs
  const programData = programsSheet.getDataRange().getValues();
  let fixed = 0;
  
  for (let i = 1; i < programData.length; i++) {
    const accountID = programData[i][2]; // Column C (Account ID)
    const companyName = programData[i][3]; // Column D (Company)
    
    // Skip if already has Account ID
    if (accountID && accountID !== '') {
      Logger.log(`Program already has Account ID: ${companyName} → ${accountID}`);
      continue;
    }
    
    Logger.log(`Looking for Account ID for program: ${companyName}`);
    
    // Try to find matching account
    let matchedAccountID = null;
    
    // Check direct match
    if (accountMap.has(companyName)) {
      matchedAccountID = accountMap.get(companyName);
    } else {
      // Check mapping
      const mappedName = COMPANY_NAME_MAPPING[companyName];
      if (mappedName) {
        if (Array.isArray(mappedName)) {
          // Try each possible name
          for (const name of mappedName) {
            if (accountMap.has(name)) {
              matchedAccountID = accountMap.get(name);
              break;
            }
          }
        } else {
          // Single mapped name
          if (accountMap.has(mappedName)) {
            matchedAccountID = accountMap.get(mappedName);
          }
        }
      } else {
        // Try fuzzy matching (case-insensitive, partial)
        for (const [accountName, accountID] of accountMap.entries()) {
          if (accountName.toLowerCase().includes(companyName.toLowerCase()) ||
              companyName.toLowerCase().includes(accountName.toLowerCase())) {
            matchedAccountID = accountID;
            Logger.log(`Fuzzy matched: "${companyName}" → "${accountName}"`);
            break;
          }
        }
      }
    }
    
    // Update if found
    if (matchedAccountID) {
      programsSheet.getRange(i + 1, 3).setValue(matchedAccountID); // Column C
      fixed++;
      Logger.log(`Fixed program: ${companyName} → ${matchedAccountID}`);
    } else {
      Logger.log(`Could not match: ${companyName}`);
    }
  }
  
  return fixed;
}

// ============================================================================
// FIX TASK RELATIONSHIPS
// ============================================================================

function fixTaskRelationships() {
  /**
   * Fixes Tasks that couldn't find their Projects
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tasksSheet = ss.getSheetByName('Tasks');
  const projectsSheet = ss.getSheetByName('Projects');
  
  if (!tasksSheet || !projectsSheet) {
    throw new Error('Tasks or Projects sheet not found');
  }
  
  // Build project name -> ID map
  const projectMap = new Map();
  const projectData = projectsSheet.getDataRange().getValues();
  for (let i = 1; i < projectData.length; i++) {
    const projectID = projectData[i][0]; // Column A
    const projectName = projectData[i][1]; // Column B
    if (projectID && projectName) {
      projectMap.set(projectName, projectID);
      // Also map by normalized name (lowercase, no special chars)
      const normalized = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      projectMap.set(normalized, projectID);
    }
  }
  
  // Find tasks with missing Project IDs
  const taskData = tasksSheet.getDataRange().getValues();
  let fixed = 0;
  
  for (let i = 1; i < taskData.length; i++) {
    const projectID = taskData[i][2]; // Column C (Project ID)
    const taskName = taskData[i][1]; // Column B (Task Name)
    
    // Skip if already has Project ID
    if (projectID && projectID !== '') continue;
    
    // Try to find matching project
    let matchedProjectID = null;
    
    // Check mapping first
    const mappedProjectName = PROJECT_NAME_MAPPING[taskName];
    if (mappedProjectName) {
      if (projectMap.has(mappedProjectName)) {
        matchedProjectID = projectMap.get(mappedProjectName);
      }
    }
    
    // If not found, try fuzzy matching
    if (!matchedProjectID) {
      // Extract project name from task name (common patterns)
      const patterns = [
        /^(.+?)\s+(launch|expansion|integration|setup|test|demo|prd|kvp|experiment)/i,
        /^(.+?)\s+(section|guide|feed|docs|pixel|data|results|announcements)/i,
        /^(.+?)\s+(target|placement|tag|command|acct)/i,
      ];
      
      for (const pattern of patterns) {
        const match = taskName.match(pattern);
        if (match) {
          const extractedName = match[1].trim();
          // Try exact match
          if (projectMap.has(extractedName)) {
            matchedProjectID = projectMap.get(extractedName);
            break;
          }
          // Try normalized match
          const normalized = extractedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          if (projectMap.has(normalized)) {
            matchedProjectID = projectMap.get(normalized);
            break;
          }
        }
      }
      
      // Last resort: fuzzy match by substring
      if (!matchedProjectID) {
        for (const [projectName, projID] of projectMap.entries()) {
          if (taskName.toLowerCase().includes(projectName.toLowerCase()) ||
              projectName.toLowerCase().includes(taskName.toLowerCase())) {
            matchedProjectID = projID;
            Logger.log(`Fuzzy matched task: "${taskName}" → "${projectName}"`);
            break;
          }
        }
      }
    }
    
    // Update if found
    if (matchedProjectID) {
      tasksSheet.getRange(i + 1, 3).setValue(matchedProjectID); // Column C
      fixed++;
      Logger.log(`Fixed task: ${taskName} → ${matchedProjectID}`);
    } else {
      Logger.log(`Could not match task: ${taskName}`);
    }
  }
  
  return fixed;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getAccountMap() {
  /**
   * Returns Map of Account Name -> Account ID
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const accountsSheet = ss.getSheetByName('Accounts');
  if (!accountsSheet) return new Map();
  
  const accountMap = new Map();
  const accountData = accountsSheet.getDataRange().getValues();
  
  for (let i = 1; i < accountData.length; i++) {
    const accountID = accountData[i][0];
    const accountName = accountData[i][1];
    if (accountID && accountName) {
      accountMap.set(accountName, accountID);
    }
  }
  
  return accountMap;
}

function getProjectMap() {
  /**
   * Returns Map of Project Name -> Project ID
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projectsSheet = ss.getSheetByName('Projects');
  if (!projectsSheet) return new Map();
  
  const projectMap = new Map();
  const projectData = projectsSheet.getDataRange().getValues();
  
  for (let i = 1; i < projectData.length; i++) {
    const projectID = projectData[i][0];
    const projectName = projectData[i][1];
    if (projectID && projectName) {
      projectMap.set(projectName, projectID);
    }
  }
  
  return projectMap;
}

function showUnmatchedPrograms() {
  /**
   * Shows programs that don't have Account IDs
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const programsSheet = ss.getSheetByName('Programs');
  if (!programsSheet) return;
  
  const programData = programsSheet.getDataRange().getValues();
  const unmatched = [];
  
  for (let i = 1; i < programData.length; i++) {
    const accountID = programData[i][2];
    const companyName = programData[i][3];
    
    if (!accountID || accountID === '') {
      unmatched.push(companyName);
    }
  }
  
  Logger.log('Unmatched Programs:');
  unmatched.forEach(name => Logger.log(`  - ${name}`));
  
  return unmatched;
}

function showUnmatchedTasks() {
  /**
   * Shows tasks that don't have Project IDs
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tasksSheet = ss.getSheetByName('Tasks');
  if (!tasksSheet) return;
  
  const taskData = tasksSheet.getDataRange().getValues();
  const unmatched = [];
  
  for (let i = 1; i < taskData.length; i++) {
    const projectID = taskData[i][2];
    const taskName = taskData[i][1];
    
    if (!projectID || projectID === '') {
      unmatched.push(taskName);
    }
  }
  
  Logger.log('Unmatched Tasks:');
  unmatched.forEach(name => Logger.log(`  - ${name}`));
  
  return unmatched;
}

