const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), debug: true });
console.log('[Config] Loading config. Gemini Key present:', !!process.env.GEMINI_API_KEY, 'Length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);


const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 8192,
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS) || 60000
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    timeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS) || 60000
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini' // 'gemini' or 'openai'
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10
  }
};


if (!config.gemini.apiKey && config.ai.provider === 'gemini') {
  console.error('ERROR: GEMINI_API_KEY is required in .env file for Gemini provider');
  if (config.server.nodeEnv !== 'test') {
    process.exit(1);
  }
}

if (!config.openai.apiKey && config.ai.provider === 'openai') {
  console.error('ERROR: OPENAI_API_KEY is required in .env file for OpenAI provider');
  if (config.server.nodeEnv !== 'test') {
    process.exit(1);
  }
}

module.exports = config;
