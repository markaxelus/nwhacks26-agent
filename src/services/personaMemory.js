/**
 * Persona Memory Service - Episodic Memory & Trust Management
 *
 * Manages persona state across simulation turns:
 * - trust_score: 0-100 (starts at 100, decays with negative experiences)
 * - memory: Array of past events that influence future decisions
 *
 * The "Grudge Factor" - Personas remember price hikes, broken promises, etc.
 */

const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '../data/persona_memory.json');

/**
 * Default memory state for a persona
 */
const DEFAULT_MEMORY_STATE = {
  trust_score: 100,
  memory: [],
  lifetime_stats: {
    total_simulations: 0,
    total_buys: 0,
    total_skips: 0,
    times_disappointed: 0,
    times_delighted: 0
  }
};

/**
 * In-memory cache of persona states
 */
let memoryCache = {};

/**
 * Initialize memory system - load from disk or create defaults
 */
function initializeMemory() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Try to load existing memory file
    if (fs.existsSync(MEMORY_FILE)) {
      const data = fs.readFileSync(MEMORY_FILE, 'utf8');
      memoryCache = JSON.parse(data);
      console.log('[PersonaMemory] Loaded existing memory states');
    } else {
      // Initialize all 50 personas with default state
      memoryCache = {};
      for (let i = 1; i <= 50; i++) {
        memoryCache[i] = { ...DEFAULT_MEMORY_STATE };
      }
      saveMemory();
      console.log('[PersonaMemory] Initialized fresh memory states for 50 personas');
    }
  } catch (error) {
    console.error('[PersonaMemory] Error initializing memory:', error.message);
    // Fallback to in-memory only
    memoryCache = {};
    for (let i = 1; i <= 50; i++) {
      memoryCache[i] = { ...DEFAULT_MEMORY_STATE };
    }
  }
}

/**
 * Save memory cache to disk
 */
function saveMemory() {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memoryCache, null, 2));
  } catch (error) {
    console.error('[PersonaMemory] Error saving memory:', error.message);
  }
}

/**
 * Get memory state for a persona
 * @param {number} personaId - Persona ID (1-50)
 * @returns {Object} Memory state
 */
function getMemoryState(personaId) {
  if (!memoryCache[personaId]) {
    memoryCache[personaId] = { ...DEFAULT_MEMORY_STATE };
  }
  return memoryCache[personaId];
}

/**
 * Update trust score based on experience
 * @param {number} personaId - Persona ID
 * @param {number} delta - Change in trust (-50 to +20)
 * @param {string} reason - Reason for trust change
 */
function updateTrustScore(personaId, delta, reason) {
  const state = getMemoryState(personaId);
  const oldScore = state.trust_score;

  // Update trust score (bounded 0-100)
  state.trust_score = Math.max(0, Math.min(100, state.trust_score + delta));

  // Record the event
  state.memory.push({
    timestamp: new Date().toISOString(),
    event_type: delta < 0 ? 'trust_loss' : 'trust_gain',
    trust_change: delta,
    reason,
    old_trust: oldScore,
    new_trust: state.trust_score
  });

  // Keep only last 10 memories
  if (state.memory.length > 10) {
    state.memory = state.memory.slice(-10);
  }

  // Update lifetime stats
  if (delta < 0) {
    state.lifetime_stats.times_disappointed++;
  } else if (delta > 0) {
    state.lifetime_stats.times_delighted++;
  }

  saveMemory();
  return state.trust_score;
}

/**
 * Record a purchase decision
 * @param {number} personaId - Persona ID
 * @param {boolean} didBuy - Whether persona bought
 * @param {number} price - Product price
 * @param {string} event - Event description
 */
function recordDecision(personaId, didBuy, price, event) {
  const state = getMemoryState(personaId);

  state.lifetime_stats.total_simulations++;
  if (didBuy) {
    state.lifetime_stats.total_buys++;
  } else {
    state.lifetime_stats.total_skips++;
  }

  state.memory.push({
    timestamp: new Date().toISOString(),
    event_type: 'purchase_decision',
    decision: didBuy ? 'BUY' : 'SKIP',
    price,
    event
  });

  // Keep only last 10 memories
  if (state.memory.length > 10) {
    state.memory = state.memory.slice(-10);
  }

  saveMemory();
}

/**
 * Apply trust-based modifier to price sensitivity
 * Low trust = increased price sensitivity
 *
 * @param {number} personaId - Persona ID
 * @param {string} baseSensitivity - Original sensitivity level
 * @returns {Object} { adjustedSensitivity, trustModifier }
 */
function applyTrustModifier(personaId, baseSensitivity) {
  const state = getMemoryState(personaId);
  const trustScore = state.trust_score;

  // Trust score affects sensitivity
  // 100 trust = no change
  // 50 trust = +1 level increase in sensitivity
  // 0 trust = +2 levels increase in sensitivity

  const sensitivityLevels = ['none', 'very-low', 'low', 'low-medium', 'medium', 'medium-high', 'high', 'very-high'];
  const currentIndex = sensitivityLevels.indexOf(baseSensitivity);

  let modifier = 0;
  if (trustScore < 30) {
    modifier = 2; // Very low trust = much more price sensitive
  } else if (trustScore < 60) {
    modifier = 1; // Moderate trust = somewhat more sensitive
  }

  const newIndex = Math.min(currentIndex + modifier, sensitivityLevels.length - 1);
  const adjustedSensitivity = sensitivityLevels[newIndex];

  return {
    adjustedSensitivity,
    trustModifier: modifier,
    trustScore,
    baseSensitivity
  };
}

/**
 * Simulate "grudge" effect - check if persona experienced recent negative events
 * @param {number} personaId - Persona ID
 * @returns {Object} { hasGrudge, grudgeIntensity, recentNegativeEvents }
 */
function checkGrudgeEffect(personaId) {
  const state = getMemoryState(personaId);

  // Count recent trust loss events (last 5 memories)
  const recentMemories = state.memory.slice(-5);
  const negativeEvents = recentMemories.filter(m => m.event_type === 'trust_loss');

  const hasGrudge = negativeEvents.length > 0 || state.trust_score < 60;
  const grudgeIntensity = negativeEvents.length > 2 ? 'high' : negativeEvents.length > 0 ? 'medium' : 'low';

  return {
    hasGrudge,
    grudgeIntensity,
    recentNegativeEvents: negativeEvents.length,
    currentTrust: state.trust_score
  };
}

/**
 * Reset all persona memory (for testing)
 */
function resetAllMemory() {
  memoryCache = {};
  for (let i = 1; i <= 50; i++) {
    memoryCache[i] = { ...DEFAULT_MEMORY_STATE };
  }
  saveMemory();
  console.log('[PersonaMemory] Reset all memory states');
}

/**
 * Get summary statistics across all personas
 * @returns {Object} Aggregate statistics
 */
function getMemorySummary() {
  const allStates = Object.values(memoryCache);
  const avgTrust = allStates.reduce((sum, s) => sum + s.trust_score, 0) / allStates.length;
  const lowTrustCount = allStates.filter(s => s.trust_score < 50).length;
  const highTrustCount = allStates.filter(s => s.trust_score >= 80).length;

  return {
    averageTrust: avgTrust.toFixed(1),
    lowTrustPersonas: lowTrustCount,
    highTrustPersonas: highTrustCount,
    totalPersonas: allStates.length
  };
}

// Initialize on module load
initializeMemory();

module.exports = {
  getMemoryState,
  updateTrustScore,
  recordDecision,
  applyTrustModifier,
  checkGrudgeEffect,
  resetAllMemory,
  getMemorySummary,
  initializeMemory
};
