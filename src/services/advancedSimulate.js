/**
 * Advanced Simulation Routes - Rich Archetype-Based Simulation
 *
 * Endpoint: POST /api/simulate/advanced
 *
 * Uses context-rich prompts, batch processing, and enhanced memory system
 */

const express = require('express');
const Joi = require('joi');
const { processBatchedSimulation } = require('./batchProcessor');
const { simulationRateLimiter } = require('../middleware/rateLimiter');
const { getEnhancedMemoryState } = require('./enhancedMemory');
const { generateInsight } = require('./gemini');

const router = express.Router();

/**
 * Request validation schema for advanced simulation
 */
const advancedSimulationSchema = Joi.object({
  employees: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      rate: Joi.number(),
      hours: Joi.number()
    })
  ).optional(),
  competitors: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required(),
      x: Joi.number().required(),
      y: Joi.number().required()
    })
  ).optional(),
  marketingTactics: Joi.array().items(Joi.string()).optional(),
  productChanges: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
  price: Joi.number().positive().optional(),
  quality: Joi.number().min(1).max(10).optional(),
  event: Joi.string().min(1).max(200).optional(),
  turnNumber: Joi.number().integer().min(1).optional().default(1)
});

/**
 * POST /api/simulate/advanced
 * Run advanced archetype-based simulation with batching
 */
