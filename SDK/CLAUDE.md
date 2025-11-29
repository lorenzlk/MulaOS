# Cursor AI Instructions

## CRITICAL: Memory Bank First

**Before starting ANY work or responding to ANY request, you MUST:**

1. Read ALL core memory bank files in `memory-bank/`:
   - `projectbrief.md` - Foundation and project scope
   - `productContext.md` - Why this exists and how it should work
   - `activeContext.md` - Current work focus and recent changes
   - `systemPatterns.md` - Architecture and technical patterns
   - `techContext.md` - Technologies and setup
   - `progress.md` - Current status and what's left to build
   - `ai_instructions.md` - Workflow and ground rules

2. Check for relevant experiment documentation in `memory-bank/experiments/` if applicable

3. Understand the full context before making any changes or recommendations

## Workflow Rules

### Always Plan Before Implementing
- **NEVER** jump straight to code changes
- Follow this sequence: Understand → Plan → Document → Get Approval → Implement
- See `memory-bank/ai_instructions.md` for complete planning process

### Memory Bank Updates
- Update `activeContext.md` during planning and implementation
- Update `progress.md` after completing work
- Document new patterns in `systemPatterns.md`
- Update `techContext.md` for new technologies

### Code Quality
- Follow existing patterns and conventions
- Test changes thoroughly
- Document all decisions and rationale

## Quick Reference

**Memory Bank Location**: `memory-bank/`

**Core Files to Read**:
- `projectbrief.md`
- `productContext.md`
- `activeContext.md` ⭐ (most important for current state)
- `systemPatterns.md`
- `techContext.md`
- `progress.md`
- `ai_instructions.md`

**When user says "update memory bank"**: Review ALL memory bank files, even if some don't need updates.

---

**Remember**: This project uses a Memory Bank system because context resets between sessions. The Memory Bank is the single source of truth. Always read it first.

