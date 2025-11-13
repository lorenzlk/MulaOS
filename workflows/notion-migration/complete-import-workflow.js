/**
 * Pipedream Workflow: Complete Notion Data Import
 * 
 * This workflow imports all Notion CSV exports into Google Sheets
 * following the MulaOS database structure.
 * 
 * Workflow Steps:
 * 1. Import Accounts (Companies)
 * 2. Import Contacts (with deduplication)
 * 3. Import Programs
 * 4. Import Projects
 * 5. Import Tasks
 * 6. Establish relationships
 * 7. Validate and report
 */

export default defineComponent({
  name: "Import Notion Data to Google Sheets",
  version: "0.1.0",
  props: {
    googleSheets: {
      type: "app",
      app: "google_sheets",
    },
    spreadsheetId: {
      type: "string",
      label: "Google Sheets Database ID",
      description: "The ID of the MulaOS_Database spreadsheet",
    },
    companiesCSV: {
      type: "string",
      label: "Companies CSV Content",
      description: "Content of Mula Partners (Companies) CSV file",
    },
    contactsCSV: {
      type: "string",
      label: "Contacts CSV Content",
      description: "Content of Mula Partners (Contacts) CSV file",
    },
    programsCSV: {
      type: "string",
      label: "Programs CSV Content",
      description: "Content of Mula Pilot Partners CSV file",
    },
    projectsCSV: {
      type: "string",
      label: "Projects CSV Content",
      description: "Content of Mula Ops Projects CSV file",
    },
    tasksCSV: {
      type: "string",
      label: "Tasks CSV Content",
      description: "Content of Mula Ops Tasks CSV file",
    },
  },
  async run({ $ }) {
    const results = {
      accounts: { imported: 0, errors: [] },
      contacts: { imported: 0, errors: [] },
      programs: { imported: 0, errors: [] },
      projects: { imported: 0, errors: [] },
      tasks: { imported: 0, errors: [] },
    };

    // Step 1: Import Accounts
    try {
      const accounts = await parseCompanies(this.companiesCSV);
      const accountMap = new Map(); // Name -> ID mapping
      
      for (const account of accounts) {
        try {
          await importAccount(account, this.googleSheets, this.spreadsheetId);
          accountMap.set(account.accountName, account.id);
          results.accounts.imported++;
        } catch (error) {
          results.accounts.errors.push({ account: account.accountName, error: error.message });
        }
      }
      
      // Step 2: Import Contacts
      const contacts = await parseContacts(this.contactsCSV, accountMap);
      for (const contact of contacts) {
        try {
          await importContact(contact, this.googleSheets, this.spreadsheetId);
          results.contacts.imported++;
        } catch (error) {
          results.contacts.errors.push({ contact: contact.email, error: error.message });
        }
      }
      
      // Step 3: Import Programs
      const programs = await parsePrograms(this.programsCSV, accountMap);
      for (const program of programs) {
        try {
          await importProgram(program, this.googleSheets, this.spreadsheetId);
          results.programs.imported++;
        } catch (error) {
          results.programs.errors.push({ program: program.programName, error: error.message });
        }
      }
      
      // Step 4: Import Projects
      const projects = await parseProjects(this.projectsCSV, accountMap);
      const projectMap = new Map(); // Name -> ID mapping
      
      for (const project of projects) {
        try {
          const projectId = await importProject(project, this.googleSheets, this.spreadsheetId);
          projectMap.set(project.projectName, projectId);
          results.projects.imported++;
        } catch (error) {
          results.projects.errors.push({ project: project.projectName, error: error.message });
        }
      }
      
      // Step 5: Import Tasks
      const tasks = await parseTasks(this.tasksCSV, projectMap);
      for (const task of tasks) {
        try {
          await importTask(task, this.googleSheets, this.spreadsheetId);
          results.tasks.imported++;
        } catch (error) {
          results.tasks.errors.push({ task: task.taskName, error: error.message });
        }
      }
      
      // Step 6: Update relationships
      await updateRelationships(this.googleSheets, this.spreadsheetId, accountMap, projectMap);
      
    } catch (error) {
      $.export("error", error);
      throw error;
    }

    return {
      success: true,
      results: results,
      summary: {
        totalImported: 
          results.accounts.imported +
          results.contacts.imported +
          results.programs.imported +
          results.projects.imported +
          results.tasks.imported,
        totalErrors: 
          results.accounts.errors.length +
          results.contacts.errors.length +
          results.programs.errors.length +
          results.projects.errors.length +
          results.tasks.errors.length,
      },
    };
  },
});

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

