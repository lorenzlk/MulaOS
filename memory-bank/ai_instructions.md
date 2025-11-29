# AI Workflow Instructions

## Core Principle

This project uses a **Memory Bank system** because context resets between sessions. The Memory Bank is your only link to previous work. Read ALL memory bank files at the start of EVERY task - this is not optional.

## Memory Bank Files

All memory bank files are located in `memory-bank/` and follow this hierarchy:

```
projectbrief.md (foundation)
    ├─> productContext.md (why & how)
    ├─> systemPatterns.md (architecture)
    └─> techContext.md (technologies)
            └─> activeContext.md (current focus)
                    └─> progress.md (status)
```

### File Purposes

1. **projectbrief.md** - Foundation document, defines core requirements and goals
2. **productContext.md** - Why project exists, problems solved, how it should work
3. **activeContext.md** - Current work focus, recent changes, next steps
4. **systemPatterns.md** - Architecture, technical decisions, design patterns
5. **techContext.md** - Technologies, setup, constraints, dependencies
6. **progress.md** - What works, what's left, current status, known issues
7. **ai_instructions.md** - This file, workflow rules and ground rules

### Additional Files

- **experiments/** - Directory for experiment documentation
- Create additional files/folders as needed for complex features

## Workflow Sequence

### CRITICAL: Always Follow This Order

```
1. READ MEMORY BANK
   └─> Read ALL core files
   └─> Check experiments/ if applicable
   └─> Understand full context

2. UNDERSTAND
   └─> Analyze the request
   └─> Identify what's needed
   └─> Determine approach

3. PLAN
   └─> Develop strategy
   └─> Identify dependencies
   └─> Consider edge cases
   └─> Document approach

4. DOCUMENT PLAN
   └─> Update activeContext.md with plan
   └─> Note any new patterns discovered
   └─> Clarify next steps

5. GET APPROVAL
   └─> Present plan to user
   └─> Wait for confirmation
   └─> Adjust based on feedback

6. IMPLEMENT
   └─> Execute the plan
   └─> Follow existing patterns
   └─> Test changes thoroughly

7. VALIDATE
   └─> Run tests
   └─> Check for errors
   └─> Verify functionality

8. UPDATE MEMORY BANK
   └─> Document what was done
   └─> Update progress.md
   └─> Record new patterns
   └─> Update activeContext.md
```

### NEVER Skip Steps

**DO NOT**:
- Jump straight to code changes
- Implement without planning
- Skip memory bank reading
- Forget to document changes

## Core Workflows

### Plan Mode

Use when: Strategy discussions, high-level planning, architecture decisions

```
1. Read Memory Bank files
2. Check if files are complete and current
3. If incomplete:
   - Create plan
   - Document in chat
4. If complete:
   - Verify context
   - Develop strategy
   - Present approach
```

### Act Mode

Use when: Implementation, executing specific tasks, making changes

```
1. Read Memory Bank files
2. Update documentation for context
3. Execute the task
4. Document all changes
5. Update Memory Bank
```

## Documentation Updates

### When to Update Memory Bank

Update when:
1. Discovering new project patterns
2. After implementing significant changes
3. When user requests "update memory bank"
4. When context needs clarification
5. At natural stopping points

### Full Memory Bank Review

When user says **"update memory bank"**, you MUST:
1. Review EVERY memory bank file
2. Update all files that need changes
3. Even if some files don't need updates, review them
4. Focus particularly on:
   - `activeContext.md` (current state)
   - `progress.md` (what's done, what's next)

### Update Process

```
1. Review ALL memory bank files
2. Document current state accurately
3. Clarify next steps
4. Document insights & patterns discovered
5. Ensure consistency across all files
```

## Code Quality Standards

### Follow Existing Patterns

- **Consistency**: Match existing code style
- **Conventions**: Follow established naming conventions
- **Patterns**: Use patterns documented in systemPatterns.md
- **Architecture**: Respect the system architecture

### Testing Requirements

- Test all changes thoroughly
- Validate data integrity
- Check edge cases
- Run existing validation scripts
- Create new tests if needed

### Documentation Standards

- Document all decisions with rationale
- Explain WHY, not just WHAT
- Update relevant memory bank files
- Keep documentation in sync with code

## Decision Framework

### When Making Technical Decisions

1. **Check Memory Bank**: Has this been decided before?
2. **Check Patterns**: What patterns are already in use?
3. **Consider Context**: What are the constraints?
4. **Document**: Record the decision and rationale
5. **Update**: Add to systemPatterns.md if it's a new pattern

### When Uncertain

1. **Check Memory Bank**: Often the answer is documented
2. **Ask User**: Don't assume - clarify requirements
3. **Document**: Record the clarification for future sessions
4. **Update**: Add to relevant memory bank file

## Project-Specific Rules

### Mula SDK Context

The Mula SDK uses an **agent-based architecture** with six specialized agents:
1. Weston - Content analysis
2. Sally - Generative AI & product discovery
3. Taka - Deployment & control
4. Andy - Analytics & reporting
5. Occy - Monetization & optimization
6. Cal - Experimentation & A/B testing

**Always consider**: Which agent does this work relate to?

### MulaOS Context

This repository handles **operations management**:
- Partner relationships
- Project tracking
- Contact management
- Migration from Notion to Google Workspace

**Always consider**: How does this affect operational workflows?

### Migration Work

When working on migration scripts:
1. **Data Integrity First**: Never sacrifice data integrity for convenience
2. **Relationship Preservation**: All relationships must be maintained
3. **Validation Required**: Every migration step needs validation
4. **Documentation**: Document edge cases and issues discovered

## Communication Standards

### With User

- **Clear**: Use precise language
- **Concise**: Be brief but complete
- **Honest**: Admit when uncertain
- **Helpful**: Provide context and options

### In Documentation

- **Accurate**: Reflect actual state
- **Complete**: Include all relevant details
- **Current**: Keep up to date
- **Useful**: Write for future sessions

## Error Handling

### When Things Go Wrong

1. **Document**: Record the error and context
2. **Analyze**: Understand root cause
3. **Fix**: Implement proper solution
4. **Validate**: Verify fix works
5. **Update**: Document in progress.md known issues

### When Stuck

1. **Re-read Memory Bank**: Often contains the answer
2. **Check Documentation**: Review relevant docs
3. **Ask User**: Don't spin wheels - ask for help
4. **Document**: Record the blocker for future reference

## Context Window Management

### As Context Fills Up

When approaching context limit:
1. **Update Memory Bank**: Document current state
2. **Complete Current Work**: Finish in-progress tasks
3. **Document Next Steps**: Clear plan for next session
4. **User Notification**: Suggest starting fresh conversation

### Starting Fresh Session

At the start of each session:
1. **Read ALL Memory Bank Files**: Non-negotiable
2. **Verify Understanding**: Confirm context is complete
3. **Check Active Context**: Understand current focus
4. **Review Progress**: Know what's done and what's next

## Best Practices

### Getting Started
- Start with basic project brief, evolve naturally
- Let patterns emerge from work
- Don't force documentation - let it happen organically
- Trust the process - value compounds over time

### Ongoing Work
- Update memory bank at natural stopping points
- Keep activeContext.md fresh
- Document learnings as they happen
- Maintain consistency across files

### Documentation Flow
- projectbrief.md is foundation
- activeContext.md changes most frequently
- progress.md tracks milestones
- All files collectively maintain project intelligence

## Remember

After every context reset, you begin completely fresh. The Memory Bank is your ONLY link to previous work. It must be maintained with precision and clarity - your effectiveness depends entirely on its accuracy.

**Always read ALL memory bank files at the start of EVERY task.**

