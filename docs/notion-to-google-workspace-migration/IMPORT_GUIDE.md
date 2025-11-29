# Data Import Guide

## Quick Start: Import Your Notion Data

Now that your database is set up, you can import your Notion CSV exports.

## Prerequisites

- ✅ Google Sheets database created and verified
- ✅ All 7 sheets exist
- ✅ Custom functions loaded
- ✅ CSV files from Notion exports ready

## Import Options

### Option 1: Manual Import (Recommended for First Time)

**Best for**: Learning the system, small datasets, or when you want full control

**Steps**:
1. Open your CSV files
2. Review the data mapping (`COMPLETE_DATA_MAPPING.md`)
3. Copy/paste data row by row into Google Sheets
4. Use the custom functions to generate IDs
5. Manually link relationships

**Pros**: 
- Full control
- Learn the system
- Easy to fix mistakes

**Cons**: 
- Time-consuming
- Manual work

### Option 2: Pipedream Workflow (Recommended for Full Import)

**Best for**: Large datasets, automated imports, production use

**Steps**:
1. Set up Pipedream account
2. Connect Google Sheets
3. Use the import workflow template
4. Upload CSV files
5. Run workflow

**Pros**:
- Automated
- Handles relationships
- Error reporting
- Repeatable

**Cons**:
- Requires Pipedream setup
- More complex

### Option 3: Apps Script Import Script (Hybrid)

**Best for**: Quick imports without external tools

**Steps**:
1. Upload CSV files to Google Drive
2. Run Apps Script import function
3. Review results

**Pros**:
- No external tools
- Quick setup
- Good for one-time imports

**Cons**:
- Requires CSV upload to Drive
- Less flexible than Pipedream

## Import Order (CRITICAL)

**Always import in this order:**

1. **Accounts** (Companies) - No dependencies
2. **Contacts** - Needs Account IDs
3. **Programs** - Needs Account IDs  
4. **Projects** - Needs Account IDs
5. **Tasks** - Needs Project IDs

## Required CSV Files

Make sure you have these files:

- ✅ `Mula Partners (Companies) 21c03985e9be80d380eccab86015869f_all.csv`
- ✅ `Mula Partners (Contacts) 26a03985e9be8106ba09dde07a1e5f68_all.csv`
- ✅ `Mula Pilot Partners 21c03985e9be80d380eccab86015869f_all.csv`
- ✅ `Mula Ops Projects 26803985e9be813a988dd2ce4bf42e8d_all.csv`
- ✅ `Mula Ops Tasks 26803985e9be81a2b2b8e3a724d894eb_all.csv`

## Quick Manual Import Steps

### Step 1: Import Accounts

1. Open `Mula Partners (Companies)` CSV
2. Copy all data rows (skip header)
3. Paste into Accounts sheet starting at row 2
4. For each row:
   - Generate ID: In column A, use formula: `=generateAccountID(B2, C2)`
   - Fill Created Date: `=TODAY()`
   - Fill Last Updated: `=TODAY()`
5. Verify all dropdowns work (Type, Segment, Stage, etc.)

### Step 2: Import Contacts

1. Open `Mula Partners (Contacts)` CSV
2. Copy data rows
3. Paste into Contacts sheet starting at row 2
4. For each row:
   - Generate ID: `=generateContactID(C2)` (where C2 is email)
   - Match Account IDs: Use VLOOKUP or manual matching
   - Fill Created Date: `=TODAY()`
5. Remove duplicates by email

### Step 3: Import Programs

1. Open `Mula Pilot Partners` CSV
2. Copy data rows
3. Paste into Programs sheet starting at row 2
4. For each row:
   - Generate ID: `=generateProgramID(A2)` (where A2 is company name)
   - Match Account ID: Use VLOOKUP to match company name to Account ID
   - Fill dates
5. Verify relationships

### Step 4: Import Projects

1. Open `Mula Ops Projects` CSV
2. Copy data rows
3. Paste into Projects sheet starting at row 2
4. Generate IDs and match Account IDs

### Step 5: Import Tasks

1. Open `Mula Ops Tasks` CSV
2. Copy data rows
3. Paste into Tasks sheet starting at row 2
4. Generate IDs and match Project IDs

## Validation Checklist

After import, verify:

- [ ] All Accounts have valid IDs (URL format)
- [ ] All Contacts have valid email addresses
- [ ] All Contacts linked to Accounts (Account IDs column filled)
- [ ] All Programs linked to Accounts
- [ ] All Projects linked to Accounts (where applicable)
- [ ] All Tasks linked to Projects
- [ ] No orphaned records
- [ ] Dates formatted correctly (YYYY-MM-DD)
- [ ] Dropdown values valid
- [ ] Activity Log has entries for imports

## Common Issues

### Company Name Mismatches

**Problem**: Company names don't match between CSV files

**Solution**: 
- Create a mapping table in Lookups sheet
- Use VLOOKUP with fuzzy matching
- Manually fix unmatched records

### Missing Relationships

**Problem**: Contacts/Programs/Projects not linked to Accounts

**Solution**:
- Check company name spelling
- Use VLOOKUP to match names
- Manually link if needed

### Date Format Issues

**Problem**: Dates not parsing correctly

**Solution**:
- Use DATEVALUE() function
- Parse manually if needed
- Format as YYYY-MM-DD

## Next Steps

After successful import:

1. ✅ Review all data
2. ✅ Fix any relationship issues
3. ✅ Test custom functions
4. ✅ Train team members
5. ✅ Start using the system!

## Need Help?

- Review `COMPLETE_DATA_MAPPING.md` for field mappings
- Check `TROUBLESHOOTING.md` for common issues
- Review `DATABASE_DESIGN.md` for structure details

