/**
 * Google Apps Script: Fix Remaining Issues
 * 
 * Quick fixes for remaining unmatched items
 */

function fixRemainingTask() {
  /**
   * Fixes the one remaining unmatched task
   */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tasksSheet = ss.getSheetByName('Tasks');
  const projectsSheet = ss.getSheetByName('Projects');
  
  if (!tasksSheet || !projectsSheet) {
    throw new Error('Tasks or Projects sheet not found');
  }
  
  // Find the project ID for "Validate RevContent Test results"
  const projectData = projectsSheet.getDataRange().getValues();
  let validateProjectID = null;
  let validateProjectName = null;
  
  for (let i = 1; i < projectData.length; i++) {
    const projectName = projectData[i][1]; // Column B
    if (projectName && projectName.toLowerCase().includes('validate revcontent')) {
      validateProjectID = projectData[i][0]; // Column A (ID)
      validateProjectName = projectName;
      Logger.log(`Found project: ${projectName} → ${validateProjectID}`);
      break;
    }
  }
  
  if (!validateProjectID) {
    Logger.log('Could not find Validate RevContent project');
    Logger.log('Available projects:');
    for (let i = 1; i < projectData.length; i++) {
      const projectName = projectData[i][1];
      if (projectName) {
        Logger.log(`  - ${projectName}`);
      }
    }
    return 0;
  }
  
  // Find and fix the task
  const taskData = tasksSheet.getDataRange().getValues();
  let fixed = 0;
  let unmatchedTasks = [];
  
  Logger.log(`\nSearching for tasks matching "Validate RevContent"...`);
  
  for (let i = 1; i < taskData.length; i++) {
    const taskName = taskData[i][1]; // Column B
    const projectID = taskData[i][2]; // Column C
    
    // Log all tasks for debugging
    if (taskName && taskName.toLowerCase().includes('validate')) {
      Logger.log(`Found task: "${taskName}" - Project ID: ${projectID || '(empty)'}`);
    }
    
    // Skip if already has Project ID
    if (projectID && projectID !== '') {
      if (taskName && taskName.toLowerCase().includes('validate revcontent')) {
        Logger.log(`Task already has Project ID: "${taskName}" → ${projectID}`);
      }
      continue;
    }
    
    // Check if this is the Validate RevContent task (handle various formats)
    if (taskName && (
        taskName.toLowerCase().includes('validate revcontent') ||
        taskName.toLowerCase().includes('validate revcontent test results')
      )) {
      tasksSheet.getRange(i + 1, 3).setValue(validateProjectID);
      fixed++;
      Logger.log(`✓ Fixed task: "${taskName}" → ${validateProjectName} (${validateProjectID})`);
    } else if (taskName && taskName.toLowerCase().includes('validate')) {
      unmatchedTasks.push(taskName);
    }
  }
  
  if (unmatchedTasks.length > 0) {
    Logger.log(`\nUnmatched tasks containing "validate":`);
    unmatchedTasks.forEach(name => Logger.log(`  - "${name}"`));
  }
  
  Logger.log(`\nFixed ${fixed} remaining task(s)`);
  return fixed;
}

function checkProgramStatus() {
  /**
   * Checks which programs have Account IDs and which don't
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
    const accountID = accountData[i][0];
    const accountName = accountData[i][1];
    if (accountID && accountName) {
      accountMap.set(accountName, accountID);
      Logger.log(`Account: ${accountName} → ${accountID}`);
    }
  }
  
  Logger.log('\n=== Program Status ===\n');
  
  const programData = programsSheet.getDataRange().getValues();
  const withAccountID = [];
  const withoutAccountID = [];
  
  for (let i = 1; i < programData.length; i++) {
    const accountID = programData[i][2];
    const companyName = programData[i][3];
    const programName = programData[i][1];
    
    if (accountID && accountID !== '') {
      withAccountID.push({ program: programName, company: companyName, accountID: accountID });
    } else {
      withoutAccountID.push({ program: programName, company: companyName });
    }
  }
  
  Logger.log(`Programs WITH Account ID: ${withAccountID.length}`);
  withAccountID.forEach(p => Logger.log(`  ✓ ${p.program} (${p.company}) → ${p.accountID}`));
  
  Logger.log(`\nPrograms WITHOUT Account ID: ${withoutAccountID.length}`);
  withoutAccountID.forEach(p => {
    Logger.log(`  ✗ ${p.program} (${p.company})`);
    // Try to find match
    let found = false;
    for (const [accountName, accountID] of accountMap.entries()) {
      if (accountName.toLowerCase().includes(p.company.toLowerCase()) ||
          p.company.toLowerCase().includes(accountName.toLowerCase())) {
        Logger.log(`    → Possible match: ${accountName} (${accountID})`);
        found = true;
        break;
      }
    }
    if (!found) {
      Logger.log(`    → No match found`);
    }
  });
  
  return {
    withAccountID: withAccountID.length,
    withoutAccountID: withoutAccountID.length,
    details: { with: withAccountID, without: withoutAccountID }
  };
}

function fixRemainingIssues() {
  /**
   * Fixes all remaining issues
   */
  Logger.log('=== Fixing Remaining Issues ===\n');
  
  // Fix remaining task
  Logger.log('Fixing remaining task...');
  const tasksFixed = fixRemainingTask();
  Logger.log(`Fixed ${tasksFixed} task(s)\n`);
  
  // Check program status
  Logger.log('Checking program status...');
  const programStatus = checkProgramStatus();
  Logger.log(`\nPrograms with Account ID: ${programStatus.withAccountID}`);
  Logger.log(`Programs without Account ID: ${programStatus.withoutAccountID}`);
  
  return {
    tasksFixed: tasksFixed,
    programStatus: programStatus
  };
}


