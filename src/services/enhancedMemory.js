/**
 * Enhanced Memory System - Visit History, Price Anchoring, Habit Formation
 *
 * Extends the basic memory system with:
 * - Visit history tracking
 * - Price anchoring effects
 * - Consecutive frustration tracking
 * - Peak experience memory
 * - Habit formation
 */

const fs = require('fs');
const path = require('path');

const ENHANCED_MEMORY_FILE = path.join(__dirname, '../data/enhanced_persona_memory.json');
const MAX_VISIT_HISTORY = 10;

/**
 * Default enhanced memory state
 */
const DEFAULT_ENHANCED_STATE = {
  trust_score: 100,
  visitHistory: [],
  priceAnchoring: {
    initialPrice: null,
    lastPricePaid: null,
    lowestPriceSeen: null,
    highestPriceSeen: null
  },
  experienceTracking: {
    consecutiveFrustrations: 0,
    consecutiveBuys: 0,
    peakExperience: null,
    hasRoutine: false,
    routineBrokenCount: 0
  },
  competitorKnowledge: {
    discoveredCompetitor: false,
    competitorPrice: null,
    lastSwitchTurn: null
  },
  lifetimeStats: {
    totalVisits: 0,
    totalBuys: 0,
    totalSkips: 0,
    totalSwitches: 0,
    totalSpent: 0,
    timesDisappointed: 0,
    timesDelighted: 0
  },
  flags: {
    isPermanentlyGone: false,
    isOnLastChance: false,
    lastChanceGivenTurn: null
  }
};

/**
 * In-memory cache
 */
let enhancedMemoryCache = {};

/**
 * Initialize enhanced memory system
 */
function initializeEnhancedMemory() {
  try {
    const dataDir = path.dirname(ENHANCED_MEMORY_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(ENHANCED_MEMORY_FILE)) {
      const data = fs.readFileSync(ENHANCED_MEMORY_FILE, 'utf8');
      enhancedMemoryCache = JSON.parse(data);
      console.log('[EnhancedMemory] Loaded existing enhanced memory states');
    } else {
      enhancedMemoryCache = {};
      for (let i = 1; i <= 20; i++) {
        const state = JSON.parse(JSON.stringify(DEFAULT_ENHANCED_STATE));
        // Mix up initial trust (some skeptical, some loyal)
        state.trust_score = Math.floor(Math.random() * 60) + 40; // 40-100 initial trust
        enhancedMemoryCache[i] = state;
      }
      saveEnhancedMemory();
      console.log('[EnhancedMemory] Initialized fresh enhanced memory for 20 personas');
    }
  } catch (error) {
    console.error('[EnhancedMemory] Error initializing:', error.message);
    enhancedMemoryCache = {};
    for (let i = 1; i <= 20; i++) {
      enhancedMemoryCache[i] = JSON.parse(JSON.stringify(DEFAULT_ENHANCED_STATE));
    }
  }
}

/**
 * Save enhanced memory to disk
 */
function saveEnhancedMemory() {
  try {
    fs.writeFileSync(ENHANCED_MEMORY_FILE, JSON.stringify(enhancedMemoryCache, null, 2));
  } catch (error) {
    console.error('[EnhancedMemory] Error saving:', error.message);
  }
}

/**
 * Get enhanced memory state for a persona
 */
function getEnhancedMemoryState(personaId) {
  if (!enhancedMemoryCache[personaId]) {
    enhancedMemoryCache[personaId] = JSON.parse(JSON.stringify(DEFAULT_ENHANCED_STATE));
  }
  return enhancedMemoryCache[personaId];
}

/**
 * Record a visit with full context
 * @param {number} personaId - Persona ID
 * @param {Object} visit - Visit details
 */
