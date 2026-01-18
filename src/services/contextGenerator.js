/**
 * Dynamic Context Generator - "Right Now" States for Personas
 *
 * Generates realistic, time-varying context for each simulation turn.
 * Context includes financial, temporal, emotional, and situational factors.
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MOODS = ['terrible', 'bad', 'neutral', 'good', 'great'];

/**
 * Generate financial context for a persona
 * @param {Object} persona - Persona instance
 * @param {number} turnNumber - Current simulation turn
 * @returns {Object} Financial context
 */
function generateFinancialContext(persona, turnNumber) {
  const [minBudget, maxBudget] = persona.budgetRange;
  const budgetRemaining = Math.random() * (maxBudget - minBudget) + minBudget;

  // Payday logic (every 2 weeks for professionals, monthly for others)
  const isPayday = persona.archetype === 'Professional'
    ? turnNumber % 14 === 0
    : turnNumber % 30 === 0;

  // Recent expense probability varies by archetype
  const expenseProbability = {
    Student: 0.4,
    Professional: 0.6,
    Retiree: 0.3,
    Parent: 0.7,
    Tourist: 0.5,
    Freelancer: 0.5,
    HealthConscious: 0.4
  };

  const hadRecentExpense = Math.random() < (expenseProbability[persona.archetype] || 0.5);

  return {
    budgetRemaining: parseFloat(budgetRemaining.toFixed(2)),
    isPayday,
    hadRecentExpense,
    budgetTightness: budgetRemaining < (minBudget + (maxBudget - minBudget) * 0.3) ? 'tight' : 'comfortable'
  };
}

/**
 * Generate temporal context
 * @param {Object} persona - Persona instance
 * @param {number} turnNumber - Current simulation turn
 * @returns {Object} Temporal context
 */
function generateTemporalContext(persona, turnNumber) {
  // Weighted day selection based on weekday preference
  const isWeekday = Math.random() < persona.weekdayPreference;
  const dayIndex = isWeekday
    ? Math.floor(Math.random() * 5) // Mon-Fri
    : Math.floor(Math.random() * 2) + 5; // Sat-Sun

  const dayOfWeek = DAYS[dayIndex];

  // Time of day weighted by preferred times
  const timeOptions = persona.preferredTimes;
  const timeOfDay = timeOptions[Math.floor(Math.random() * timeOptions.length)];

  // Rushing probability
  const rushingProbability = {
    Monday: { morning: 0.8, lunch: 0.5, afternoon: 0.3, evening: 0.2 },
    Tuesday: { morning: 0.6, lunch: 0.4, afternoon: 0.3, evening: 0.2 },
    Wednesday: { morning: 0.6, lunch: 0.4, afternoon: 0.3, evening: 0.2 },
    Thursday: { morning: 0.6, lunch: 0.4, afternoon: 0.3, evening: 0.2 },
    Friday: { morning: 0.5, lunch: 0.3, afternoon: 0.2, evening: 0.1 },
    Saturday: { morning: 0.2, lunch: 0.2, afternoon: 0.1, evening: 0.1 },
    Sunday: { morning: 0.1, lunch: 0.2, afternoon: 0.1, evening: 0.1 }
  };

  const baseRushProb = rushingProbability[dayOfWeek][timeOfDay] || 0.3;
  const personaRushModifier = persona.valuesSpeed ? 1.2 : 0.8;
  const isRushing = Math.random() < (baseRushProb * personaRushModifier);

  return {
    dayOfWeek,
    timeOfDay,
    isRushing,
    isWeekend: dayIndex >= 5,
    isMondayMorning: dayOfWeek === 'Monday' && timeOfDay === 'morning',
    isFridayAfternoon: dayOfWeek === 'Friday' && timeOfDay === 'afternoon'
  };
}

/**
 * Generate emotional context
 * @param {Object} persona - Persona instance
 * @param {Object} temporal - Temporal context
 * @param {Object} memoryState - Persona's memory state
 * @returns {Object} Emotional context
 */
