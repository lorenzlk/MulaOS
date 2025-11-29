# Next Page Worker Changes Required

## Overview
The `nextPageBuildWorker.js` needs to be updated to support the new section-specific manifest architecture. Instead of updating a single monolithic manifest, it will now create/update individual section manifests and update the main site manifest with targeting rules.

## Current Implementation
- Creates/updates single manifest at `{domain}/next-page/manifest.json`
- Contains all sections in one file with `recommendations` array
- Each recommendation has `path`, `articles`, `priority`, `createdAt`

## New Implementation Required

### 1. Section Manifest Creation
**Location**: `{domain}/next-page/{section}/manifest.json`

**Structure**:
```json
{
  "section": "michigan-wolverines",
  "articles": [
    {
      "imageUrl": "...",
      "title": "...",
      "url": "..."
    }
  ],
  "updatedAt": "2025-01-27T14:30:00.000Z",
  "lookbackDays": 7,
  "limit": 20
}
```

**Changes**:
- Upload to `{domain}/next-page/{section}/manifest.json` instead of `{domain}/next-page/manifest.json`
- Section name comes from `NextPageTargeting` record (or auto-generated from `categoryOrPath`)
- No need to load existing manifest (section manifests are independent)
- No need to merge with other sections

### 2. Main Manifest Update
**Location**: `{domain}/manifest.json`

**Responsibility**: **Manifest Builder** (NOT the worker)

**Pattern**: Follows same pattern as `_targeting` for product targeting:
- Worker creates/updates `NextPageTargeting` database record
- Manifest builder reads from database and generates `_nextPageTargeting` array
- Database is single source of truth

**Manifest Builder Changes** (`scripts/transform-load/mulize/manifest/index.js`):
- Add logic similar to `_targeting`:
  ```javascript
  // Add next-page targeting information to manifest
  try {
      const nextPageTargetingRecords = await getNextPageTargetingForDomain(domain);
      if (nextPageTargetingRecords.length > 0) {
          manifestMapping._nextPageTargeting = nextPageTargetingRecords.map(record => ({
              type: record.targetingType,
              value: record.targetingValue,
              section: record.sectionName,
              manifest: `next-page/${record.sectionName}/manifest.json`,
              priority: calculatePriority(record.targetingValue)
          }));
          console.log(`✓ Added ${nextPageTargetingRecords.length} next-page targeting rules to manifest for ${domain}`);
      }
  } catch (error) {
      console.error(`Error adding next-page targeting to manifest for ${domain}:`, error);
  }
  ```

**Why This Approach**:
- Single source of truth (database)
- No race conditions (worker updates DB, builder reads DB)
- Consistent manifest generation (all rules come from same place)
- Easy to rebuild manifests (just re-run builder)
- Separation of concerns (worker = data, builder = presentation)
- Matches existing `_targeting` pattern exactly

### 3. Database Integration
**New Requirements**:
- Create/update `NextPageTargeting` record before processing
- Store: `topLevelDomain`, `targetingType`, `targetingValue`, `sectionName`, `lookbackDays`, `limit`
- Use section name from database record (or generate from `categoryOrPath`)

### 4. Section Name Generation
**Logic**:
- If section name provided in command, use it
- Otherwise, generate from `categoryOrPath`:
  - Remove leading/trailing slashes
  - Replace slashes with hyphens
  - Lowercase
  - Example: `/teams/michigan-wolverines/` → `teams-michigan-wolverines`
  - Example: `Style Inspo` → `style-inspo`

### 5. Worker Method Changes

**Current `processJob` method**:
```javascript
async processJob(job) {
  // 1. Execute Athena query
  // 2. Crawl URLs for metadata
  // 3. Load existing manifest (single file)
  // 4. Merge new articles into recommendations array
  // 5. Upload single manifest
}
```

