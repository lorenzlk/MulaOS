# www.makemula.ai

## Local Setup

1. Have a local postgres installation running
2. Get an [OpenAI API Key](https://platform.openai.com)
3. Get a [SERPAPI API Key](https://serpapi.com/)
4. Run `cp .env.example .env`
5. Add your environment variables - you can leave the `AWS_*` and `BASIC_AUTH_*` keys blank when running locally
6. `npm install` 
7. `npm start`
8. Visit http://localhost:3010

## Create an encore from the CLI

```
npm run create-encore -- <URL>
```

This will create new files in `./data/<domain>/pages/<pageId>` which will be available at http://localhost:3010/data/<domain>/pages/<pageId>/* for consumption by the [sdk.makemula.ai](../sdk.makemula.ai/README.md)

## Slack Commands

The application supports various Slack commands for monitoring and reporting. See [docs/slack-commands.md](docs/slack-commands.md) for detailed documentation.

### Quick Examples

- `/mula-ab-test-performance` - Generate A/B test performance report
- `/mula-performance-report` - Generate performance reports
- `/mula-health-check` - Check website health
- `/mula-site-taxonomy` - Analyze site structure and content organization