async function parseCompanies(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const accounts = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values[0]) continue; // Skip empty rows
    
    const accountName = values[0] || '';
    // Extract website domain from ID or use a field if available
    // For now, we'll need to extract it from the account name or a separate field
    // You may need to add a Website Domain column to your CSV or map it manually
    const websiteDomain = extractWebsiteDomain(values); // Helper function to extract domain
    
    const account = {
      id: generateAccountID(accountName, websiteDomain),
      accountName: accountName,
      websiteDomain: websiteDomain, // Website Domain column
      type: values[11] || 'Publisher', // Type column
      segment: values[9] || 'Tier 3', // Segment column
      stage: values[10] || 'GTM', // Stage column
      widgets: values[12] || '', // Widgets column
      platform: mapPlatform(values[7]), // Platform column - map to Desktop/Mobile
      kvpEnabled: values[1] || 'NA', // KVP Enabled column
      goalRPM: parseCurrency(values[2]), // Goal RPM/RPS
      launchDate: parseNotionDate(values[4]), // Launch Date
      lastUpdated: parseNotionDate(values[3]), // Last Update
      roadmapURL: extractNotionURL(values[5]), // Mula Product Roadmap
      relatedProjects: extractProjectNames(values[8]), // Related Projects
      createdDate: new Date().toISOString().split('T')[0],
    };
    
    accounts.push(account);
  }
  
  return accounts;
}

async function parseContacts(csvContent, accountMap) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const contacts = [];
  const emailMap = new Map(); // For deduplication
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values[2]) continue; // Skip if no email
    
    const email = values[2].toLowerCase().trim();
    
    // Deduplicate by email
    if (emailMap.has(email)) {
      // Merge with existing contact
      const existing = emailMap.get(email);
      existing.relatedCompanies = mergeArrays(existing.relatedCompanies, extractCompanyNames(values[3]));
      continue;
    }
    
    emailMap.set(email, true);
    
    const companyNames = extractCompanyNames(values[3]); // Related Mula Partner
    const accountIDs = companyNames.map(name => accountMap.get(name)).filter(id => id);
    
    const contact = {
      id: generateContactID(email),
      firstName: values[0] || '',
      lastName: values[1] || '',
      email: email,
      title: values[6] || '', // Title column
      phone: '', // Not in this CSV
      accountIDs: accountIDs.join(','),
      relatedCompanies: companyNames.join(','),
      status: 'Active',
      lastUpdate: parseNotionDate(values[3]), // Last Update
      notes: values[4] || '', // Notes column
      createdDate: new Date().toISOString().split('T')[0],
    };
    
    contacts.push(contact);
  }
  
  return contacts;
}

async function parsePrograms(csvContent, accountMap) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const programs = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values[0]) continue; // Skip empty rows
    
    const companyName = values[0]; // Name column
    const accountID = accountMap.get(companyName) || '';
    
    const program = {
      id: generateProgramID(companyName),
      programName: `${companyName} Pilot Program`,
      accountID: accountID,
      company: companyName,
      status: mapProgramStatus(values[1]), // Status column
      phase: mapPhase(values[2]), // Phase column
      widgets: values[3] || '', // Widgets column
      platform: mapPlatform(values[4]), // Platform column - map to Desktop/Mobile
      kvp: values[5] || 'NA', // KVP column
      health: mapHealth(values[6]), // Health column
      goal: values[7] || '', // Goal column
      nextSteps: values[8] || '', // Next Steps column
      leadingKPI: values[9] || '', // Key KPI (Leading)
      laggingKPI: values[10] || '', // Key KPI (Lagging)
      pilotStartDate: parseMonthYear(values[11]), // Pilot Start
      baselineRPM: parseRPMRange(values[12]), // Baseline RPM
      rpmLift: parseCurrency(values[13]), // Incremental RPM Lift
      pageviewPercent: parsePageviewPercent(values[14]), // Mula % Pageviews
      revenueDataURL: values[15] || '', // Revenue Data
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    
    programs.push(program);
  }
  
  return programs;
}

