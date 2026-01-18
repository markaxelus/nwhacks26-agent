/**
 * Provider Factory - Selects AI provider based on configuration
 */

const config = require('../config');

/**
 * Get the configured AI provider instance
 * @returns {Object} Provider instance (GeminiProvider or OpenAIProvider)
 */
function getProvider() {
  const providerType = config.ai.provider || 'gemini';

  if (providerType === 'openai') {
    const OpenAIProvider = require('./oProvider');
    return new OpenAIProvider();
  } else if (providerType === 'gemini') {
    const { GeminiProvider } = require('./gemini');
    return new GeminiProvider();
  } else {
    throw new Error(`Unknown AI provider: ${providerType}. Use 'gemini' or 'openai'`);
  }
}

module.exports = { getProvider };
