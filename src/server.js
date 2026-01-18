const express = require('express');
const config = require('./config');
const { simulationRateLimiter } = require('./middleware/rateLimiter');
const simulateRoute = require('./routes/simulate');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/simulate', simulationRateLimiter, simulateRoute);

app.get('/', (req, res) => {
  res.json({
    service: 'Gemini Agentic Batching Engine',
    version: '1.0.0',
    description: 'AI agent simulation with personas',
    endpoints: {
      simulate: 'POST /api/simulate'
    },
    model: config.gemini.model,
    personas: 5
  });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

