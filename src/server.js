const express = require('express');
const config = require('./config')
const { simulationRateLimiter } = require('./middleware')


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.json({
    service: 'Gemini Agentic Batching Engine',
    version: '4.0.0',
    description: 'Phase 4: Advanced archetype-based simulation with rich context',
    endpoints: {
      health: 'GET /health',
      simulate: 'POST /api/simulate (Phase 3)',
      advancedSimulate: 'POST /api/simulate/advanced',
      personaMemory: 'GET /api/simulate/advanced/memory/:personaId',
    },
    features: {
      phase3: ['AEGIS governance', 'Social influence', 'Basic memory', 'Chain-of-thought'],
      phase4: ['7 archetypes', 'Dynamic context', 'Visit history', 'Price anchoring', 'Habit formation', 'Batch processing']
    },
    model: config.gemini.model,
    personas: 50,
    archetypes: 7
  });
})

