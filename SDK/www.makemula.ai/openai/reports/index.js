const OpenAI = require('openai');
const { csvAnalysisSystemPrompt } = require('../prompts/reports/index.js');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function analyzeCSVWithAI(userPrompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: "system",
                    content: csvAnalysisSystemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing CSV with AI:', error);
        throw error;
    }
}

module.exports = { analyzeCSVWithAI }; 