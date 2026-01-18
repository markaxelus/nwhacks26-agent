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
  /**
   * Build context message for OpenAI Agent
   */
  buildContextMessage(persona, context, price, quality, marketMomentum, event, businessState = {}) {
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

    // --- NEW: BUSINESS & MARKET DATA ---
    let staffingContext = '';
    if (businessState.employees && businessState.employees.length > 0) {
      const totalHours = businessState.employees.reduce((sum, e) => sum + e.hours, 0);
      const staffNames = businessState.employees.map(e => e.name).join(', ');
      staffingContext = `
Staffing Level:
- Staff on shift: ${staffNames}
- Service Capacity: ${totalHours} hrs (Speed: ${totalHours > 80 ? 'Very Fast' : totalHours >= 40 ? 'Standard' : 'Slow/Understaffed'})`;
    }

    let menuContext = '';
    if (businessState.productChanges && Object.keys(businessState.productChanges).length > 0) {
      menuContext = `
Current Menu Prices:
${Object.entries(businessState.productChanges).map(([item, p]) => `- ${item}: $${p}`).join('\n')}`;
    }

    let marketingContext = '';
    if (businessState.marketingTactics && businessState.marketingTactics.length > 0) {
      marketingContext = `
Active Promotions:
- ${businessState.marketingTactics.join('\n- ')}`;
    }

    // Full message (Layer 3: Dynamic Context)
    return `### DYNAMIC SITUATION UPDATE
Current Context:
- Average Price Indicator: $${price.toFixed(2)}
- Your budget remaining: $${context.financial.budgetRemaining.toFixed(2)}
- Your current mood: ${context.emotional.currentMood}
- Time pressure: ${context.temporal.isRushing ? 'RUSHING' : 'relaxed'}
- Current Event: ${event || 'Normal business hours'}

Business Updates:
${staffingContext || '- Standard staffing levels.'}
${menuContext || '- Standard menu pricing.'}
${marketingContext || '- No active promotions.'}

Market Momentum (Social Signal):
${momentumContext || '- No clear trend yet.'}

History & Memory:
- Trust in this brand: ${memoryState.trust_score}/100
${historyContext}${warningContext}${routineContext}

Behavioral Constraints (Internal Stats):
- Price sensitivity: ${(persona.priceSensitivity * 100).toFixed(0)}%
- Brand loyalty: ${(persona.brandLoyalty * 100).toFixed(0)}%
- Social influence: ${(persona.socialInfluenceWeight * 100).toFixed(0)}%
- Quality focus: ${(persona.qualityThreshold * 100).toFixed(0)}%
- Effective price sensitivity (this turn): ${(context.effectivePriceSensitivity * 100).toFixed(0)}%
${context.decisionContext.pricePerception ? `- Price feels: ${context.decisionContext.pricePerception.perception}` : ''}

Decide: Buy, Skip, or Switch.`;
  }

  /**
   * Simulate a single persona decision
   * @param {Object} persona - Persona instance
   * @param {Object} context - Generated context (from contextGenerator)
   * @param {number} price - Current price
   * @param {number} quality - Current quality
   * @param {Object|null} marketMomentum - Market momentum data
   * @param {number} turnNumber - Current turn number
   * @param {string} event - Current event description
   * @param {Object} businessState - NEW: Rich business context
   * @returns {Promise<Object>} Decision result
   */
  async simulatePersona(persona, context, price, quality, marketMomentum, turnNumber, event, businessState = {}) {
    try {
      const memoryState = getEnhancedMemoryState(persona.id);
      // Get the agent ID for this persona (1:1 mapping now)
      const agentId = getAgentIdForPersona(persona.id);

      // Get or create persistent thread for this persona
      const threadId = await getOrCreateThread(persona.id);

      // Build context message
      const message = this.buildContextMessage(persona, context, price, quality, marketMomentum, event, businessState);

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
        personaDetails: {
          backstory: persona.description,
          quirks: persona.quirks,
          stats: {
            priceSensitivity: persona.priceSensitivity,
            brandLoyalty: persona.brandLoyalty,
            socialInfluence: persona.socialInfluenceWeight,
            qualityFocus: persona.qualityThreshold
          }
        },
        context: {
          mood: context.emotional.currentMood,
          budgetRemaining: context.financial.budgetRemaining,
          trust: memoryState.trust_score
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
