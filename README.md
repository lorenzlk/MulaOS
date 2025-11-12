# MulaOS

A collection of automation tools and workflows for Mula operations, built primarily on Pipedream.

## Overview

MulaOS contains various automation systems for:
- Amazon Associates reporting and product feed enrichment
- Google Ad Manager KVP reporting
- Board Pulse LinkedIn monitoring
- And more...

## Project Structure

```
MulaOS/
├── docs/                    # Project documentation
│   ├── PRD.md              # Product Requirements Documents
│   ├── ARCHITECTURE.md     # System architecture docs
│   └── SETUP_CHECKLIST.md  # Setup guides
├── workflows/              # Pipedream workflow code
├── .github/               # GitHub templates and workflows
└── README.md              # This file
```

## Getting Started

Each project/tool has its own documentation in the `docs/` folder. Refer to individual project READMEs for setup instructions.

## Best Practices

- All workflows should include error handling and retry logic
- Use environment variables for sensitive credentials
- Document all projects with PRD, Architecture, and Setup Checklist
- Include monitoring and alerting for production workflows
- Track costs and optimize for free tier usage when possible

## Contributing

1. Create a new branch for your feature
2. Add/update documentation in `docs/`
3. Test your workflow thoroughly
4. Submit a PR with clear description

## License

Private - Mula Internal Use Only

