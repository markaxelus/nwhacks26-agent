const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

async function runAgent(prompt) {
  const model = genAI.getGenerativeModel({ model: config.gemini.model });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate executive summary and insights based on simulation results
 */
async function generateInsight(results, summary, businessState) {
  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.model });

    // Extract reasonings (limit to 20 to fit context if needed, though Gemini 1.5 has large context)
    const reasonings = results.map(r => `"${r.personaName}" (${r.decision}): ${r.reasoning}`).join('\n');

    const marketingText = businessState.marketingTactics && businessState.marketingTactics.length > 0
      ? businessState.marketingTactics.join(', ')
      : "None";

    const prompt = `
    Analyze this coffee shop simulation run.
    
    CONTEXT:
    - Marketing Tactics: ${marketingText}
    - Staffing: ${businessState.employees ? businessState.employees.length + ' employees' : 'Standard'}
    - Results: ${summary.buyCount} Buys, ${summary.skipCount} Skips, ${summary.switchCount} Switches.
    
    CUSTOMER FEEDBACK:
    ${reasonings}

    TASK:
    Provide a concise 5-sentence executive summary.
    1. Summarize general customer sentiment.
    2. SPECIFICALLY analyze the marketing tactics (e.g., "${marketingText}"). Did they drive traffic? Did customers mention them? 
    3. Evaluate the business impact: Did the volume increase justify the discount/cost? (e.g., "While margins are lower per unit, the volume increase suggests higher total profit" or "The discount failed to attract enough new customers to offset the cost").
    
    Keep it professional and insight-driven.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    const fs = require('fs');
    fs.appendFileSync('gemini_errors.log', `${new Date().toISOString()} - [Gemini Error] ${error.message}\n${error.stack}\n\n`);
    console.error("[Gemini] Error generating insight:", error.message);
    return "Unable to generate insights at this time. Check gemini_errors.log for details.";
  }
}

module.exports = { runAgent, generateInsight };
