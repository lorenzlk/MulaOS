# Keyword-Based Site Targeting Design

## Overview

Add support for targeting article keywords extracted by BootLoader in the site targeting system. Currently, BootLoader extracts keywords from Open Graph `article:tag` meta tags and JSON-LD `keywords` fields, storing them as an array in `article_keywords` global event data. This design enables site targeting rules to match against these keywords.

## Current State

### Keyword Extraction (BootLoader.js)
- Keywords are extracted from:
  - Open Graph: `<meta property="article:tag">` tags
  - JSON-LD: `keywords` field (supports both string and array formats)
- Keywords are combined, deduplicated, and stored as an array
- Stored in global event data as `article_keywords` via `setGlobalEventData('article_keywords', tags)`
- Accessible via `window.Mula.getPageContext()` which returns `{ articleSection, tags }` where `tags` is the keywords array

### Current Targeting Types
1. **`path_substring`**: Matches URL path substrings
2. **`url_pattern`**: Regex match against full URL
3. **`ld_json`**: Matches against JSON-LD `articleSection` field

## Design Proposal

### New Targeting Type: `keyword_substring`

**Purpose**: Match pages where any keyword in the `article_keywords` array contains the specified targeting value (case-insensitive substring matching).

**Matching Logic**:
- Extract keywords from `pageContext.tags` (array of strings)
- Check if any keyword contains the targeting value (case-insensitive)
- Return first match found

**Example Use Cases**:
- Target all articles with "fashion" keyword: `keyword_substring` = `"fashion"`
- Target all articles with "beauty" keyword: `keyword_substring` = `"beauty"`
- Target sports articles: `keyword_substring` = `"sports"`

### Design Decisions

1. **Substring Matching**: Chosen over exact match to provide flexibility (e.g., "fashion" matches "fashion trends", "fashion tips", etc.)
2. **Case Insensitive**: Consistent with `ld_json` targeting behavior
3. **Array Iteration**: Check all keywords in the array, matching if any contains the substring
4. **Type Name**: `keyword_substring` follows existing naming pattern and clearly indicates substring matching

## Implementation Plan

### 1. Database Migration
**File**: `www.makemula.ai/migrations/[timestamp]-add-keyword-substring-targeting.js`

- Add `keyword_substring` to the `targetingType` ENUM in `site_targeting` table
- Update existing ENUM constraint to include new value

### 2. Model Update
**File**: `www.makemula.ai/models/SiteTargeting.js`

- Update ENUM definition to include `'keyword_substring'`
- Update comment to reflect new targeting type

### 3. Helper Functions Update
**File**: `www.makemula.ai/helpers/SiteTargetingHelpers.js`

- **`addSiteTargeting`**: Add `keyword_substring` to `validTypes` array
- **`checkTargetingMatch`**: Add new case in switch statement:
  ```javascript
  case 'keyword_substring':
    // Match against article keywords array
    if (pageContext && pageContext.tags && Array.isArray(pageContext.tags)) {
      matches = pageContext.tags.some(keyword => 
        keyword.toLowerCase().includes(targeting.targetingValue.toLowerCase())
      );
    }
    break;
  ```
- Note: `checkTargetingMatch` is server-side only (for testing), but we need SDK matching

### 4. SDK Update (BootLoader.js)
**File**: `sdk.makemula.ai/svelte-components/src/lib/BootLoader.js`

- Add new case in targeting matching switch statement (around line 432):
  ```javascript
  case 'keyword_substring':
    // Match against article keywords array
    if (pageContext && pageContext.tags && Array.isArray(pageContext.tags)) {
      matches = pageContext.tags.some(keyword => 
        keyword.toLowerCase().includes(targeting.value.toLowerCase())
      );
    }
    break;
  ```

### 5. Slack Command Update
**File**: `www.makemula.ai/routes/slack.js`

- Update `validTypes` array to include `'keyword_substring'` (around line 1227)
- Update help text to include `keyword_substring` in usage examples

### 6. Manifest Builder
**File**: `www.makemula.ai/scripts/transform-load/mulize/manifest/index.js`

- No changes needed - manifest builder already handles all targeting types generically

### 7. Documentation Update
**File**: `www.makemula.ai/docs/site-targeting-slack-commands.md`

- Add section for `keyword_substring` targeting type
- Include examples and use cases

## Testing Strategy

### Unit Tests
1. **Helper Function Tests**: Test `checkTargetingMatch` with keyword_substring targeting
2. **SDK Tests**: Test BootLoader keyword matching logic

### Integration Tests
1. **End-to-End Test**: 
   - Create keyword_substring targeting rule via Slack command
   - Verify it appears in manifest
   - Test SDK matching with actual page containing matching keywords

### Test Cases
1. **Exact Match**: Keyword "fashion" matches targeting value "fashion"
2. **Substring Match**: Keyword "fashion trends" matches targeting value "fashion"
3. **Case Insensitive**: Keyword "Fashion" matches targeting value "fashion"
4. **Multiple Keywords**: Page with ["beauty", "skincare"] matches targeting value "beauty"
5. **No Match**: Page with ["sports"] does not match targeting value "fashion"
6. **Empty Keywords**: Page with no keywords does not match
7. **Array Handling**: Ensure works with both string and array keyword formats

## Example Usage

### Slack Command
```
/mula-site-targeting-add brit.co keyword_substring "fashion" "fashion trends for women" --creds impact_1
```

### Expected Behavior
1. User creates targeting rule: `keyword_substring` = `"fashion"` for domain `brit.co`
2. BootLoader extracts keywords from article page (e.g., ["fashion", "style", "trends"])
3. SDK checks if any keyword contains "fashion" (case-insensitive)
4. Match found: Page loads product feed for "fashion trends for women"
5. Event logged with `targeting_type: "keyword_substring"` and `targeting_value: "fashion"`

## Edge Cases & Considerations

1. **Keyword Format**: Handle both string and array formats (already handled in BootLoader extraction)
2. **Empty Keywords**: If page has no keywords, targeting should not match
3. **Performance**: Array iteration is efficient for typical keyword counts (usually < 10 keywords)
4. **Special Characters**: Substring matching handles special characters naturally
5. **Multiple Targeting Rules**: First match wins (consistent with existing behavior)
6. **Manifest Caching**: Targeting rules are cached in manifest.json, so updates require manifest rebuild

## Migration Path

1. **Backward Compatible**: Existing targeting rules continue to work
2. **No Breaking Changes**: All existing functionality preserved
3. **Gradual Rollout**: New targeting type can be used immediately after deployment

## Success Criteria

✅ Database migration completes successfully  
✅ New targeting type appears in Slack command validation  
✅ Targeting rules with `keyword_substring` are saved to database  
✅ Targeting rules appear in manifest.json  
✅ SDK correctly matches pages with matching keywords  
✅ Events logged with correct targeting metadata  
✅ Documentation updated with examples  

## Files to Modify

1. `www.makemula.ai/migrations/[timestamp]-add-keyword-substring-targeting.js` (NEW)
2. `www.makemula.ai/models/SiteTargeting.js`
3. `www.makemula.ai/helpers/SiteTargetingHelpers.js`
4. `sdk.makemula.ai/svelte-components/src/lib/BootLoader.js`
5. `www.makemula.ai/routes/slack.js`
6. `www.makemula.ai/docs/site-targeting-slack-commands.md`

## Open Questions

None at this time - design is straightforward and follows existing patterns.

