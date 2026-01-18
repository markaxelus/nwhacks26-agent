/**
 * OpenAI Provider - Uses OpenAI Agents API with persistent threads
 *
 * Maps 50 personas to 20 unique OpenAI Agents using modulo operation.
 * Each persona gets its own thread for conversation history.
 */

const config = require('../config');
const { getEnhancedMemoryState } = require('./enhancedMemory');
const { getAgentIdForPersona } = require('./oAgents');
const { getOrCreateThread, sendMessageAndRun } = require('./oThreadManager');

class OpenAIProvider {
  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    console.log('[OpenAIProvider] Initialized with OpenAI Agents API');
  }

  /**
   * Build context message for OpenAI Agent
   */
  buildContextMessage(persona, context, price, quality, marketMomentum) {
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

    // Build visit history context
    let historyContext = '';
    if (context.decisionContext.visitHistory.length > 0) {
      const recentVisits = context.decisionContext.visitHistory.slice(-3);
      historyContext = `
Your Recent Visits:
${recentVisits.map((v, i) => `  ${i + 1}. ${v.decision} - felt ${v.emotion} (price was $${v.price})`).join('\n')}`;
    } else {
      historyContext = '\nThis is your FIRST visit to this place.';
    }

    // Build warning context
    let warningContext = '';
    if (memoryState.flags.isPermanentlyGone) {
      warningContext = '\n⚠️ YOU ARE DONE WITH THIS PLACE (3 bad experiences). You will NEVER return.';
    } else if (memoryState.flags.isOnLastChance) {
      warningContext = '\n⚠️ ONE MORE BAD EXPERIENCE and you are leaving FOREVER.';
    }

    // Build routine context
    let routineContext = '';
    if (memoryState.experienceTracking.hasRoutine) {
      routineContext = '\n✓ You have a routine here (5+ consecutive good visits).';
    }

    // Full message
    return `You are making a purchasing decision RIGHT NOW.

Current Situation:
- Price: $${price.toFixed(2)}
- Quality: ${quality}/10
- Your current mood: ${context.emotional.currentMood}
- Budget remaining: $${context.financial.budgetRemaining.toFixed(2)}
- Trust in this place: ${memoryState.trust_score}/100
- Time pressure: ${context.temporal.isRushing ? 'RUSHING' : 'relaxed'}
${momentumContext}
${historyContext}${warningContext}${routineContext}

Your Personality Traits:
- Price sensitivity: ${(persona.priceSensitivity * 100).toFixed(0)}%
- Brand loyalty: ${(persona.brandLoyalty * 100).toFixed(0)}%
- Social influence: ${(persona.socialInfluenceWeight * 100).toFixed(0)}%
- Quality focus: ${(persona.qualityThreshold * 100).toFixed(0)}%

Price Perception:
- Your effective price sensitivity right now: ${(context.effectivePriceSensitivity * 100).toFixed(0)}%
${context.decisionContext.pricePerception ? `- Price feels: ${context.decisionContext.pricePerception.perception}` : ''}

Make your decision (Buy, Skip, or Switch) and respond with ONLY valid JSON in this exact format:
{
  "decision": "Buy" | "Skip" | "Switch",
  "reasoning": "your internal thought process in 1-2 sentences",
  "emotion": "satisfied" | "frustrated" | "angry" | "happy" | "neutral" | "anxious",
  "pricePerception": "cheap" | "fair" | "expensive" | "outrageous"
}`;
  }

  /**
   * Simulate a single persona decision
   * @param {Object} persona - Persona instance
   * @param {Object} context - Generated context (from contextGenerator)
   * @param {number} price - Current price
   * @param {number} quality - Current quality
   * @param {Object|null} marketMomentum - Market momentum data
   * @param {number} turnNumber - Current turn number
   * @returns {Promise<Object>} Decision result
   */
  async simulatePersona(persona, context, price, quality, marketMomentum, turnNumber) {
    try {
      // Get the agent ID for this persona (1:1 mapping now)
      const agentId = getAgentIdForPersona(persona.id);

      // Get or create persistent thread for this persona
      const threadId = await getOrCreateThread(persona.id);

      // Build context message
      const message = this.buildContextMessage(persona, context, price, quality, marketMomentum);

      // Send message and run agent
      const decision = await sendMessageAndRun(threadId, agentId, message, persona.id);

      // Validate decision structure
      if (!decision.decision || !['Buy', 'Skip', 'Switch'].includes(decision.decision)) {
        decision.decision = 'Skip';
      }

      return {
        personaId: persona.id,
        personaName: persona.name,
        archetype: persona.archetype,
        ...decision,
        context: {
          mood: context.emotional.currentMood,
          budgetRemaining: context.financial.budgetRemaining,
          isRushing: context.temporal.isRushing,
          trust: getEnhancedMemoryState(persona.id).trust_score
        }
      };

    } catch (error) {
      console.error(`[OpenAIProvider] Error processing persona ${persona.id}:`, error.message);
      return {
        personaId: persona.id,
        personaName: persona.name,
        archetype: persona.archetype,
        decision: 'Skip',
        reasoning: `Error: ${error.message}`,
        emotion: 'neutral',
        pricePerception: 'unknown',
        error: true
      };
    }
  }

  /**
   * Get provider name
   */
  getName() {
    return 'openai';
  }
}

module.exports = OpenAIProvider;
