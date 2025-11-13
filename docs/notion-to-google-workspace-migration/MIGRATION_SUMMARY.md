# Migration Summary: Your Notion Data Analysis

## Data Overview

Based on your exported CSV files, here's what we found:

### Entities Identified

1. **Publishers (3 records)** → Maps to **Accounts** sheet
   - On3, Stylecaster, Essence
   - Contains publisher/company information

2. **Contacts (65+ records)** → Maps to **Contacts** sheet
   - From two sources: Relational_Contacts.csv (5 detailed) + Relational_Contacts_from_Gmail.csv (60+)
   - Need to merge duplicates by email

3. **Programs (16 records)** → Maps to **Programs** sheet (NEW entity)
   - Pilot programs for each publisher/company
   - Contains status, health, KPIs, RPM data

4. **Tasks (7 records)** → Maps to **Tasks** sheet
   - Task management linked to companies

### Key Insights

1. **Company Name Variations**
   - "SHE Media" vs "Stylecaster (SHE Media)" - need fuzzy matching
   - "DefPen" vs "Defpen" - need normalization
   - Some companies in Programs don't exist in Publishers

2. **Data Completeness**
   - Publishers: Mostly complete
   - Contacts: Some missing names (email only)
   - Programs: Some missing dates/RPM data
   - Tasks: All have required fields

3. **Relationships**
   - Programs link to Companies (many-to-one)
   - Tasks link to Companies (many-to-one)
   - Contacts link to Companies (many-to-one)
   - Need to establish Account IDs for all relationships

## Recommended Database Structure

### Accounts Sheet (from Publishers)
- **3 accounts** to import
- Key fields: Publisher name, dates, stage, revenue, traffic

### Contacts Sheet (from both CSV files)
- **~60 unique contacts** (after merging duplicates)
- Key fields: Name, email, company, role, influence
- **Challenge**: Company name matching to Accounts

### Programs Sheet (NEW - from Relational_Programs)
- **16 programs** to import
- Key fields: Program name, company, status, health, KPIs, RPM data
- **Challenge**: Date parsing ("June '25" → "2025-06-01")

### Tasks Sheet (from Relational_Tasks)
- **7 tasks** to import
- Key fields: Task name, company, status, priority, owner
- **Challenge**: Company name matching

## Data Quality Issues Found

### 1. Missing Publishers
Some companies in Programs/Tasks don't exist in Publishers:
- Swimming World, Spotcovery, Defpen, Brit + Co, DeepAI, RevContent
- Paste Media, Wild Sky Media, The Midst, Green Planet, Twist.Win, IGN
- Sports Mockery, Gadget Review
- **Churned**: Grit Daily, Gadget Review, AllWomenstalk

**Solution**: Create Accounts for all 15 companies during import. Use Programs data to populate what's available.

### 2. Company Name Matching
Need to match:
- "SHE Media" ↔ "Stylecaster (SHE Media)"
- "DefPen" ↔ "Defpen"
- Various other variations

**Solution**: Create company name mapping table

### 3. Date Formats
- Publishers: YYYY-MM-DD (good)
- Programs: "June '25" format (needs parsing)

**Solution**: Parse month/year strings to dates

### 4. Duplicate Contacts
- Same email in both contact files
- Need to merge and prefer detailed version

**Solution**: Merge by email, prefer Relational_Contacts.csv

## Import Strategy

### Phase 1: Accounts
1. Import Publishers as Accounts
2. Create missing Accounts from Programs/Tasks companies
3. Build company name mapping table

### Phase 2: Contacts
1. Merge both contact files
2. Remove duplicates by email
3. Match companies to Account IDs
4. Import to Contacts sheet

### Phase 3: Programs
1. Match companies to Account IDs
2. Parse dates and RPM data
3. Import to Programs sheet

### Phase 4: Tasks
1. Match companies to Account IDs
2. Optionally match to Programs
3. Import to Tasks sheet

## Next Steps

1. **Review Data Mapping** (`DATA_MAPPING.md`)
   - Confirm all field mappings
   - Verify transformation rules

2. **Create Company Mapping Table**
   - Map all company name variations
   - Handle "SHE Media" ↔ "Stylecaster" relationship

3. **Build Import Workflow**
   - Use provided `import-notion-data.js` as starting point
   - Test with sample data first

4. **Validate & Import**
   - Import sample records
   - Validate relationships
   - Full import

## Questions to Resolve

1. **Company Relationships**
   - Should "Stylecaster" and "SHE Media" be separate accounts or linked?
   - How to handle parent/subsidiary relationships?

2. **Missing Data**
   - Create placeholder Accounts for companies not in Publishers?
   - How to handle missing dates/RPM data?

3. **Programs vs Accounts**
   - Some companies have multiple programs - is this correct?
   - Should Programs be a separate entity or part of Accounts?

4. **Tasks**
   - Should Tasks link to Programs or just Accounts?
   - How to handle tasks for companies without programs?

## Estimated Import Stats

- **Accounts**: 18 (3 from Publishers + 15 from Programs/Tasks, including Churned)
- **Contacts**: ~60 unique contacts (after merging duplicates)
- **Programs**: 19 programs (from complete _all.csv, includes Churned)
- **Tasks**: 7 tasks
- **Total Records**: ~104 records

## Timeline Estimate

- **Data Analysis**: ✅ Complete
- **Mapping & Design**: ✅ Complete
- **Import Script Development**: 2-4 hours
- **Testing**: 1-2 hours
- **Full Import**: 30 minutes
- **Validation & Fixes**: 1-2 hours

**Total**: ~5-8 hours of development + testing

