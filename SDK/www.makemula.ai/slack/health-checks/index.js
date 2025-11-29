const identities = require('../../openai/prompts/health-checks/index.js');
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateSlackMessage(results) {
  const prompt = identities(results)['quinn'];

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
    max_tokens: 500
  });

  return completion.choices[0].message.content;
}

module.exports = { generateSlackMessage }; 