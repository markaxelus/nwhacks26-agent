/**
 * Batch Processor - Process Personas in Waves with Market Momentum
 *
 * Processes personas in batches of 10-15, calculating market momentum
 * after each batch and applying social pressure to subsequent batches.
 *
 * Now supports multiple AI providers (Gemini, OpenAI) via provider abstraction.
 */

const config = require('../config');
const { getProvider } = require('./providerFactory');
const { OPENAI_PERSONAS } = require('./oPersonas');
const { generateCompleteContext, calculateEffectivePriceSensitivity } = require('./contextGenerator');
const { getEnhancedMemoryState, recordVisit, updateTrustWithEmotion } = require('./enhancedMemory');

const BATCH_SIZE = 3; // Process 3 personas at a time to avoid rate limits

/**
 * Calculate market momentum from processed results
 */
function calculateMarketMomentum(results) {
  const total = results.length;
  if (total === 0) {
    return { leaving: 0, staying: 0, switching: 0 };
  }

  const buyCount = results.filter(r => r.decision === 'Buy').length;
  const skipCount = results.filter(r => r.decision === 'Skip').length;
  const switchCount = results.filter(r => r.decision === 'Switch').length;

  return {
    leaving: (skipCount + switchCount) / total,
    staying: buyCount / total,
    switching: switchCount / total,
    mood: skipCount + switchCount > total * 0.5 ? 'mass_exit' : buyCount > total * 0.6 ? 'mass_adoption' : 'neutral'
  };
}

/**
 * Apply social pressure to persona's price sensitivity
 */
function applySocialPressure(persona, baseSensitivity, momentum) {
  const socialWeight = persona.socialInfluenceWeight;

  // If leaving > 30%, increase price sensitivity
  if (momentum.leaving > 0.3) {
    const pressureIncrease = (momentum.leaving - 0.3) * socialWeight * 0.5;
    return Math.min(1.0, baseSensitivity + pressureIncrease);
  }

  // If mass adoption (>60% buying), decrease price sensitivity (FOMO)
  if (momentum.staying > 0.6) {
    const fomoDecrease = (momentum.staying - 0.6) * socialWeight * 0.3;
    return Math.max(0, baseSensitivity - fomoDecrease);
  }

  return baseSensitivity;
}


/**
 * Process all personas in batches
 */
async function processBatchedSimulation(price, quality, event, turnNumber = 1, businessState = {}) {
  console.log(`[BatchProcessor] Starting batched simulation for turn ${turnNumber}`);
  console.log(`[BatchProcessor] Price: $${price}, Quality: ${quality}/10, Event: "${event}"`);

  // Get AI provider (Gemini or OpenAI based on config)
  const provider = getProvider();
  console.log(`[BatchProcessor] Using AI provider: ${provider.getName()}`);

  // Determine what personas to use
  // We use the same 20 personas for both providers now for consistency
  const personasToRun = OPENAI_PERSONAS;

  const allResults = [];
  let currentMomentum = null;

  // Shuffle to avoid clustering
  const shuffledPersonas = [...personasToRun].sort(() => Math.random() - 0.5);

  // Process in batches
  const batchCount = Math.ceil(shuffledPersonas.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, shuffledPersonas.length);
    const batchPersonas = shuffledPersonas.slice(batchStart, batchEnd);

    console.log(`[BatchProcessor] Processing batch ${batchIndex + 1}/${batchCount} (${batchPersonas.length} personas)`);

    // Process batch in parallel
    const batchPromises = batchPersonas.map(async (persona) => {
      // Generate dynamic context for this persona
      const memoryState = getEnhancedMemoryState(persona.id);
      const context = generateCompleteContext(persona, memoryState, turnNumber, event);

      // Calculate effective price sensitivity
      const baseSensitivity = calculateEffectivePriceSensitivity(persona, context, memoryState);

      // Apply social pressure from previous batches
      const adjustedSensitivity = currentMomentum
        ? applySocialPressure(persona, baseSensitivity, currentMomentum)
        : baseSensitivity;

      context.effectivePriceSensitivity = adjustedSensitivity;

      // Add decision context (visit history, price perception, etc.) for OpenAI provider
      const { getDecisionContext } = require('./enhancedMemory');
      context.decisionContext = getDecisionContext(persona.id, price);

      // Process persona using provider abstraction with business state
      return provider.simulatePersona(persona, context, price, quality, currentMomentum, turnNumber, event, businessState);
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    allResults.push(...batchResults);

    // Update market momentum for next batch
    currentMomentum = calculateMarketMomentum(allResults);

    console.log(`[BatchProcessor] Batch ${batchIndex + 1} complete. Current momentum: ${(currentMomentum.leaving * 100).toFixed(0)}% leaving, ${(currentMomentum.staying * 100).toFixed(0)}% staying`);
  }

  // Record all visits and update memory
  for (const result of allResults) {
    if (!result.error) {
      recordVisit(result.personaId, {
        turnNumber,
        decision: result.decision,
        price,
        quality,
        emotion: result.emotion,
        reasoning: result.reasoning
      });

      updateTrustWithEmotion(result.personaId, result.emotion, `${event} - ${result.decision}`, result.reasoning);
    }
  }

  // Final momentum calculation
  const finalMomentum = calculateMarketMomentum(allResults);

  // Calculate statistics
  const buyCount = allResults.filter(r => r.decision === 'Buy').length;
  const skipCount = allResults.filter(r => r.decision === 'Skip').length;
  const switchCount = allResults.filter(r => r.decision === 'Switch').length;

  // Archetype breakdown
  const archetypeBreakdown = {};
  for (const result of allResults) {
    if (!archetypeBreakdown[result.archetype]) {
      archetypeBreakdown[result.archetype] = { buy: 0, skip: 0, switch: 0, total: 0 };
    }
    archetypeBreakdown[result.archetype].total++;
    if (result.decision === 'Buy') archetypeBreakdown[result.archetype].buy++;
    if (result.decision === 'Skip') archetypeBreakdown[result.archetype].skip++;
    if (result.decision === 'Switch') archetypeBreakdown[result.archetype].switch++;
  }

  console.log(`[BatchProcessor] Simulation complete: ${buyCount} buy, ${skipCount} skip, ${switchCount} switch`);

  return {
    success: true,
    turnNumber,
    results: allResults,
    summary: {
      totalPersonas: allResults.length,
      buyCount,
      skipCount,
      switchCount,
      buyRate: buyCount / allResults.length,
      skipRate: skipCount / allResults.length,
      switchRate: switchCount / allResults.length
    },
    momentum: finalMomentum,
    archetypeBreakdown,
    metadata: {
      price,
      quality,
      event,
      timestamp: new Date().toISOString(),
      batchesProcessed: batchCount,
      aiProvider: provider.getName() // Track which AI provider was used
    }
  };
}

module.exports = {
  processBatchedSimulation,
  calculateMarketMomentum,
  applySocialPressure,
  BATCH_SIZE
};
