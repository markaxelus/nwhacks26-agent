const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { getEnhancedMemoryState } = require('./enhancedMemory');

class GeminiProvider {
  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error('Gemini API key not configured');
    }
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    console.log('[GeminiProvider] Initialized with Google Gemini API');
  }

  /**
   * Build prompt for Gemini
   */
  buildPrompt(persona, context, price, quality, marketMomentum) {
    const memoryState = getEnhancedMemoryState(persona.id);

    // Build market momentum context
    let momentumContext = '';
    if (marketMomentum) {
      momentumContext = `
Market Momentum (what others are doing):
- ${(marketMomentum.leaving * 100).toFixed(0)}% of people are leaving/switching
- ${(marketMomentum.staying * 100).toFixed(0)}% of people are buying
- Overall mood: ${marketMomentum.mood || 'neutral'}`;
    }

    return `You are simulating a persona making a purchasing decision.

PERSONA: ${persona.name} (${persona.archetype})
Traits: Price Sensitivity: ${persona.priceSensitivity}, Brand Loyalty: ${persona.brandLoyalty}, Social Influence: ${persona.socialInfluenceWeight}

CURRENT CONTEXT:
- Mood: ${context.emotional.currentMood} (${context.emotional.moodReason})
- Situation: ${context.temporal.dayOfWeek} ${context.temporal.timeOfDay}, ${context.temporal.isRushing ? 'Rushing' : 'Relaxed'}
- Financial: Budget remaining: $${context.financial.budgetRemaining}, Budget tightness: ${context.financial.budgetTightness}
- Situational: With friends: ${context.situational.withFriends}, Quality expectation: ${context.situational.qualityExpectation}/10
- Trust: ${memoryState.trust_score}/100
${momentumContext}

OFFER:
- Price: $${price.toFixed(2)}
- Quality: ${quality}/10

Make a decision (Buy, Skip, or Switch) and respond with ONLY valid JSON:
{
  "decision": "Buy" | "Skip" | "Switch",
  "reasoning": "1-2 sentence thought process",
  "emotion": "satisfied" | "frustrated" | "neutral" | "happy" | "anxious",
  "pricePerception": "cheap" | "fair" | "expensive" | "outrageous"
}`;
  }

  async simulatePersona(persona, context, price, quality, marketMomentum, turnNumber) {
    try {
      const model = this.genAI.getGenerativeModel({ model: config.gemini.model });
      const prompt = this.buildPrompt(persona, context, price, quality, marketMomentum);
      const memoryState = getEnhancedMemoryState(persona.id);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean JSON
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const decision = JSON.parse(text);

      return {
        personaId: persona.id,
        personaName: persona.name,
        archetype: persona.archetype,
        ...decision,
        context: {
          mood: context.emotional.currentMood,
          budgetRemaining: context.financial.budgetRemaining,
          trust: memoryState.trust_score
        }
      };
    } catch (error) {
      console.error(`[GeminiProvider] Error for persona ${persona.id}:`, error.message);
      return {
        personaId: persona.id,
        decision: 'Skip',
        reasoning: `Error: ${error.message}`,
        emotion: 'neutral',
        error: true
      };
    }
  }

  getName() {
    return 'gemini';
  }
}

async function runAgent(prompt) {
  const provider = new GeminiProvider();
  const model = provider.genAI.getGenerativeModel({ model: config.gemini.model });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { GeminiProvider, runAgent };
