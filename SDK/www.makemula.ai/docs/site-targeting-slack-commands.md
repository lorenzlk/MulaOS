# Site Targeting Slack Commands

Site targeting allows you to automatically serve product feeds on pages that aren't explicitly manifested but match certain criteria. This is useful for dynamic content or new pages that haven't been processed yet.

## Overview

Site targeting works as a fallback mechanism when a page URL is not found in the manifest. The SDK will check if the current page matches any targeting rules and use the associated search phrase to load a product feed.

## Targeting Types

### 1. Path Substring (`path_substring`)
Matches pages where the URL path contains the specified substring.

**Example**: `/fashion/` will match:
- `https://example.com/fashion/summer-trends`
- `https://example.com/fashion/accessories/bags`
- `https://example.com/lifestyle/fashion-advice`

### 2. URL Pattern (`url_pattern`)
Uses regex patterns to match against the full URL.

**Example**: `.*\/beauty\/.*` will match:
- `https://example.com/beauty/skincare`
- `https://example.com/beauty/makeup/tutorials`
- `https://example.com/beauty/`

### 3. JSON-LD Category (`ld_json`)
Matches against the `articleSection` field in JSON-LD structured data.

**Example**: `Style Trends` will match pages with JSON-LD like:
```json
{
  "@type": "Article",
  "articleSection": "Style Trends & Inspiration"
}
```

### 4. Keyword Substring (`keyword_substring`)
Matches pages where any keyword in the article keywords array contains the specified substring (case-insensitive). Keywords are extracted from Open Graph `article:tag` meta tags and JSON-LD `keywords` fields.

**Example**: `fashion` will match pages with keywords like:
- `["fashion", "style", "trends"]`
- `["fashion trends", "winter", "outfits"]`
- `["Fashion", "Accessories"]`

**Note**: Matching is case-insensitive and uses substring matching, so `fashion` will match `fashion trends`, `Fashion`, `fashionable`, etc.

## Slack Commands

### Add Site Targeting
```
/mula-site-targeting-add <top-level-domain> <targeting_type> <targeting_value> <search_phrase>
```

**Parameters**:
- `top-level-domain`: The domain (e.g., `brit.co`, `spotcovery.com`)
- `targeting_type`: One of `path_substring`, `url_pattern`, `ld_json`, or `keyword_substring`
- `targeting_value`: The value to match against
- `search_phrase`: The search phrase to use when targeting matches

**Examples**:
```
/mula-site-targeting-add brit.co path_substring /fashion/ "fashion trends for women" --creds impact_1
/mula-site-targeting-add spotcovery.com url_pattern ".*\/beauty\/.*" "beauty products and tips" --creds impact_1
/mula-site-targeting-add gritdaily.com ld_json "Style Trends" "style and fashion advice" --creds impact_1
/mula-site-targeting-add brit.co keyword_substring "fashion" "fashion trends for women" --creds impact_1
```

### List Site Targeting
```
/mula-site-targeting-list [<top-level-domain>] [--show-deleted]
```

**Parameters**:
- `top-level-domain`: Optional domain filter (e.g., `brit.co`, `spotcovery.com`)
- `--show-deleted`: Optional flag to include soft-deleted records in the results

**Examples**:
```
/mula-site-targeting-list
/mula-site-targeting-list brit.co
/mula-site-targeting-list --show-deleted
/mula-site-targeting-list brit.co --show-deleted
```

**Note**: By default, deleted records are excluded from the list. Use the `--show-deleted` flag to include them.

### Remove Site Targeting
```
/mula-site-targeting-rm <site_targeting_record_id>
```

**Parameters**:
- `site_targeting_record_id`: The ID of the targeting record to remove (shown in list command)

**Example**:
```
/mula-site-targeting-rm 123
```

## How It Works

1. **Page Load**: When a user visits a page, the SDK checks if the page URL exists in the manifest
2. **Manifest Check**: If the page is manifested, it uses the associated search results
3. **Targeting Fallback**: If the page is not manifested, the SDK checks targeting rules
4. **Match Evaluation**: Each targeting rule is evaluated based on its type:
   - Path substring: Checks if the URL path contains the specified substring
   - URL pattern: Applies regex pattern to the full URL
   - JSON-LD: Extracts articleSection from JSON-LD and checks for matches
   - Keyword substring: Checks if any article keyword contains the specified substring (case-insensitive)
5. **Feed Loading**: If a match is found, the SDK loads products using the associated search phrase

## Best Practices

### Path Substring Targeting
- Use specific, unique path segments
- Avoid overly broad matches that might catch unintended pages
- Consider URL structure and hierarchy

**Good**: `/fashion/`, `/beauty/skincare/`
**Avoid**: `/`, `/article/` (too broad)

### URL Pattern Targeting
- Test regex patterns thoroughly before deployment
- Use anchors (`^`, `$`) when appropriate
- Escape special characters properly

**Good**: `.*\/beauty\/.*`, `^https:\/\/example\.com\/fashion\/.*`
**Avoid**: `.*` (matches everything)

### JSON-LD Targeting
- Use exact category names from your content management system
- Consider case sensitivity
- Test with actual page content

**Good**: `Style Trends`, `Beauty Tips`, `Fashion News`
**Avoid**: Generic terms like `Article`, `News`

### Keyword Substring Targeting
- Use specific, meaningful keywords that appear in article metadata
- Leverage substring matching for flexibility (e.g., `fashion` matches `fashion trends`)
- Matching is case-insensitive
- Test with actual pages to verify keywords are being extracted

**Good**: `fashion`, `beauty`, `sports`, `tech`
**Avoid**: Very generic terms like `news`, `article`, `blog` (too broad)

## Testing

You can test the site targeting functionality using the test script:

```bash
npm run test-site-targeting
```

This will:
1. Create test targeting records
2. Verify listing functionality
3. Test matching logic with sample URLs
4. Clean up test data

## Troubleshooting

### Common Issues

1. **No matches found**: Check that targeting values match actual page content
2. **Regex errors**: Validate regex patterns before adding
3. **Case sensitivity**: JSON-LD matching is case-insensitive, but path matching is case-sensitive
4. **Domain mismatch**: Ensure the top-level domain matches exactly

### Debugging

Enable debug logging in the SDK by adding `?mulaLogLevel=2` to the URL to see targeting evaluation logs.

## Integration with Existing Systems

Site targeting integrates seamlessly with:
- Existing manifest system (serves as fallback)
- Organic configuration (respects existing targeting rules)
- Analytics and tracking (targeting matches are logged)
- A/B testing (targeting rules work with experiments) 