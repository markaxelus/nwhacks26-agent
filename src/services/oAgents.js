/**
 * OpenAI Agent Configuration
 *
 * Maps 20 persona IDs to 20 unique OpenAI Agent IDs (1:1 mapping).
 *
 * SETUP INSTRUCTIONS:
 * 1. Create 20 agents in OpenAI Playground (https://platform.openai.com/playground)
 * 2. For each agent, configure using the cafe customer template (see CAFE_ARCHETYPE_TEMPLATE.md)
 * 3. Copy the Agent ID (starts with "asst_")
 * 4. Paste the IDs into AGENT_IDS below
 */

const config = require('../../config');

/**
 * 20 OpenAI Agent IDs (1:1 mapping with personas)
 * Replace these placeholder values with actual Agent IDs from OpenAI Playground
 */
const AGENT_IDS = [
  'asst_jurpzkjMnwZ0ADG9elkHwAuw',
  'asst_HDsUPN0b1Xu6KCtdN2KYgcFv',
  'asst_W9r2KI3Kc3Ey3TVohFGKT9MF',
  'asst_JrSe3nqeQkc4VQhG62C9bMlP',
  'asst_QtOEf9cHNcSkvwlqr5x7zY5p',
  'asst_CvEWl2Ro8y1j7yJ8e94DBMuo',
  'asst_9sKMlyEvjRvsZTM8LsvTuByF',
  'asst_uQfqc9Kr0kazRAUVaBXtzF8s',
  'asst_zaHjJRqxFXPeqZzYd8a6bKJD',
  'asst_72LbuBqkNAFVtw4LXc51QAeR',
  'asst_Ih2jvVoLaJ13ygtlatqYAins',
  'asst_URsqfGLv3dOy3v54hFLkzsqp',
  'asst_RyImue6hQL0wpnO5XLy6LR6p',
  'asst_UuTF4NGD4CsfMnxXRvChErCq',
  'asst_K9y6NS9YyeJoSzfc5I93qVv1',
  'asst_xGp5HlHLa2iBJuHT3MbslU5w',
  'asst_6TnpGGyzONBNIzPAqOxKn1nh',
  'asst_M3P7cyj0IjYzHBpKTiYDyFBa',
  'asst_kjEiRPr5xgo6Fog9TbbVg7RQ',
  'asst_HikxUOhCb4kXGAUTfKdHDZGm',
];

/**
 * Get all configured (non-placeholder) agent IDs
 * @returns {string[]} Array of valid agent IDs
 */
function getConfiguredAgents() {
  return AGENT_IDS.filter(id => id && !id.startsWith('asst_placeholder'));
}

/**
 * Get Agent ID for a given persona ID
 * 1:1 mapping with configured agents
 * @param {number} personaId - Persona ID (1-N)
 * @returns {string} OpenAI Agent ID
 */
function getAgentIdForPersona(personaId) {
  const configuredAgents = getConfiguredAgents();

  if (personaId < 1 || personaId > configuredAgents.length) {
    throw new Error(`Invalid persona ID: ${personaId}. Must be between 1 and ${configuredAgents.length}`);
  }

  return configuredAgents[personaId - 1];
}

/**
 * Get all configured agent IDs (alias for getConfiguredAgents)
 * @returns {string[]} Array of agent IDs
 */
function getAllAgentIds() {
  return getConfiguredAgents();
}

/**
 * Check if agents are configured
 * @returns {boolean} True if at least one agent is configured
 */
function areAgentsConfigured() {
  return getAllAgentIds().length > 0;
}

module.exports = {
  AGENT_IDS,
  getAgentIdForPersona,
  getConfiguredAgents,
  getAllAgentIds,
  areAgentsConfigured
};