**New `processJob` method**:
```javascript
async processJob(job) {
  const { domain, lookbackDays, categoryOrPath, limit, sectionName, targetingType, targetingValue, channelId, channelName, dryRun } = job.data;
  
  // 1. Generate or use provided section name
  const section = sectionName || this.generateSectionName(categoryOrPath);
  
  // 2. Create/update NextPageTargeting database record
  //    This is the source of truth - manifest builder will read from here
  const targetingRecord = await this.upsertTargetingRecord(domain, targetingType, targetingValue, section, lookbackDays, limit);
  
  // 3. Execute Athena query
  const queryResult = await executeQuery('next-page-recommendations', {...});
  
  // 4. Crawl URLs for metadata
  const articles = await this.crawlArticles(pathnames, domain);
  
  // 5. Create section manifest
  const sectionManifest = {
    section: section,
    articles: articles,
    updatedAt: new Date().toISOString(),
    lookbackDays: lookbackDays,
    limit: limit
  };
  
  // 6. Upload section manifest to {domain}/next-page/{section}/manifest.json
  const sectionManifestPath = `https://prod.makemula.ai/${domain}/next-page/${section}/manifest.json`;
  await uploadJsonToS3(sectionManifestPath, sectionManifest);
  
  // 7. NOTE: Main manifest update is handled by manifest builder, not here
  //    The manifest builder reads NextPageTargeting records and generates _nextPageTargeting array
  //    This follows the same pattern as _targeting for product targeting
  
  // 8. Send Slack notification
  //    Optionally: Notify that manifest builder should be run to update main manifest
}
```

### 6. New Helper Methods Needed

**`generateSectionName(categoryOrPath)`**:
- Converts category/path to valid section name
- Handles paths, JSON-LD values, etc.

**`upsertTargetingRecord(domain, targetingType, targetingValue, section, lookbackDays, limit)`**:
- Creates or updates `NextPageTargeting` record
- Returns record with ID

**`getNextPageTargetingForDomain(domain)`** (in `NextPageTargetingHelpers.js`):
- Similar to `getTargetingForDomain()` for product targeting
- Reads `NextPageTargeting` records from database
- Returns array of targeting records for manifest builder
- Filters by domain and active status (paranoid: true)

**`calculatePriority(targetingValue)`**:
- Already exists, but may need adjustment for different targeting types
- For paths: count depth (slashes)
- For JSON-LD: return 0 (highest priority)
- For URL patterns: estimate specificity

### 7. Slack Command Integration
**New command structure**:
```
/mula-next-page-targeting-add <domain> <targeting_type> <targeting_value> <section_name> <lookback_days> [limit]
```

**Job data structure**:
```javascript
{
  domain: "www.on3.com",
  targetingType: "path_substring",
  targetingValue: "/teams/michigan-wolverines/",
  sectionName: "michigan-wolverines",
  lookbackDays: 7,
  limit: 20,
  channelId: "...",
  channelName: "...",
  dryRun: false
}
```

### 8. Backward Compatibility
**Considerations**:
- Old `/mula-next-page-build` command may still exist
- Should migrate old manifests to new structure
- Migration script needed to:
  1. Read old `{domain}/next-page/manifest.json`
  2. Extract each recommendation
  3. Create section manifest for each
  4. Create `NextPageTargeting` records
  5. Update main manifest

### 9. Refresh Script Changes
**`scripts/next-page-manifest-refresh.js`**:
- Should iterate through `NextPageTargeting` records instead of loading main manifest
- For each targeting record:
  1. Get section name
  2. Rebuild section manifest using existing worker logic
  3. Main manifest will be updated automatically

## Implementation Checklist

- [ ] Create `NextPageTargeting` database model and migration
- [ ] Create `NextPageTargetingHelpers.js` with CRUD operations (similar to `SiteTargetingHelpers.js`)
- [ ] Add `getNextPageTargetingForDomain()` helper method
- [ ] Update `nextPageBuildWorker.js` to create section manifests (NOT main manifest)
- [ ] Add `generateSectionName` helper method to worker
- [ ] Add `upsertTargetingRecord` helper method to worker (or use helper)
- [ ] Update Slack command handler for new command structure
- [ ] **Update manifest builder** (`scripts/transform-load/mulize/manifest/index.js`) to include `_nextPageTargeting` array
- [ ] Add `calculatePriority()` helper to manifest builder (or reuse from worker)
- [ ] Update refresh script to use `NextPageTargeting` records
- [ ] Create migration script for existing manifests
- [ ] Update SDK `BootLoader.js` to check `_nextPageTargeting` in main manifest
- [ ] Test with multiple sections on www.on3.com

## Testing Strategy

1. **Single Section**: Create one section, verify manifest structure
2. **Multiple Sections**: Create 10 sections, verify all work independently
3. **Main Manifest**: Verify `_nextPageTargeting` array is correct
4. **SDK Integration**: Verify lazy loading works correctly
5. **Refresh Script**: Verify refresh works with new structure
6. **Migration**: Test migration from old to new structure