async function parseProjects(csvContent, accountMap) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const projects = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values[0]) continue; // Skip empty rows
    
    const projectName = values[0]; // Project name
    const accountID = extractAccountIDFromProjectName(projectName, accountMap);
    
    const project = {
      id: generateProjectID(projectName),
      projectName: projectName,
      summary: values[7] || '', // Summary column
      status: mapProjectStatus(values[1]), // Status column
      owner: values[2] || '', // Owner column
      priority: mapPriority(values[3]), // Priority column
      completion: parseCompletion(values[4]), // Completion column
      dates: parseNotionDate(values[5]), // Dates column
      lastUpdated: parseNotionDate(values[6]), // Last Updated
      relatedAccountIDs: accountID ? accountID : '',
      createdDate: new Date().toISOString().split('T')[0],
      notes: '',
    };
    
    projects.push(project);
  }
  
  return projects;
}

async function parseTasks(csvContent, projectMap) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const tasks = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values[0]) continue; // Skip empty rows
    
    const projectName = extractProjectNameFromNotionLink(values[9]); // Project column
    const projectID = projectMap.get(projectName) || '';
    const taskName = values[0] || ''; // Task name
    
    const task = {
      id: generateTaskID(taskName, projectID),
      taskName: taskName,
      projectID: projectID,
      assignee: values[1] || '', // Assignee column
      status: mapTaskStatus(values[10]), // Status column
      priority: mapPriority(values[8]), // Priority column
      dueDate: parseNotionDate(values[4]), // Due column
      completedDate: parseNotionDate(values[2]), // Completed on
      parentTaskID: '', // Will be resolved in second pass
      subTasks: '', // Will be resolved in second pass
      place: values[6] || '', // Place column
      tags: values[11] || '', // Tags column
      lastUpdated: parseNotionDate(values[5]), // Last Updated
      createdDate: new Date().toISOString().split('T')[0],
      notes: '',
    };
    
    tasks.push(task);
  }
  
  return tasks;
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

async function importAccount(account, googleSheets, spreadsheetId) {
  const values = [
    account.id,
    account.accountName,
    account.websiteDomain || '', // Website Domain column
    account.type,
    account.segment,
    account.stage,
    account.widgets,
    account.platform,
    account.kvpEnabled,
    account.goalRPM || '',
    account.launchDate || '',
    account.lastUpdated || '',
    account.roadmapURL || '',
    account.relatedProjects || '',
    account.createdDate,
    '',
  ];
  
  await googleSheets.appendRow({
    spreadsheetId: spreadsheetId,
    range: 'Accounts!A:P', // Updated to include Website Domain column
    values: [values],
  });
  
  return account.id;
}

async function importContact(contact, googleSheets, spreadsheetId) {
  const values = [
    contact.id,
    contact.firstName,
    contact.lastName,
    contact.email,
    contact.title,
    contact.phone,
    contact.accountIDs,
    contact.relatedCompanies,
    contact.status,
    contact.lastUpdate || '',
    contact.createdDate,
    contact.notes,
  ];
  
  await googleSheets.appendRow({
    spreadsheetId: spreadsheetId,
    range: 'Contacts!A:L',
    values: [values],
  });
  
  return contact.id;
}

async function importProgram(program, googleSheets, spreadsheetId) {
  const values = [
    program.id,
    program.programName,
    program.accountID,
    program.company,
    program.status,
    program.phase,
    program.widgets,
    program.platform,
    program.kvp,
    program.health,
    program.goal,
    program.nextSteps,
    program.leadingKPI,
    program.laggingKPI,
    program.pilotStartDate || '',
    program.baselineRPM || '',
    program.rpmLift || '',
    program.pageviewPercent || '',
    program.revenueDataURL || '',
    program.createdDate,
    program.lastUpdated,
    '',
  ];
  
  await googleSheets.appendRow({
    spreadsheetId: spreadsheetId,
    range: 'Programs!A:V',
    values: [values],
  });
  
  return program.id;
}

async function importProject(project, googleSheets, spreadsheetId) {
  const values = [
    project.id,
    project.projectName,
    project.summary,
    project.status,
    project.owner,
    project.priority,
    project.completion || '',
    project.dates || '',
    project.lastUpdated || '',
    project.relatedAccountIDs,
    project.createdDate,
    project.notes,
  ];
  
  await googleSheets.appendRow({
    spreadsheetId: spreadsheetId,
    range: 'Projects!A:L',
    values: [values],
  });
  
  return project.id;
}

