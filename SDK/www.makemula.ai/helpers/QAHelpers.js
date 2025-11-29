const { OpenAI } = require('openai');
const { uploadJsonToS3, getFile } = require('./S3Helpers');
const { invalidateCache, CLOUDFRONT_DISTRIBUTION_ID } = require('./S3Helpers');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates Q&A content for an article
 * @param {string} textContent - The article's text content
 */
const generateQA = async (textContent) => {
  console.log("calling OpenAI to generate Q and A...");
  const qaResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: 'system',
        content: `
You are an assistant that specializes in generating high-quality Q&A content modeled after Google's "People also ask" (PAA) section.
Your job is to read a web article and return a list of 10 relevant question-and-answer pairs that expand the article's reach by zooming out from its key people, places, events, and themes.

# Step 1: Understand the narrative
Carefully identify the main elements of the article, including:

Who: main individuals or groups (e.g. a featured artist, actor, founder, etc.)

What: the central subject, project, product, or storyline

Where: notable locations, festivals, companies, platforms

Why: motivations, goals, or emotional or cultural context (e.g. genre, movement, trend)

#Step 2: Generate questions
Write 10 questions that:

Are contextually relevant, but do not repeat specific facts from the article.

Are focused around the people, places, or topics involved, but do not repeat specific facts from the article.

Are professional, pithy, and enticing, max 80 characters.

Could spark curiosity in someone skimming a search results page.

Might lead the reader to explore a broader topic connected to the article's protagonist, setting, or themes.

# Step 3: Write thoughtful answers

Each answer should be 1–2 paragraphs of factual, insightful content

Match the tone and voice of the original article (e.g. casual, cerebral, stylish, etc.)

Do not make up information. All content must be rooted in real, verifiable knowledge

Output format:
Respond only with a JSON object like this:

{
  qa: [
    {      
      "q": "Why are horror films thriving at Sundance?",
      "a": "Horror has become an unexpected force in the indie film scene, and Sundance has emerged as a fertile ground for the genre's evolution. The festival's openness to risk-taking filmmakers has allowed horror to break free from its B-movie stigma and embrace themes ranging from grief and identity to politics and culture. Audiences and critics alike are increasingly drawn to horror's ability to channel real-world anxieties through visceral storytelling."
    }
  ]
}
`,
      },
      {
        role: 'user',
        content: `
Generate 10 factual questions and their corresponding answers contextually relevant to the given article grist. 
Return a JSON array where each object has a q and an a property with the question and answer, respectively.\n\n-----\n\
Article Grist:\n${textContent}\n`,
      },
    ],
  });
  return JSON.parse(qaResponse.choices[0].message.content);
};

/**
 * Creates Q&A content for an article
 * @param {string} url - The URL of the article
 * @param {Object} urls - Object containing all the URLs for saving results
 * @param {Object} options - Additional options for QA creation
 */
const createQA = async (url, urls, options = {}) => {
  try {
    const { qaResultsUrl, readabilityUrl } = urls;
    
    // Get readability results
    const readabilityResponse = await getFile(readabilityUrl);
    if (!readabilityResponse.ok) {
      throw new Error('No readability results found');
    }
    const readability = await readabilityResponse.json();
    const textContent = readability.textContent;

    // Check if QA already exists
    const qaResponse = await getFile(qaResultsUrl);
    let qa;
    if (qaResponse.ok && !options.forceRefresh) {
      qa = await qaResponse.json();
    }

    // Generate new QA if needed
    if (!qa) {
      qa = await generateQA(textContent);
      await uploadJsonToS3(qaResultsUrl, qa);
    }

    // Clear cache if requested
    if (options.clearCache && process.env.NODE_ENV !== "development") {
      await invalidateCache(CLOUDFRONT_DISTRIBUTION_ID, qaResultsUrl);
    }

    return qa;
  } catch (error) {
    console.error('Error creating QA:', error);
    throw error;
  }
};

module.exports = {
  createQA,
  generateQA,
}; 