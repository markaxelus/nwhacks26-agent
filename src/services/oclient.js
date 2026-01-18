/**
 * OpenAI Client Initialization
 */

const OpenAI = require('openai');
const config = require('../../config');

let openaiClient = null;

/**
 * Get or initialize OpenAI client
 * @returns {OpenAI} OpenAI client instance
 */
function getOpenAIClient() {
  if (!openaiClient) {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in .env');
    }

    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: config.openai.timeoutMs || 60000,
      maxRetries: 2
    });

    console.log('[OAClient] OpenAI client initialized');
  }

  return openaiClient;
}

/**
 * Reset client (useful for testing)
 */
function resetClient() {
  openaiClient = null;
}

module.exports = {
  getOpenAIClient,
  resetClient
};