function recordVisit(personaId, visit) {
  const state = getEnhancedMemoryState(personaId);
  const { turnNumber, decision, price, quality, emotion, reasoning } = visit;

  // Add to visit history
  state.visitHistory.push({
    turn: turnNumber,
    decision,
    price,
    quality,
    emotion,
    reasoning,
    timestamp: new Date().toISOString()
  });

  // Keep only last N visits
  if (state.visitHistory.length > MAX_VISIT_HISTORY) {
    state.visitHistory = state.visitHistory.slice(-MAX_VISIT_HISTORY);
  }

  // Update lifetime stats
  state.lifetimeStats.totalVisits++;
  if (decision === 'Buy') {
    state.lifetimeStats.totalBuys++;
    state.lifetimeStats.totalSpent += price;
  } else if (decision === 'Skip') {
    state.lifetimeStats.totalSkips++;
  } else if (decision === 'Switch') {
    state.lifetimeStats.totalSwitches++;
    state.competitorKnowledge.discoveredCompetitor = true;
    state.competitorKnowledge.lastSwitchTurn = turnNumber;
  }

  // Update price anchoring
  if (state.priceAnchoring.initialPrice === null) {
    state.priceAnchoring.initialPrice = price;
  }
  if (decision === 'Buy') {
    state.priceAnchoring.lastPricePaid = price;
  }
  if (state.priceAnchoring.lowestPriceSeen === null || price < state.priceAnchoring.lowestPriceSeen) {
    state.priceAnchoring.lowestPriceSeen = price;
  }
  if (state.priceAnchoring.highestPriceSeen === null || price > state.priceAnchoring.highestPriceSeen) {
    state.priceAnchoring.highestPriceSeen = price;
  }

  // Update experience tracking
  const isNegative = ['frustrated', 'angry', 'betrayed'].includes(emotion);
  const isPositive = ['satisfied', 'delighted', 'loyal'].includes(emotion);

  if (isNegative) {
    state.experienceTracking.consecutiveFrustrations++;
    state.experienceTracking.consecutiveBuys = 0;
    state.lifetimeStats.timesDisappointed++;

    // Trigger "I'm done" state after 3 consecutive frustrations
    if (state.experienceTracking.consecutiveFrustrations >= 3) {
      state.flags.isPermanentlyGone = true;
    }

    // "One more chance" logic
    if (state.experienceTracking.consecutiveFrustrations === 2 && !state.flags.isOnLastChance) {
      state.flags.isOnLastChance = true;
      state.flags.lastChanceGivenTurn = turnNumber;
    }
  } else if (isPositive) {
    state.experienceTracking.consecutiveFrustrations = 0;
    state.lifetimeStats.timesDelighted++;

    // Clear "last chance" flag if experience improves
    if (state.flags.isOnLastChance) {
      state.flags.isOnLastChance = false;
    }

    if (decision === 'Buy') {
      state.experienceTracking.consecutiveBuys++;

      // Habit formation: 5+ consecutive buys = routine
      if (state.experienceTracking.consecutiveBuys >= 5) {
        state.experienceTracking.hasRoutine = true;
      }
    }
  } else {
    // Neutral emotion
    state.experienceTracking.consecutiveFrustrations = 0;
  }

  // Track peak experience
  if (isPositive && quality >= 8) {
    if (!state.experienceTracking.peakExperience || quality > state.experienceTracking.peakExperience.quality) {
      state.experienceTracking.peakExperience = {
        turn: turnNumber,
        quality,
        price,
        emotion
      };
    }
  }

  saveEnhancedMemory();
}

/**
 * Update trust score with emotion-based deltas
 * Implements asymmetric trust recovery (decay faster than recovery)
 */
function updateTrustWithEmotion(personaId, emotion, reason, reasoning) {
  const state = getEnhancedMemoryState(personaId);
  const oldTrust = state.trust_score;

  const trustDeltas = {
    satisfied: 5,
    delighted: 10,
    loyal: 15,
    neutral: 0,
    frustrated: -15,
    angry: -25,
    betrayed: -40
  };

  let delta = trustDeltas[emotion] || 0;

  // Asymmetric recovery: positive gains are 1/3 the magnitude
  if (delta > 0) {
    delta = Math.floor(delta / 3);
  }

  state.trust_score = Math.max(0, Math.min(100, state.trust_score + delta));

  console.log(`[EnhancedMemory] Persona ${personaId}: ${emotion} → Trust ${oldTrust} → ${state.trust_score} (${reason})`);
  if (reasoning) {
    console.log(`               > Reasoning: "${reasoning}"`);
  }

  saveEnhancedMemory();
  return state.trust_score;
}

