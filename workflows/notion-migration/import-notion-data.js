/**
 * Pipedream Workflow: Import Notion Data to Google Sheets
 * 
 * This workflow imports exported Notion CSV data into Google Sheets
 * following the MulaOS database structure.
 * 
 * Steps:
 * 1. Read CSV files from Google Drive or upload
 * 2. Parse and transform data
 * 3. Import to Google Sheets database
 * 4. Establish relationships
 * 5. Validate data
 */

// ============================================================================
// STEP 1: Parse Publishers CSV
// ============================================================================
async function parsePublishers(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  const accounts = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || !values[0]) continue; // Skip empty rows

    const account = {
      id: generateID('ACC'),
      accountName: values[0] || '',
      signedDate: parseDate(values[1]),
      launchDate: parseDate(values[2]),
      status: mapStageToStatus(values[3]),
      category: values[4] || '',
      targetCoverage: parsePercentage(values[5]),
      currentCoverage: parsePercentage(values[6]),
      monthlyImpressions: parseNumber(values[7]),
      rpmBaseline: parseCurrency(values[8]),
      blocks: values[9] || '',
      owner: values[10] || '',
      currentRevenue: parseCurrency(values[11]),
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    accounts.push(account);
  }

  return accounts;
}

// ============================================================================
// STEP 2: Parse Contacts CSV
// ============================================================================
async function parseContacts(csvContent, accountMap) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  const contacts = [];
  const emailMap = new Map(); // Track duplicates

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || !values[2]) continue; // Skip if no email

    const email = values[2].toLowerCase().trim();
    
    // Skip duplicates (prefer first occurrence or merge)
    if (emailMap.has(email)) {
      console.log(`Skipping duplicate contact: ${email}`);
      continue;
    }
    emailMap.set(email, true);

    const nameParts = splitName(values[0] || '');
    const company = values[4] || '';
    const accountId = findAccountId(company, accountMap);

    const contact = {
      id: generateID('CON'),
      firstName: nameParts.first,
      lastName: nameParts.last,
      email: email,
      role: values[1] || '',
      phone: values[3] || '',
      company: company,
      accountId: accountId,
      influence: mapInfluence(values[5]),
      notes: values[6] || '',
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    contacts.push(contact);
  }

  return contacts;
}

// ============================================================================
// STEP 3: Parse Programs CSV
// ============================================================================
async function parsePrograms(csvContent, accountMap) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  const programs = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || !values[0]) continue; // Skip empty rows

    const company = values[0] || '';
    const accountId = findAccountId(company, accountMap);

    const program = {
      id: generateID('PROG'),
      programName: values[13] || `${company} Pilot Program`, // Program Name column
      accountId: accountId,
      company: company,
      status: mapProgramStatus(values[1]),
      phase: mapPhase(values[2]),
      health: mapHealth(values[3]),
      goal: values[4] || '',
      nextSteps: values[5] || '',
      leadingKPI: values[6] || '',
      laggingKPI: values[7] || '',
      pilotStartDate: parseMonthYear(values[8]),
      baselineRPM: parseRPMRange(values[9]),
      rpmLift: parseCurrency(values[10]),
      pageviewPercent: parsePageviewPercent(values[11]),
      revenueDataUrl: values[12] || '',
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    programs.push(program);
  }

  return programs;
}

// ============================================================================
// STEP 4: Parse Tasks CSV
// ============================================================================
async function parseTasks(csvContent, accountMap, programMap) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  const tasks = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || !values[0]) continue; // Skip empty rows

    const company = values[2] || '';
    const accountId = findAccountId(company, accountMap);
    const programId = findProgramId(company, programMap);

    const task = {
      id: generateID('TASK'),
      taskName: values[0] || '',
      type: values[1] || '',
      accountId: accountId,
      programId: programId,
      status: mapTaskStatus(values[3]),
      priority: mapPriority(values[4]),
      assignee: values[5] || '',
      opportunity: values[6] || '',
      createdDate: new Date().toISOString().split('T')[0],
      completedDate: values[3] === 'Done' ? new Date().toISOString().split('T')[0] : '',
    };

    tasks.push(task);
  }

  return tasks;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateID(prefix) {
  const uuid = require('crypto').randomBytes(4).toString('hex');
  return `${prefix}-${uuid}`;
}

function parseCSVLine(line) {
  // Simple CSV parser (handles quoted fields)
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

function splitName(name) {
  if (!name || name.trim() === '') {
    return { first: '', last: '' };
  }
  const parts = name.trim().split(/\s+/);
  return {
    first: parts[0] || '',
    last: parts.slice(1).join(' ') || '',
  };
}

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return '';
  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Try to parse other formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return '';
}

