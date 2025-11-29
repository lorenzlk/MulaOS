# Memory Bank: Mula Project

## Overview

This memory bank contains comprehensive documentation for the mula project, following the memory-bank pattern to ensure knowledge retention and project continuity. The memory bank serves as the single source of truth for understanding the project's architecture, decisions, and current state.

## Structure

### Core Files (Required Reading)

1. **[projectbrief.md](./projectbrief.md)** - Foundation document defining core requirements and goals
2. **[productContext.md](./productContext.md)** - Why the project exists, problems it solves, and how it should work
3. **[systemPatterns.md](./systemPatterns.md)** - System architecture, technical decisions, and design patterns
4. **[techContext.md](./techContext.md)** - Technologies used, development setup, and technical constraints
5. **[activeContext.md](./activeContext.md)** - Current work focus, recent changes, and next steps
6. **[progress.md](./progress.md)** - What works, what's left to build, and current status

### Supporting Files

- **[ai_instructions.md](./ai_instructions.md)** - Instructions for AI assistants using the memory bank pattern

## How to Use This Memory Bank

### For New Team Members
1. Start with `projectbrief.md` to understand the project's mission and scope
2. Read `productContext.md` to understand why the project exists and how it works
3. Review `systemPatterns.md` to understand the technical architecture
4. Check `techContext.md` for development setup and technical details
5. Read `activeContext.md` to understand current priorities and recent changes
6. Review `progress.md` to understand what's working and what needs to be built

### For Development Work
1. Always check `activeContext.md` first to understand current priorities
2. Review relevant sections of `systemPatterns.md` for architectural guidance
3. Consult `techContext.md` for technical constraints and setup
4. Update `progress.md` when completing features or identifying issues
5. Update `activeContext.md` when making significant changes or decisions

### For Decision Making
1. Review `systemPatterns.md` for existing patterns and decisions
2. Check `activeContext.md` for current considerations and constraints
3. Document new decisions in `activeContext.md` with rationale
4. Update relevant files when decisions affect architecture or patterns

## Update Workflow

### When to Update
- After implementing significant changes
- When making important technical decisions
- When discovering new patterns or insights
- When user requests "update memory bank"
- When onboarding new team members

### Update Process
1. Review ALL memory bank files (not just the one you're updating)
2. Update `activeContext.md` with recent changes and current focus
3. Update `progress.md` with completed work and new issues
4. Update relevant technical files if architecture or patterns change
5. Ensure all files remain consistent with each other

### Update Triggers
- **Manual**: During development when making significant changes
- **Requested**: When explicitly asked to "update memory bank"
- **Regular**: Periodic reviews to ensure documentation stays current
- **Onboarding**: Updates when new team members join

## Key Principles

### Documentation Quality
- **Completeness**: All major components and decisions documented
- **Accuracy**: Documentation matches current implementation
- **Clarity**: Clear, understandable documentation
- **Maintenance**: Regular updates and reviews

### Knowledge Retention
- **Context Preservation**: Maintain historical context and decision rationale
- **Pattern Documentation**: Document recurring patterns and solutions
- **Decision Tracking**: Record technical decisions with rationale
- **Learning Capture**: Document insights and lessons learned

### Project Continuity
- **Knowledge Transfer**: Smooth handoffs between developers
- **Historical Context**: Preservation of project evolution
- **Future Planning**: Better foundation for future development
- **Risk Mitigation**: Reduced dependency on individual knowledge

## Quick Reference

### Project Overview
- **Purpose**: Client-side optimization toolkit for publisher websites
- **Core Technology**: Svelte-based SDK with AWS infrastructure
- **Key Constraint**: < 20 kB gzipped SDK size
- **Architecture**: Event-driven with component-based frontend

### Current Status
- **Phase**: Production-ready with ongoing optimization
- **Focus**: Memory bank implementation and documentation
- **Next Steps**: Testing enhancement and monitoring improvement
- **Known Issues**: Limited test coverage and documentation gaps

### Key Contacts
- **Infrastructure**: kale.mcnaney@offlinestudio.com
- **Documentation**: This memory bank
- **Development**: Follow patterns in `systemPatterns.md`

## Success Metrics

### Documentation Quality
- All major components documented
- Technical decisions tracked with rationale
- Current state accurately reflected
- Regular updates and maintenance

### Development Efficiency
- Reduced onboarding time for new developers
- Better knowledge retention across team
- Clearer decision-making process
- Improved collaboration and communication

### Project Continuity
- Smooth handoffs between developers
- Preserved historical context
- Better foundation for future development
- Reduced dependency on individual knowledge 