const { getAllPersonas } = require('./persona');
const { getMemoryState, applyTrustModifier, checkGrudgeEffect } = require('./memory');


function buildBatchPrompt(price, event, options = {}) {
  const { includeMemory = true, requestChainOfThought = true } = options;
  const personas = getAllPersonas();

  // Compress persona data with memory/trust state
  const compressedPersonas = personas.map(p => {
    const baseData = {
      id: p.id,
      n: p.name,
      a: p.age,
      i: p.income,
      b: p.shoppingBehavior,
      s: p.priceSensitivity,
      e: p.preferredEvents
    };

    // Add memory and trust data if enabled
    if (includeMemory) {
      const memory = getMemoryState(p.id);
      const trustAdjustment = applyTrustModifier(p.id, p.priceSensitivity);
      const grudge = checkGrudgeEffect(p.id);

      baseData.t = memory.trust_score; // trust score (0-100)
      baseData.sa = trustAdjustment.adjustedSensitivity; // sensitivity adjusted by trust
      baseData.g = grudge.hasGrudge ? 1 : 0; // has grudge flag
      baseData.pb = memory.lifetime_stats.total_buys; // past buys
      baseData.ps = memory.lifetime_stats.total_skips; // past skips
    }

    return baseData;
  });

  // Build legend for compressed fields
  let legend = 'Legend: id=personaId, n=name, a=age, i=income, b=shoppingBehavior, s=priceSensitivity, e=preferredEvents';
  if (includeMemory) {
    legend += ', t=trust_score(0-100), sa=sensitivity_adjusted, g=hasGrudge(0/1), pb=pastBuys, ps=pastSkips';
  }

  // Chain of thought instruction
  const cotInstruction = requestChainOfThought ?
    `4. chainOfThought (string, max 150 chars): Step-by-step reasoning process (for top 10 most influential decisions only, otherwise omit this field)` :
    '';

  const memoryGuidance = includeMemory ?
    `- Trust score (t): 0-100 scale. Low trust (<60) means persona is more skeptical due to past negative experiences
- Adjusted sensitivity (sa): Price sensitivity modified by trust. Low trust increases sensitivity
- Grudge flag (g): 1 if persona experienced recent disappointment, making them less likely to buy
- Past behavior (pb/ps): Historical buy/skip count - personas with many past skips are more cautious

MEMORY & TRUST MODELING:
You are a social psychologist studying consumer trust dynamics. Personas with low trust scores have been "burned" before:
- They remember price hikes, broken promises, disappointing products
- Even if the current price is good, their trust erosion makes them skeptical
- A persona with trust=30 will be MUCH more price-sensitive than trust=100
- Grudges persist - you can't instantly win back a customer who lost faith` :
    '';

  const prompt = `You are simulating the purchasing decisions of 50 diverse consumer personas with EPISODIC MEMORY.

SIMULATION CONTEXT:
- Product Price: $${price}
- Marketing Event: "${event}"

PERSONAS (compressed format with memory state):
${JSON.stringify(compressedPersonas, null, 0)}

${legend}

${memoryGuidance}

TASK:
For each persona (1-50), determine:
1. willBuy (boolean): Will this persona purchase at the given price during this event?
2. confidence (float 0-1): How confident are you in this prediction?
3. reasoning (string, max 100 chars): Brief explanation of the decision
${cotInstruction}

Consider each persona's:
- Income level vs. product price
- **Trust score and adjusted price sensitivity** (low trust = higher sensitivity)
- **Grudge effect** (recent negative experiences create lasting skepticism)
- **Past behavior patterns** (history of buys vs. skips)
- Shopping behavior patterns
- Affinity for the event type (match preferredEvents array)
- Age and lifestyle factors

CRITICAL OUTPUT REQUIREMENTS:
1. Return VALID JSON ONLY - no markdown, no code blocks, no extra text
2. Must be a JSON array with exactly 50 objects
3. Each object must have: personaId, willBuy, confidence, reasoning${requestChainOfThought ? ', chainOfThought (top 10 only)' : ''}
4. Order by personaId (1-50)
5. **Respect trust scores** - personas with trust <50 should rarely buy unless price is exceptional

Example format (first 2 personas):
[
  {
    "personaId": 1,
    "willBuy": true,
    "confidence": 0.85,
    "reasoning": "Budget-conscious, excited by sales events, price within reach, trust still high"${requestChainOfThought ? `,
    "chainOfThought": "Income $35k, price $${price}. Trust=100 (no grudges). Event matches preferredEvents. Affordable = BUY"` : ''}
  },
  {
    "personaId": 2,
    "willBuy": false,
    "confidence": 0.72,
    "reasoning": "Very high price sensitivity, low trust from past disappointments"
  }
]

Provide predictions for all 50 personas now:`;

  return prompt;
}

/**
 * Estimate token count for a prompt (rough approximation)
 * @param {string} prompt - The prompt text
 * @returns {number} Estimated token count
 */
function estimateTokens(prompt) {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(prompt.length / 4);
}

/**
 * Validate prompt parameters
 * @param {number} price - Product price
 * @param {string} event - Marketing event
 * @throws {Error} If validation fails
 */
function validatePromptParams(price, event) {
  if (typeof price !== 'number' || price <= 0) {
    throw new Error('Price must be a positive number');
  }

  if (typeof event !== 'string' || event.trim().length === 0) {
    throw new Error('Event must be a non-empty string');
  }

  if (event.length > 200) {
    throw new Error('Event description too long (max 200 characters)');
  }
}

/**
 * Build and validate a batch prompt
 * @param {number} price - Product price
 * @param {string} event - Marketing event
 * @returns {Object} { prompt, estimatedTokens }
 */
function buildAndValidate(price, event) {
  validatePromptParams(price, event);
  const prompt = buildBatchPrompt(price, event);
  const estimatedTokens = estimateTokens(prompt);

  return {
    prompt,
    estimatedTokens
  };
}

module.exports = {
  buildBatchPrompt,
  estimateTokens,
  validatePromptParams,
  buildAndValidate
};
