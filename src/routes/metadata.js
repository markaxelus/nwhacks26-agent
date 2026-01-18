/**
 * Metadata Routes - For Frontend Discovery
 */

const express = require('express');
const router = express.Router();
const { OPENAI_PERSONAS } = require('../services/oPersonas');
const { getProvider } = require('../services/providerFactory');

/**
 * GET /api/metadata/personas
 * Get all available personas/archetypes
 */
router.get('/personas', (req, res) => {
  try {
    const personas = OPENAI_PERSONAS;

    res.json({
      success: true,
      count: personas.length,
      personas: personas.map(p => ({
        id: p.id,
        name: p.name,
        archetype: p.archetype,
        stats: p.stats,
        backstory: p.backstory
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/metadata/status
 * Get system status
 */
router.get('/status', (req, res) => {
  const provider = getProvider();
  res.json({
    success: true,
    status: 'online',
    provider: provider.getName(),
    version: '1.0.0'
  });
});

module.exports = router;
