/**
 * OpenAI Agent Run Manager
 *
 * Manages persistent conversation threads for each persona.
 * Each of the 50 personas gets its own thread for conversation history.
 */

const { getOpenAIClient } = require('./oaClient');

// In-memory thread storage: personaId -> threadId
// For production, consider using Redis or database for persistence
const threadMap = new Map();

/**
 * Get or create a thread for a persona
 * @param {number} personaId - Persona ID
 * @returns {Promise<string>} Thread ID
 */
async function getOrCreateThread(personaId) {
  // Check if thread already exists
  if (threadMap.has(personaId)) {
    return threadMap.get(personaId);
  }

  // Create new thread
  const openai = getOpenAIClient();
  const thread = await openai.beta.threads.create({
    metadata: {
      personaId: personaId.toString(),
      createdAt: new Date().toISOString()
    }
  });

  // Store thread ID
  threadMap.set(personaId, thread.id);
  console.log(`[OAAgentManager] Created thread ${thread.id} for persona ${personaId}`);

  return thread.id;
}

/**
 * Add a message to a thread
 * @param {string} threadId - Thread ID
 * @param {string} content - Message content
 * @returns {Promise<void>}
 */
async function addMessage(threadId, content) {
  const openai = getOpenAIClient();
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content
  });
}

/**
 * Run an agent on a thread and wait for completion
 * @param {string} threadId - Thread ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} Parsed decision object
 */
async function runAgent(threadId, agentId) {
  const openai = getOpenAIClient();

  console.log(`[OAAgentManager] runAgent called with threadId=${threadId}, agentId=${agentId}`);

  // Create run
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: agentId
  });

  console.log(`[OAAgentManager] runAgent: runId=${run.id}, threadId=${threadId}`);
  // Poll for completion
  let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds max

  while (runStatus.status !== 'completed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: threadId });
    attempts++;

    if (runStatus.status === 'failed') {
      throw new Error(`Agent run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
    }

    if (runStatus.status === 'cancelled') {
      throw new Error('Agent run was cancelled');
    }

    if (runStatus.status === 'expired') {
      throw new Error('Agent run expired');
    }
  }

  if (runStatus.status !== 'completed') {
    throw new Error(`Agent run timed out after ${maxAttempts} seconds`);
  }

  // Get the agent's response
  const messages = await openai.beta.threads.messages.list(threadId, {
    order: 'desc',
    limit: 1
  });

  if (!messages.data || messages.data.length === 0) {
    throw new Error('No response from agent');
  }

  const agentMessage = messages.data[0];
  const textContent = agentMessage.content.find(c => c.type === 'text');

  if (!textContent) {
    throw new Error('Agent response has no text content');
  }

  const responseText = textContent.text.value;

  // Parse JSON response
  try {
    // Try to extract JSON from markdown code blocks if present
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const decision = JSON.parse(jsonText);
    return decision;
  } catch (parseError) {
    console.error(`[OAAgentManager] Failed to parse JSON response:`, responseText);
    // Fallback decision
    return {
      decision: 'Skip',
      reasoning: 'Unable to parse agent response',
      emotion: 'neutral',
      pricePerception: 'unknown'
    };
  }
}

/**
 * Send message and run agent in one step
 * @param {string} threadId - Thread ID
 * @param {string} agentId - Agent ID
 * @param {string} message - Message content
 * @param {number} personaId - Persona ID (for logging)
 * @returns {Promise<Object>} Decision object
 */
async function sendMessageAndRun(threadId, agentId, message, personaId) {
  try {
    console.log(`[OAAgentManager] sendMessageAndRun: personaId=${personaId}, threadId=${threadId}, agentId=${agentId}`);
    await addMessage(threadId, message);
    console.log(`[OAAgentManager] Message added for persona ${personaId}, calling runAgent...`);
    const decision = await runAgent(threadId, agentId);
    return decision;
  } catch (error) {
    console.error(`[OAAgentManager] Error for persona ${personaId}:`, error.message);
    throw error;
  }
}

/**
 * Clear all threads (useful for testing/reset)
 */
function clearThreads() {
  threadMap.clear();
  console.log('[OAAgentManager] All threads cleared');
}

/**
 * Get thread count
 */
function getThreadCount() {
  return threadMap.size;
}

module.exports = {
  getOrCreateThread,
  addMessage,
  runAgent,
  sendMessageAndRun,
  clearThreads,
  getThreadCount
};
