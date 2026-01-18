const express = require('express');
const { getPersonaById } = require('../services/persona');
const { buildPrompt } = require('../services/prompt');
const { runAgent } = require('../services/gemini');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { personaId, event } = req.body;

    const persona = getPersonaById(personaId);
    if (!persona) {
      return res.status(404).json({ success: false, error: 'Persona not found' });
    }

    const prompt = buildPrompt(persona, event);
    const decision = await runAgent(prompt);

    res.json({
      success: true,
      persona: persona.name,
      event,
      decision
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