router.post('/', simulationRateLimiter, async (req, res) => {
  try {
    // Validate request
    const { error, value } = advancedSimulationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { employees, competitors, marketingTactics, productChanges, price, quality, event, turnNumber } = value;

    // Derived context if direct parameters are missing
    let derivedPrice = price;
    if (!derivedPrice && productChanges) {
      const prices = Object.values(productChanges);
      if (prices.length > 0) derivedPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    }
    derivedPrice = derivedPrice || 5.0; // Default fallback

    let derivedQuality = quality;
    if (!derivedQuality && employees) {
      const totalHours = employees.reduce((acc, emp) => acc + emp.hours, 0);
      // Baseline 40 hours = 5/10. Every 10 hours add 1.
      derivedQuality = Math.min(10, Math.max(1, 5 + Math.floor((totalHours - 40) / 10)));
    }
    derivedQuality = derivedQuality || 5; // Default fallback

    let derivedEvent = event;
    if (!derivedEvent && marketingTactics && marketingTactics.length > 0) {
      derivedEvent = marketingTactics.join(", ");
    }
    derivedEvent = derivedEvent || "Regular Business Day";

    console.log(`[AdvancedAPI] Turn ${turnNumber}: price=$${derivedPrice.toFixed(2)}, quality=${derivedQuality}/10, event="${derivedEvent}"`);

    const startTime = Date.now();

    // Pass rich business context
    const businessState = {
      employees: employees || [],
      competitors: competitors || [],
      marketingTactics: marketingTactics || [],
      productChanges: productChanges || {}
    };

    // Run batched simulation
    const result = await processBatchedSimulation(derivedPrice, derivedQuality, derivedEvent, turnNumber, businessState);

    const duration = Date.now() - startTime;

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Simulation failed',
        details: result.error || 'Unknown error'
      });
    }

    // Calculate enhanced statistics
    const emotionBreakdown = {};
    const pricePerceptionBreakdown = {};
    const trustDistribution = { low: 0, medium: 0, high: 0 };

    // Map ID to Competitor for easy lookup
    const competitorMap = new Map();
    if (employees || competitors) { // Ensure we have scope
      if (businessState.competitors) {
        businessState.competitors.forEach(c => competitorMap.set(c.id, c));
      }
    }

    for (const personaResult of result.results) {
      // Skip personas that failed
      if (personaResult.error) continue;

      // --- SPATIAL LOGIC ---
      personaResult.position = calculatePosition(
        personaResult.decision,
        personaResult.targetId,
        personaResult.emotion,
        competitorMap
      );

      // Emotion breakdown
      emotionBreakdown[personaResult.emotion] = (emotionBreakdown[personaResult.emotion] || 0) + 1;

      // Price perception breakdown
      pricePerceptionBreakdown[personaResult.pricePerception] = (pricePerceptionBreakdown[personaResult.pricePerception] || 0) + 1;

      // Trust distribution
      const trust = personaResult.context ? personaResult.context.trust : 50;
      if (trust < 50) trustDistribution.low++;
      else if (trust < 80) trustDistribution.medium++;
      else trustDistribution.high++;
    }

    // Get memory states for additional insights
    const permanentlyGoneCount = Array.from({ length: 20 }, (_, i) => i + 1)
      .map(id => getEnhancedMemoryState(id))
      .filter(state => state.flags.isPermanentlyGone).length;

    const onLastChanceCount = Array.from({ length: 20 }, (_, i) => i + 1)
      .map(id => getEnhancedMemoryState(id))
      .filter(state => state.flags.isOnLastChance).length;

    const hasRoutineCount = Array.from({ length: 20 }, (_, i) => i + 1)
      .map(id => getEnhancedMemoryState(id))
      .filter(state => state.experienceTracking.hasRoutine).length;

    // Market mood label
    const marketMoodLabel = getMarketMoodLabel(result.momentum);

    // Generate AI Summary & Insights
    let aiInsight = "Detailed insights not available.";
    try {
      console.log(`[AdvancedAPI] Generating AI insights...`);
      // We pass the full results to let Gemini analyze the reasonings
      aiInsight = await generateInsight(result.results, result.summary, businessState);
    } catch (err) {
      console.error("[AdvancedAPI] Insight generation failed:", err);
    }

    // Build response
    const response = {
      success: true,
      turnNumber,
      aiInsight, // High-level executive summary
      simulation: {
        price: derivedPrice,
        quality: derivedQuality,
        event: derivedEvent,
        timestamp: result.metadata.timestamp,
        duration: `${duration}ms`,
        personasAnalyzed: result.summary.totalPersonas,
        results: result.results
      },
      summary: {
        ...result.summary,
        emotionBreakdown,
        pricePerceptionBreakdown,
        trustDistribution
      },
      momentum: {
        ...result.momentum,
        marketMood: marketMoodLabel
      },
      archetypeInsights: result.archetypeBreakdown,
      brandHealth: {
        permanentlyGone: permanentlyGoneCount,
        onLastChance: onLastChanceCount,
        hasRoutine: hasRoutineCount,
        averageTrust: Object.values(trustDistribution).reduce((sum, count, idx) => {
          const trustValue = idx === 0 ? 25 : idx === 1 ? 65 : 90;
          return sum + (trustValue * count);
        }, 0) / result.summary.totalPersonas
      },
      metadata: {
        batchSize: 10,
        batchesProcessed: result.metadata.batchesProcessed,
        aiProvider: result.metadata.aiProvider || 'openai',
        systemVersion: 'Phase 4 - Advanced Archetype System'
      }
    };

    console.log(`[AdvancedAPI] Completed in ${duration}ms: ${result.summary.buyCount} buy, ${result.summary.skipCount} skip, ${result.summary.switchCount} switch`);
    console.log(`[AdvancedAPI] Market mood: ${marketMoodLabel}, Brand health: ${permanentlyGoneCount} permanently gone, ${onLastChanceCount} on last chance`);

    res.status(200).json(response);

  } catch (error) {
    console.error('[AdvancedAPI] Unexpected error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Helper function to get market mood label
 */
function getMarketMoodLabel(momentum) {
  if (momentum.leaving >= 0.7) return 'Brand Crisis';
  if (momentum.leaving >= 0.5) return 'Mass Exodus';
  if (momentum.leaving >= 0.3) return 'Resentful';
  if (momentum.staying >= 0.8) return 'Viral Hype';
  if (momentum.staying >= 0.6) return 'FOMO Wave';
  if (momentum.staying >= 0.55) return 'Optimistic';
  if (momentum.leaving >= 0.55) return 'Skeptical';
  return 'Balanced';
}

/**
 * Calculate spatial position on 100x100 canvas (x: -50 to 50, y: -50 to 50)
 */
function calculatePosition(decision, targetId, emotion, competitorMap) {
  const getRandomOffset = (radius) => {
    const r = Math.random() * radius;
    const theta = Math.random() * 2 * Math.PI;
    return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta)
    };
  };

  // Case 1: BUY -> Go to Home (0,0) with tight cluster
  if (decision === 'Buy') {
    const offset = getRandomOffset(15); // Within 15px
    return { x: offset.x, y: offset.y };
  }

  // Case 2: SWITCH -> Go to Competitor
  if (decision === 'Switch' && targetId && competitorMap.has(targetId)) {
    const comp = competitorMap.get(targetId);
    const offset = getRandomOffset(15); // Within 15px of competitor
    return {
      x: comp.x + offset.x,
      y: comp.y + offset.y
    };
  }

  // Case 3: SKIP -> "Halfway" or "Middle of nowhere"
  // Neutral/Satisfied but skipped -> Loitering nearby (20-35px)
  // Angry/Frustrated -> Leaving far away (40-50px)
  const isAngry = ['frustrated', 'angry', 'betrayed', 'annoyed'].includes(emotion?.toLowerCase());

  if (isAngry) {
    // Edge of canvas (40-50px radius)
    const r = 40 + Math.random() * 10;
    const theta = Math.random() * 2 * Math.PI;
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
  } else {
    // "Halfway" / Loitering (20-35px radius)
    const r = 20 + Math.random() * 15;
    const theta = Math.random() * 2 * Math.PI;
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
  }
}

/**
 * GET /api/simulate/advanced/memory/:personaId
 * Get detailed memory state for a specific persona
 */
router.get('/memory/:personaId', (req, res) => {
  try {
    const personaId = parseInt(req.params.personaId);

    if (isNaN(personaId) || personaId < 1 || personaId > 20) {
      return res.status(400).json({
        success: false,
        error: 'Invalid persona ID. Must be between 1 and 20.'
      });
    }

    const memoryState = getEnhancedMemoryState(personaId);

    res.status(200).json({
      success: true,
      personaId,
      memory: memoryState
    });

  } catch (error) {
    console.error('[AdvancedAPI] Error fetching memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memory state',
      message: error.message
    });
  }
});

module.exports = router;

