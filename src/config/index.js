require('dotenv').config();

const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 8192,
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS) || 60000
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  }
};


if (!config.gemini.apiKey) {
  console.error('ERROR: GEMINI_API_KEY is required in .env file');
  if (config.server.nodeEnv !== 'test') {
    process.exit(1);
  }
}

module.exports = config;
