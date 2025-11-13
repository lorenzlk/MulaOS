# URL-Based ID System

## Overview

MulaOS uses URL-based identifiers instead of UUIDs or sequential IDs. This allows for:
- Human-readable identifiers
- Direct linking to resources
- Better integration with web systems
- Easier debugging and reference

## ID Format

### Account IDs
**Format**: `https://mula.com/pubs/{normalized-company-name}`

**Examples**:
- On3 → `https://mula.com/pubs/on3`
- Brit + Co → `https://mula.com/pubs/brit-co`
- Stylecaster → `https://mula.com/pubs/stylecaster`
- SHE Media → `https://mula.com/pubs/she-media`

**Normalization Rules**:
- Convert to lowercase
- Replace spaces and special characters with hyphens
- Remove leading/trailing hyphens
- Example: "Brit + Co" → "brit-co"

### Contact IDs
**Format**: `https://mula.com/contacts/{encoded-email}`

**Examples**:
- `user@example.com` → `https://mula.com/contacts/user%40example.com`
- Email is URL-encoded for safety

### Program IDs
**Format**: `https://mula.com/programs/{normalized-company-name}-pilot`

**Examples**:
- On3 → `https://mula.com/programs/on3-pilot`
- Brit + Co → `https://mula.com/programs/brit-co-pilot`

### Project IDs
**Format**: `https://mula.com/projects/{normalized-project-name}`

**Examples**:
- "On3 Launch" → `https://mula.com/projects/on3-launch`
- "StyleCaster Launch" → `https://mula.com/projects/stylecaster-launch`

### Task IDs
**Format**: `https://mula.com/tasks/{project-slug}/{normalized-task-name}`

**Examples**:
- Task "On3 launch Michigan section" in project "on3-launch" → `https://mula.com/tasks/on3-launch/on3-launch-michigan-section`

### Activity IDs
**Format**: `https://mula.com/activity/{timestamp}`

**Examples**:
- `https://mula.com/activity/1733616000000`

## Benefits

1. **Human-Readable**: Easy to understand what the ID refers to
2. **Direct Links**: Can be used as actual URLs (if web system supports)
3. **Consistent**: Same format across all entity types
4. **Debuggable**: Easy to identify records in logs
5. **Integration-Friendly**: Works well with REST APIs and webhooks

## Usage in Functions

### Generating IDs

```javascript
// Account ID
const accountID = generateAccountID("On3");
// Returns: https://mula.com/pubs/on3

// Contact ID
const contactID = generateContactID("user@example.com");
// Returns: https://mula.com/contacts/user%40example.com

// Program ID
const programID = generateProgramID("On3");
// Returns: https://mula.com/programs/on3-pilot
```

### Using IDs in Queries

```javascript
// Get programs for account
const programs = getAccountPrograms("https://mula.com/pubs/on3");

// Get contacts for account
const contacts = getAccountContacts("https://mula.com/pubs/on3");
```

## Customization

If you use a different URL structure, update the ID generation functions:

```javascript
function generateAccountID(accountName) {
  // Your custom format
  const normalized = normalizeName(accountName);
  return `https://yourdomain.com/publishers/${normalized}`;
}
```

## Migration from UUIDs

If you have existing data with UUID-based IDs:
1. Create a mapping table (old ID → new URL ID)
2. Update all references
3. Or keep both IDs temporarily during transition

## Validation

URL-based IDs should:
- Start with `https://mula.com/`
- Follow the correct path structure
- Use normalized names (lowercase, hyphens)
- Be unique within their entity type

## Examples

### Complete Account Record
```
ID: https://mula.com/pubs/on3
Account Name: On3
Type: Publisher
...
```

### Complete Contact Record
```
ID: https://mula.com/contacts/adam%40on3.com
First Name: Adam
Last Name: Smith
Email: adam@on3.com
...
```

### Complete Program Record
```
ID: https://mula.com/programs/on3-pilot
Program Name: On3 Pilot Program
Account ID: https://mula.com/pubs/on3
...
```

