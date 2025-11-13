# Complete Data Analysis: All Notion Exports

## Data Sources Summary

### Files Analyzed
1. `publishers.csv` - 3 publishers (On3, Stylecaster, Essence)
2. `Relational_Contacts.csv` - 5 detailed contacts
3. `Relational_Contacts_from_Gmail.csv` - 60+ contacts from Gmail
4. `Relational_Programs.csv` - 16 programs (older format)
5. `Mula Pilot Partners 21c03985e9be80d380eccab86015869f_all.csv` - 19 programs (complete, includes Churned)
6. `Relational_Tasks.csv` - 7 tasks

## Key Findings

### 1. Programs Data Structure

**Two versions of Programs data:**
- **Relational_Programs.csv**: Has "Company" and "Program Name" columns
- **Mula Pilot Partners _all.csv**: Has "Name" (company) and additional fields (Widgets, Platform, Ads)

**Additional companies in _all version:**
- Grit Daily (Churned)
- Gadget Review (Churned)
- AllWomenstalk (Churned)

**New fields in _all version:**
- Widgets: Smart-Scroll, Top-Shelf, or combinations
- Platform: Desktop, Mobile, or "Desktop, Mobile"
- Ads: Yes, No, NA

### 2. Company/Publisher Mapping

**Companies in Programs but NOT in Publishers:**
1. Swimming World
2. Spotcovery
3. Defpen
4. Brit + Co
5. DeepAI
6. RevContent
7. Paste Media
8. Wild Sky Media
9. The Midst
10. Green Planet
11. Twist.Win
12. IGN
13. Grit Daily (Churned)
14. Gadget Review (Churned)
15. AllWomenstalk (Churned)

**Companies in Publishers:**
1. On3 ✅
2. Stylecaster ✅
3. Essence ✅

**Total unique companies: 18** (3 in Publishers + 15 in Programs)

### 3. Status Mapping

**Program Statuses found:**
- Active – Organic Launch → Active
- Paid Pilot → Active
- Onboarding → Onboarding
- Late‑Stage Pipeline → Pipeline
- Churned → Churned
- Inactive → Inactive

### 4. Data Completeness

**Programs with complete data:**
- On3: Full data
- Brit + Co: Full data including RPM, pageview %
- Swimming World: Most fields filled
- Spotcovery: Most fields filled
- Defpen: Most fields filled

**Programs with minimal data:**
- Paste Media: Only Name and Status
- Wild Sky Media: Only Name and Status
- Most Pipeline/Inactive: Minimal data

### 5. Widget Types

**Widget combinations found:**
- Smart-Scroll (most common)
- Top-Shelf
- Smart-Scroll, Top-Shelf (Brit + Co)

### 6. Platform Distribution

**Platform combinations:**
- Desktop, Mobile (most common)
- Mobile only (Brit + Co)
- Not specified (many Pipeline/Inactive)

### 7. Ads Status

**Ads values:**
- Yes: Brit + Co, The Midst
- No: Most active programs
- NA: DeepAI
- Empty: Many Pipeline/Inactive

## Recommended Import Strategy

### Phase 1: Accounts Creation

**Create Accounts for all companies:**
1. Import 3 from Publishers.csv
2. Create 15 additional from Programs data
3. Use company name from Programs "Name" field

**Account fields to populate:**
- From Publishers: Signed Date, Launch Date, Stage, Category, Coverage %, Traffic, RPM, Revenue
- From Programs: Widgets, Platform, Ads (if not in Publishers)

### Phase 2: Programs Import

**Use `Mula Pilot Partners _all.csv` as primary source** (most complete)

**For each program:**
1. Match Company name to Account ID
2. Generate Program Name: "{Company} Pilot Program"
3. Map all fields including Widgets, Platform, Ads
4. Parse dates and RPM data
5. Handle Churned status

### Phase 3: Contacts Import

**Merge both contact files:**
1. Prefer Relational_Contacts.csv (more detailed)
2. Merge by email
3. Match Company to Account ID
4. Handle company name variations

### Phase 4: Tasks Import

**Import tasks:**
1. Match Company to Account ID
2. Optionally match to Program (if company has program)
3. Map status and priority

## Data Quality Issues

### 1. Company Name Variations

**Variations found:**
- "SHE Media" vs "Stylecaster (SHE Media)"
- "DefPen" vs "Defpen"
- "Grit Daily" vs "GritDaily" (potential)

**Solution**: Create company name mapping table

### 2. Missing Account Data

**15 companies have no Publisher data:**
- No signed dates
- No launch dates
- No traffic/revenue data
- No category

**Solution**: 
- Create Accounts with minimal data
- Mark as "Data Pending" or leave fields empty
- Can be filled in later

### 3. Churned Programs

**3 Churned companies:**
- Grit Daily
- Gadget Review
- AllWomenstalk

**Decision needed**: 
- Should Churned companies be Accounts with Status="Churned"?
- Or separate "Churned Accounts" sheet?
- Or just mark Programs as Churned?

### 4. Date Parsing

**Date formats to handle:**
- "June '25" → "2025-06-01"
- "July '25" → "2025-07-01"
- Empty dates → Leave blank

### 5. RPM Data Parsing

**RPM formats:**
- "$16-18" → Use average: 17.00
- "$1.00" → 1.00
- Empty → Leave blank

## Import Statistics

### Records to Import

- **Accounts**: 18 (3 from Publishers + 15 from Programs)
- **Programs**: 19 (from _all.csv, includes Churned)
- **Contacts**: ~60 unique (after merging duplicates)
- **Tasks**: 7

### Relationships

- **Account → Programs**: 1-to-many (some accounts have 1 program)
- **Account → Contacts**: 1-to-many
- **Account → Tasks**: 1-to-many
- **Program → Tasks**: 1-to-many (optional, via Account)

## Next Steps

1. **Create company name mapping** for variations
2. **Decide on Churned accounts** handling
3. **Build import script** using _all.csv as primary Programs source
4. **Test import** with sample data
5. **Full import** and validation

## Questions to Resolve

1. **Churned Accounts**: Keep as Accounts with Status="Churned" or separate handling?
2. **Missing Account Data**: Create Accounts with minimal data or wait for data?
3. **Company Variations**: How to handle "SHE Media" vs "Stylecaster (SHE Media)"?
4. **Program Naming**: Use "{Company} Pilot Program" or allow custom names?

