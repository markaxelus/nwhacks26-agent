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

const router = express.Router();

/**
 * Request validation schema for advanced simulation
 */
const advancedSimulationSchema = Joi.object({
  price: Joi.number().positive().required()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be greater than 0',
      'any.required': 'Price is required'
    }),
  quality: Joi.number().min(1).max(10).required()
    .messages({
      'number.base': 'Quality must be a number',
      'number.min': 'Quality must be between 1 and 10',
      'number.max': 'Quality must be between 1 and 10',
      'any.required': 'Quality is required'
    }),
  event: Joi.string().min(1).max(200).required()
    .messages({
      'string.base': 'Event must be a string',
      'string.empty': 'Event cannot be empty',
      'string.max': 'Event description too long (max 200 characters)',
      'any.required': 'Event is required'
    }),
  turnNumber: Joi.number().integer().min(1).optional().default(1)
    .messages({
      'number.base': 'Turn number must be a number',
      'number.integer': 'Turn number must be an integer',
      'number.min': 'Turn number must be at least 1'
    })
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

    const { price, quality, event, turnNumber } = value;

    console.log(`[AdvancedAPI] Turn ${turnNumber}: price=$${price}, quality=${quality}/10, event="${event}"`);

    const startTime = Date.now();

    // Run batched simulation
    const result = await processBatchedSimulation(price, quality, event, turnNumber);

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

    for (const personaResult of result.results) {
      // Skip personas that failed
      if (personaResult.error) continue;

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
    const permanentlyGoneCount = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(id => getEnhancedMemoryState(id))
      .filter(state => state.flags.isPermanentlyGone).length;

    const onLastChanceCount = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(id => getEnhancedMemoryState(id))
      .filter(state => state.flags.isOnLastChance).length;

    const hasRoutineCount = Array.from({ length: 50 }, (_, i) => i + 1)
      .map(id => getEnhancedMemoryState(id))
      .filter(state => state.experienceTracking.hasRoutine).length;

    // Market mood label
    const marketMoodLabel = getMarketMoodLabel(result.momentum);

    // Build response
    const response = {
      success: true,
      turnNumber,
      simulation: {
        price,
        quality,
        event,
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
        batchSize: 12,
        batchesProcessed: result.metadata.batchesProcessed,
        aiProvider: result.metadata.aiProvider || 'gemini', // Which AI provider was used
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
 * GET /api/simulate/advanced/memory/:personaId
 * Get detailed memory state for a specific persona
 */
router.get('/memory/:personaId', (req, res) => {
  try {
    const personaId = parseInt(req.params.personaId);

    if (isNaN(personaId) || personaId < 1 || personaId > 50) {
      return res.status(400).json({
        success: false,
        error: 'Invalid persona ID. Must be between 1 and 50.'
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
