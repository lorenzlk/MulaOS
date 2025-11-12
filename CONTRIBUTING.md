# Contributing to MulaOS

Thank you for contributing to MulaOS! This document provides guidelines and best practices for contributing.

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Development Workflow

### Before Starting
- Check existing issues and PRs to avoid duplicate work
- Create an issue first for major changes to discuss approach
- Use the appropriate issue template

### Code Standards

1. **Documentation First**: Update or create documentation before/while coding
2. **Error Handling**: Always include proper error handling and retry logic
3. **Logging**: Add meaningful log messages for debugging
4. **Testing**: Test workflows thoroughly before submitting PRs
5. **Security**: Never commit credentials or sensitive data

### Documentation Requirements

Each new project/workflow must include:
- `PRD.md` - Product Requirements Document
- `ARCHITECTURE.md` - System architecture
- `SETUP_CHECKLIST.md` - Setup instructions
- `TROUBLESHOOTING.md` - Common issues and solutions
- `README.md` - Project overview

Use templates in `docs/templates/` as starting points.

### Code Style

- Follow ESLint rules (run `npm run lint`)
- Use Prettier for formatting (run `npm run format`)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and modular

### Pull Request Process

1. Fill out the PR template completely
2. Ensure all checks pass
3. Request review from team members
4. Address feedback promptly
5. Keep PRs focused and reasonably sized

### Commit Messages

Use clear, descriptive commit messages:
- `feat: Add Amazon Associates scraper`
- `fix: Resolve rate limiting issue in PA-API client`
- `docs: Update setup checklist`
- `refactor: Extract common error handling logic`

## Questions?

If you have questions, please open an issue with the `question` label.