function generateEmotionalContext(persona, temporal, memoryState) {
  // Base mood influenced by moodVariance
  let moodIndex = 2; // Start at neutral

  // Mood variance factor
  const variance = Math.floor((Math.random() - 0.5) * persona.moodVariance * 4);
  moodIndex = Math.max(0, Math.min(4, moodIndex + variance));

  // Temporal modifiers
  if (temporal.isMondayMorning) moodIndex = Math.max(0, moodIndex - 1);
  if (temporal.isFridayAfternoon) moodIndex = Math.min(4, moodIndex + 1);
  if (temporal.isWeekend && persona.archetype === 'Professional') moodIndex = Math.min(4, moodIndex + 1);

  // Trust-based mood modifier
  if (memoryState.trust_score < 50) moodIndex = Math.max(0, moodIndex - 1);
  if (memoryState.trust_score > 80) moodIndex = Math.min(4, moodIndex + 1);

  // Recent frustrations impact mood
  if (memoryState.lifetimeStats.timesDisappointed > memoryState.lifetimeStats.timesDelighted) {
    moodIndex = Math.max(0, moodIndex - 1);
  }

  const currentMood = MOODS[moodIndex];

  // Mood reason
  const moodReasons = {
    terrible: ['had a terrible morning', 'got bad news', 'slept poorly', 'stressed about deadlines'],
    bad: ['running late', 'frustrated with traffic', 'minor annoyance', 'tired'],
    neutral: ['typical day', 'nothing special', 'routine'],
    good: ['slept well', 'productive morning', 'nice weather', 'looking forward to weekend'],
    great: ['got great news', 'excited about plans', 'feeling energized', 'payday']
  };

  const moodReason = moodReasons[currentMood][Math.floor(Math.random() * moodReasons[currentMood].length)];

  return {
    currentMood,
    moodReason,
    moodIndex, // 0-4 for calculations
    isBadMood: moodIndex <= 1,
    isGoodMood: moodIndex >= 3
  };
}

/**
 * Generate situational modifiers
 * @param {Object} persona - Persona instance
 * @returns {Object} Situational context
 */
function generateSituationalContext(persona) {
  // With friends probability varies by archetype and social influence
  const withFriendsProbability = {
    Student: 0.4,
    Professional: 0.2,
    Retiree: 0.15,
    Parent: 0.3,
    Tourist: 0.6,
    Freelancer: 0.25,
    HealthConscious: 0.2
  };

  const withFriends = Math.random() < (withFriendsProbability[persona.archetype] || 0.25);

  // Alternative awareness (some personas know about competitors)
  const hasAlternative = Math.random() < (persona.riskTolerance * 0.7);
  const distanceToCompetitor = hasAlternative ? Math.floor(Math.random() * 5) + 1 : null;

  // Quality perception (varies by archetype)
  const qualityExpectation = persona.valuesQuality ? Math.floor(Math.random() * 3) + 7 : Math.floor(Math.random() * 5) + 4;

  return {
    withFriends,
    hasAlternative,
    distanceToCompetitor,
    qualityExpectation, // 1-10 scale
    isFirstVisit: false // Will be determined by memory system
  };
}

/**
 * Generate complete context for a persona
 * @param {Object} persona - Persona instance
 * @param {Object} memoryState - Persona's memory state
 * @param {number} turnNumber - Current simulation turn
 * @returns {Object} Complete context
 */
function generateCompleteContext(persona, memoryState, turnNumber = 1) {
  const financial = generateFinancialContext(persona, turnNumber);
  const temporal = generateTemporalContext(persona, turnNumber);
  const emotional = generateEmotionalContext(persona, temporal, memoryState);
  const situational = generateSituationalContext(persona);

  // Determine if first visit
  const isFirstVisit = memoryState.lifetimeStats.totalVisits === 0;

  return {
    financial,
    temporal,
    emotional,
    situational: {
      ...situational,
      isFirstVisit
    },
    metadata: {
      turnNumber,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Calculate effective price sensitivity based on context
 * @param {Object} persona - Persona instance
 * @param {Object} context - Generated context
 * @param {Object} memoryState - Memory state
 * @returns {number} Adjusted price sensitivity (0-1)
 */
function calculateEffectivePriceSensitivity(persona, context, memoryState) {
  let sensitivity = persona.basePriceSensitivity;

  // Financial modifiers
  if (context.financial.budgetTightness === 'tight') sensitivity += 0.1;
  if (context.financial.isPayday) sensitivity -= 0.1;
  if (context.financial.hadRecentExpense) sensitivity += 0.05;

  // Mood modifiers
  if (context.emotional.isBadMood) sensitivity += 0.1;
  if (context.emotional.isGoodMood) sensitivity -= 0.05;

  // Temporal modifiers
  if (context.temporal.isRushing && persona.valuesSpeed) sensitivity -= 0.15; // Will pay to save time
  if (context.temporal.isFridayAfternoon) sensitivity -= 0.05; // "Treat yourself" mentality

  // Trust modifiers
  if (memoryState.trust_score < 60) sensitivity += 0.15;
  if (memoryState.trust_score < 30) sensitivity += 0.25;

  // Bound to 0-1
  return Math.max(0, Math.min(1, sensitivity));
}

module.exports = {
  generateCompleteContext,
  generateFinancialContext,
  generateTemporalContext,
  generateEmotionalContext,
  generateSituationalContext,
  calculateEffectivePriceSensitivity
};