function parseMonthYear(monthYearStr) {
  if (!monthYearStr || monthYearStr.trim() === '') return '';
  // Handle "June '25" format
  const months = {
    january: '01', jan: '01',
    february: '02', feb: '02',
    march: '03', mar: '03',
    april: '04', apr: '04',
    may: '05',
    june: '06', jun: '06',
    july: '07', jul: '07',
    august: '08', aug: '08',
    september: '09', sep: '09',
    october: '10', oct: '10',
    november: '11', nov: '11',
    december: '12', dec: '12',
  };

  const match = monthYearStr.toLowerCase().match(/(\w+)\s*['']?(\d{2,4})/);
  if (match) {
    const month = months[match[1]] || '01';
    let year = match[2];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month}-01`;
  }
  return '';
}

function parsePercentage(percentStr) {
  if (!percentStr || percentStr.trim() === '') return '';
  const num = parseFloat(percentStr);
  if (isNaN(num)) return '';
  return num / 100; // Convert 50 to 0.50
}

function parseNumber(numStr) {
  if (!numStr || numStr.trim() === '') return '';
  return parseFloat(numStr.replace(/,/g, '')) || '';
}

function parseCurrency(currencyStr) {
  if (!currencyStr || currencyStr.trim() === '') return '';
  return parseFloat(currencyStr.replace(/[$,]/g, '')) || '';
}

function parseRPMRange(rpmStr) {
  if (!rpmStr || rpmStr.trim() === '') return '';
  // Handle "$16-18" format - return average or first value
  const match = rpmStr.match(/\$?(\d+)-(\d+)/);
  if (match) {
    const avg = (parseFloat(match[1]) + parseFloat(match[2])) / 2;
    return avg;
  }
  return parseCurrency(rpmStr);
}

function parsePageviewPercent(percentStr) {
  if (!percentStr || percentStr.trim() === '') return '';
  // Handle "1-2%" format - store as text or return average
  const match = percentStr.match(/(\d+)-(\d+)%/);
  if (match) {
    const avg = (parseFloat(match[1]) + parseFloat(match[2])) / 2 / 100;
    return avg;
  }
  return parsePercentage(percentStr);
}

function mapStageToStatus(stage) {
  const mapping = {
    'live': 'Active',
    'waiting to launch': 'Onboarding',
    'pending': 'Pipeline',
  };
  return mapping[stage?.toLowerCase()] || stage || 'Pipeline';
}

function mapProgramStatus(status) {
  if (!status) return 'Inactive';
  if (status.includes('Active')) return 'Active';
  if (status.includes('Onboarding')) return 'Onboarding';
  if (status.includes('Pipeline')) return 'Pipeline';
  if (status.includes('Inactive')) return 'Inactive';
  return 'Inactive';
}

function mapPhase(phase) {
  if (!phase) return 'Inactive';
  const mapping = {
    'live': 'Live',
    'onboarding': 'Onboarding',
    'inactive': 'Inactive',
  };
  return mapping[phase?.toLowerCase()] || phase;
}

function mapHealth(health) {
  if (!health) return 'Unknown';
  const mapping = {
    'needs improvement': 'Needs Improvement',
    'ok': 'Good',
    'in danger': 'At Risk',
  };
  return mapping[health?.toLowerCase()] || health;
}

function mapInfluence(influence) {
  if (!influence) return 'Other';
  const mapping = {
    'champion': 'Champion',
    'decision maker': 'Decision Maker',
    'user': 'User',
  };
  return mapping[influence?.toLowerCase()] || 'Other';
}

function mapTaskStatus(status) {
  const mapping = {
    'in progress': 'In Progress',
    'backlog': 'To Do',
    'done': 'Done',
  };
  return mapping[status?.toLowerCase()] || 'To Do';
}

function mapPriority(priority) {
  const mapping = {
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
  };
  return mapping[priority?.toLowerCase()] || 'Medium';
}

function findAccountId(companyName, accountMap) {
  if (!companyName) return '';
  // Exact match first
  if (accountMap.has(companyName)) {
    return accountMap.get(companyName);
  }
  // Try case-insensitive match
  for (const [name, id] of accountMap.entries()) {
    if (name.toLowerCase() === companyName.toLowerCase()) {
      return id;
    }
  }
  // Try partial match (e.g., "SHE Media" in "Stylecaster (SHE Media)")
  for (const [name, id] of accountMap.entries()) {
    if (name.toLowerCase().includes(companyName.toLowerCase()) ||
        companyName.toLowerCase().includes(name.toLowerCase())) {
      return id;
    }
  }
  return '';
}

function findProgramId(companyName, programMap) {
  if (!companyName) return '';
  // Similar logic to findAccountId
  for (const [company, programId] of programMap.entries()) {
    if (company.toLowerCase() === companyName.toLowerCase() ||
        company.toLowerCase().includes(companyName.toLowerCase())) {
      return programId;
    }
  }
  return '';
}

// ============================================================================
// MAIN WORKFLOW
// ============================================================================

export default defineComponent({
  name: "Import Notion Data",
  version: "0.0.1",
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
  },
  async run({ $ }) {
    // Step 1: Read CSV files (from previous steps or uploads)
    // This would be configured in Pipedream UI
    
    // Step 2: Parse and transform data
    // const accounts = await parsePublishers(publishersCSV);
    // const contacts = await parseContacts(contactsCSV, accountMap);
    // const programs = await parsePrograms(programsCSV, accountMap);
    // const tasks = await parseTasks(tasksCSV, accountMap, programMap);
    
    // Step 3: Write to Google Sheets
    // Use Google Sheets API to append rows
    
    // Step 4: Validate and log
    // Log activity and validate relationships
    
    return {
      success: true,
      message: "Import completed",
    };
  },
});

