# Keyword-Based Site Targeting Feature

This feature adds support for targeting article keywords extracted by BootLoader in the site targeting system.

## Quick Links

- [Design Document](./design.md) - Complete design and implementation plan
- [Implementation Status](./implementation-status.md) - Current implementation progress

## Overview

The `keyword_substring` targeting type allows site targeting rules to match pages based on article keywords extracted from Open Graph and JSON-LD metadata.

## Usage

```
/mula-site-targeting-add <domain> keyword_substring <keyword_value> <search_phrase> --creds <credential_id>
```

**Example:**
```
/mula-site-targeting-add brit.co keyword_substring "fashion" "fashion trends for women" --creds impact_1
```

## Status

🚧 In Progress - See implementation status for details.

