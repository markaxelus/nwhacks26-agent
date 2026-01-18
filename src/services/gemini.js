const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

async function runAgent(prompt) {
  const model = genAI.getGenerativeModel({ model: config.gemini.model });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { runAgent };