/**
 * Calculate price perception relative to anchors
 * Implements loss aversion: price increases hurt 2x more than decreases feel good
 */
function calculatePricePerception(personaId, currentPrice) {
  const state = getEnhancedMemoryState(personaId);
  const { initialPrice, lastPricePaid, lowestPriceSeen } = state.priceAnchoring;

  if (initialPrice === null) {
    return { perception: 'unknown', magnitude: 0, anchor: 'none' };
  }

  // Compare to multiple anchors
  const vsInitial = currentPrice - initialPrice;
  const vsLast = lastPricePaid ? currentPrice - lastPricePaid : 0;
  const vsLowest = lowestPriceSeen ? currentPrice - lowestPriceSeen : 0;

  // Loss aversion: increases weighted 2x
  const lossAversionFactor = vsInitial > 0 ? 2 : 1;
  const perceivedDelta = vsInitial * lossAversionFactor;

  let perception;
  if (Math.abs(perceivedDelta) < initialPrice * 0.05) {
    perception = 'fair'; // Within 5% of anchor
  } else if (perceivedDelta > initialPrice * 0.2) {
    perception = 'outrageous'; // >20% increase
  } else if (perceivedDelta > 0) {
    perception = 'expensive'; // Any increase
  } else if (perceivedDelta < -initialPrice * 0.1) {
    perception = 'cheap'; // >10% discount
  } else {
    perception = 'fair';
  }

  return {
    perception,
    magnitude: Math.abs(perceivedDelta),
    vsInitial,
    vsLast,
    vsLowest,
    anchor: 'initial'
  };
}

/**
 * Check if habit has been broken (routine customer facing disruption)
 */
function checkHabitBreakage(personaId, currentPrice) {
  const state = getEnhancedMemoryState(personaId);

  if (!state.experienceTracking.hasRoutine) {
    return { habitBroken: false };
  }

  // Habit breaks if price changes significantly or recent frustration
  const pricePerception = calculatePricePerception(personaId, currentPrice);
  const habitBroken = pricePerception.perception === 'expensive' || pricePerception.perception === 'outrageous';

  if (habitBroken) {
    state.experienceTracking.routineBrokenCount++;
    state.experienceTracking.hasRoutine = false; // Lost routine
    saveEnhancedMemory();

    return {
      habitBroken: true,
      routineBrokenCount: state.experienceTracking.routineBrokenCount,
      extraFrustration: 20 // Bonus frustration for breaking a habit
    };
  }

  return { habitBroken: false };
}

/**
 * Get comprehensive decision context for a persona
 */
function getDecisionContext(personaId, currentPrice) {
  const state = getEnhancedMemoryState(personaId);

  return {
    trust: state.trust_score,
    visitHistory: state.visitHistory.slice(-3), // Last 3 visits
    pricePerception: calculatePricePerception(personaId, currentPrice),
    habitStatus: {
      hasRoutine: state.experienceTracking.hasRoutine,
      consecutiveBuys: state.experienceTracking.consecutiveBuys,
      routineBrokenCount: state.experienceTracking.routineBrokenCount
    },
    frustrationStatus: {
      consecutiveFrustrations: state.experienceTracking.consecutiveFrustrations,
      isOnLastChance: state.flags.isOnLastChance,
      isPermanentlyGone: state.flags.isPermanentlyGone
    },
    peakExperience: state.experienceTracking.peakExperience,
    competitorKnowledge: state.competitorKnowledge,
    lifetimeStats: state.lifetimeStats
  };
}

/**
 * Reset all enhanced memory (for testing)
 */
function resetAllEnhancedMemory() {
  enhancedMemoryCache = {};
  for (let i = 1; i <= 20; i++) {
    enhancedMemoryCache[i] = JSON.parse(JSON.stringify(DEFAULT_ENHANCED_STATE));
  }
  saveEnhancedMemory();
  console.log('[EnhancedMemory] Reset all enhanced memory states');
}

// Initialize on module load
initializeEnhancedMemory();

module.exports = {
  getEnhancedMemoryState,
  recordVisit,
  updateTrustWithEmotion,
  calculatePricePerception,
  checkHabitBreakage,
  getDecisionContext,
  resetAllEnhancedMemory,
  initializeEnhancedMemory
};
