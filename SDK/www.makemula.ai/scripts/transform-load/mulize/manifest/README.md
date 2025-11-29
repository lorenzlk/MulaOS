# Manifest System

This directory contains the manifest generation system for the new data architecture.

## Overview

The manifest system has been updated to support the new data architecture where:
- Each Page model object links to a Search instance
- Each Search instance has an addressable CDN path where products are stored
- The addressable path is defined as a transformation of the `phraseID` property of the search

## Manifest Format

### New Format (Lookup Table)
The new manifest format is a JSON object where:
- Keys are page IDs (SHA256 hashes of URL pathnames)
- Values are the corresponding search result URLs

Example:
```json
{
  "abc123def456": "searches/789ghi012jkl/results.json",
  "xyz789uvw012": "searches/345mno678pqr/results.json",
  "_legacy": ["oldpage1", "oldpage2"]
}
```

### Legacy Format (Array)
The old manifest format is still supported for backward compatibility:
```json
["page1", "page2", "page3"]
```

## Files

- `index.js` - Main manifest generation script
- `test-manifest.js` - Test script to verify manifest logic
- `README.md` - This documentation

## Usage

### Generate Manifests
```bash
npm run mulize-manifest
```

### Test Manifest Logic
```bash
node test-manifest.js
```

## How It Works

1. **Page Discovery**: The script scans S3 for pages in each hostname prefix
2. **Database Lookup**: For each page ID, it queries the database to find the associated search phrase
3. **URL Generation**: It creates the search result URL using the phraseID transformation
4. **Manifest Creation**: It generates a manifest file with the page ID to search URL mapping
5. **Backward Compatibility**: Pages without associated searches are added to a `_legacy` array

## BootLoader Integration

The BootLoader has been updated to handle both manifest formats:

1. **New Format**: Looks up the page ID in the manifest object and uses the corresponding search URL
2. **Legacy Format**: Falls back to the old array-based lookup
3. **Mixed Format**: Supports manifests with both new mappings and legacy pages

## Database Requirements

The system requires:
- Page model with `searchId` foreign key to Search model
- Search model with `phrase` and `phraseID` fields
- Proper associations between Page and Search models

## Error Handling

- If a page ID cannot be mapped to a search phrase, it's added to the `_legacy` array
- If the database query fails, default search phrases are used based on hostname
- The system gracefully handles missing or malformed manifests 