async function importTask(task, googleSheets, spreadsheetId) {
  const values = [
    task.id,
    task.taskName,
    task.projectID,
    task.assignee,
    task.status,
    task.priority || '',
    task.dueDate || '',
    task.completedDate || '',
    task.parentTaskID,
    task.subTasks,
    task.place,
    task.tags,
    task.lastUpdated || '',
    task.createdDate,
    task.notes,
  ];
  
  await googleSheets.appendRow({
    spreadsheetId: spreadsheetId,
    range: 'Tasks!A:O',
    values: [values],
  });
  
  return task.id;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateAccountID(accountName) {
  /**
   * Generates URL-based ID for account
   * Format: https://mula.com/pubs/{normalized-name}
   */
  if (!accountName) return '';
  const normalized = accountName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `https://mula.com/pubs/${normalized}`;
}

function generateContactID(email) {
  /**
   * Generates URL-based ID for contact
   * Format: https://mula.com/contacts/{encoded-email}
   */
  if (!email) return '';
  const encodedEmail = encodeURIComponent(email);
  return `https://mula.com/contacts/${encodedEmail}`;
}

function generateProgramID(companyName) {
  /**
   * Generates URL-based ID for program
   * Format: https://mula.com/programs/{normalized-name}-pilot
   */
  if (!companyName) return '';
  const normalized = companyName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `https://mula.com/programs/${normalized}-pilot`;
}

function generateProjectID(projectName) {
  /**
   * Generates URL-based ID for project
   * Format: https://mula.com/projects/{normalized-name}
   */
  if (!projectName) return '';
  const normalized = projectName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `https://mula.com/projects/${normalized}`;
}

function generateTaskID(taskName, projectID) {
  /**
   * Generates URL-based ID for task
   * Format: https://mula.com/tasks/{project-slug}/{normalized-task-name}
   */
  if (!taskName) return '';
  const normalized = taskName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (projectID) {
    const projectSlug = projectID.split('/').pop() || 'general';
    return `https://mula.com/tasks/${projectSlug}/${normalized}`;
  }
  return `https://mula.com/tasks/${normalized}`;
}

// Legacy function for backward compatibility
function generateID(prefix) {
  const uuid = require('crypto').randomBytes(4).toString('hex');
  return `${prefix}-${uuid}`;
}

function parseCSVLine(line) {
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

function parseNotionDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return '';
  
  // Handle "September 18, 2025 2:10 PM"
  const dateMatch = dateStr.match(/(\w+)\s+(\d+),\s+(\d{4})/);
  if (dateMatch) {
    const months = {
      january: '01', jan: '01', february: '02', feb: '02',
      march: '03', mar: '03', april: '04', apr: '04',
      may: '05', june: '06', jun: '06', july: '07', jul: '07',
      august: '08', aug: '08', september: '09', sep: '09',
      october: '10', oct: '10', november: '11', nov: '11',
      december: '12', dec: '12',
    };
    const month = months[dateMatch[1].toLowerCase()] || '01';
    const day = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // Handle "July 28, 2025"
  // Similar parsing...
  
  return '';
}

function parseMonthYear(monthYearStr) {
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
  if (!currencyStr || currencyStr.trim() === '') return '';
  return parseFloat(currencyStr.replace(/[$,]/g, '')) || '';
}

function parseRPMRange(rpmStr) {
  if (!rpmStr || rpmStr.trim() === '') return '';
  const match = rpmStr.match(/\$?(\d+)-(\d+)/);
  if (match) {
    return (parseFloat(match[1]) + parseFloat(match[2])) / 2;
  }
  return parseCurrency(rpmStr);
}

function parsePageviewPercent(percentStr) {
  if (!percentStr || percentStr.trim() === '') return '';
  const match = percentStr.match(/(\d+)-(\d+)%/);
  if (match) {
    return (parseFloat(match[1]) + parseFloat(match[2])) / 2 / 100;
  }
  return parseFloat(percentStr.replace('%', '')) / 100 || '';
}

function parseCompletion(completionStr) {
  if (!completionStr || completionStr.trim() === '') return '';
  return parseFloat(completionStr) || '';
}

function extractNotionURL(linkStr) {
  if (!linkStr) return '';
  const match = linkStr.match(/https:\/\/[^\s)]+/);
  return match ? match[0] : '';
}

function extractCompanyNames(partnerStr) {
  if (!partnerStr) return [];
  // Extract company names from "Company (https://...)" format
  const matches = partnerStr.match(/([^(]+)\s*\(https:/g);
  return matches ? matches.map(m => m.replace(/\s*\(https:$/, '').trim()) : [];
}

function extractProjectNames(projectsStr) {
  if (!projectsStr) return [];
  // Similar extraction logic
  return [];
}

function extractProjectNameFromNotionLink(linkStr) {
  if (!linkStr) return '';
  const match = linkStr.match(/([^(]+)\s*\(https:/);
  return match ? match[1].trim() : '';
}

function extractAccountIDFromProjectName(projectName, accountMap) {
  // Extract company name from project name
  // "On3 Launch" → "On3"
  // "StyleCaster Launch" → "Stylecaster"
  const nameMatch = projectName.match(/(.+?)\s+(Launch|Expansion|Integration)/i);
  if (nameMatch) {
    const companyName = normalizeCompanyName(nameMatch[1]);
    return accountMap.get(companyName) || '';
  }
  return '';
}

function normalizeCompanyName(name) {
  // Handle variations
  const normalizations = {
    'StyleCaster': 'Stylecaster',
    'Brit+Co': 'Brit + Co',
    'DefPen': 'Defpen',
  };
  return normalizations[name] || name;
}

function mergeArrays(arr1, arr2) {
  const combined = [...(arr1 || []), ...(arr2 || [])];
  return [...new Set(combined)];
}

// Mapping functions
function mapProgramStatus(status) {
  const mapping = {
    'Active – Organic Launch': 'Active',
    'Paid Pilot': 'Active',
    'Onboarding': 'Onboarding',
    'Late‑Stage Pipeline': 'Pipeline',
    'Churned': 'Churned',
    'Inactive': 'Inactive',
  };
  return mapping[status] || status || 'Inactive';
}

function mapPhase(phase) {
  const mapping = {
    'Live': 'Live',
    'Onboarding': 'Onboarding',
    'Inactive': 'Inactive',
  };
  return mapping[phase] || phase || 'Inactive';
}

function mapHealth(health) {
  const mapping = {
    'Needs Improvement': 'Needs Improvement',
    'Ok': 'Good',
    'In Danger': 'At Risk',
  };
  return mapping[health] || health || 'Unknown';
}

function mapProjectStatus(status) {
  const mapping = {
    'Done': 'Done',
    'In Progress': 'In Progress',
    'Planning': 'Planning',
    'Backlog': 'Backlog',
  };
  return mapping[status] || status || 'Planning';
}

function mapTaskStatus(status) {
  const mapping = {
    'Done': 'Done',
    'In Progress': 'In Progress',
    'Not Started': 'Not Started',
  };
  return mapping[status] || status || 'Not Started';
}

function mapPriority(priority) {
  const mapping = {
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Low',
  };
  return mapping[priority] || priority || 'Medium';
}

function mapPlatform(platform) {
  /**
   * Maps Platform values from Notion to Google Sheets format
   * Converts "Mobile, Web" to "Desktop, Mobile" and "Web" to "Desktop"
   */
  if (!platform || platform.trim() === '') return '';
  
  const platformLower = platform.toLowerCase().trim();
  
  // Handle "Mobile, Web" or "Web, Mobile" → "Desktop, Mobile"
  if (platformLower.includes('mobile') && platformLower.includes('web')) {
    return 'Desktop, Mobile';
  }
  
  // Handle "Web" → "Desktop"
  if (platformLower === 'web') {
    return 'Desktop';
  }
  
  // Handle "Mobile" → "Mobile"
  if (platformLower === 'mobile') {
    return 'Mobile';
  }
  
  // Handle "Desktop, Mobile" or "Mobile, Desktop" → keep as is
  if (platformLower.includes('desktop') && platformLower.includes('mobile')) {
    return 'Desktop, Mobile';
  }
  
  // Default: return as-is (should be Desktop or Mobile)
  return platform;
}

async function updateRelationships(googleSheets, spreadsheetId, accountMap, projectMap) {
  // Update Accounts.Related Projects with Project IDs
  // Update any other relationships that need post-processing
  // This is a placeholder - implement based on specific needs
}

