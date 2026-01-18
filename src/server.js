const express = require('express');
const cors = require('cors');
const config = require('./config');
const { simulationRateLimiter } = require('./middleware/rateLimiter');
const simulateRoute = require('./routes/simulate');
const advancedSimulateRoute = require('./services/advancedSimulate');
const metadataRoute = require('./routes/metadata');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/simulate', simulationRateLimiter, simulateRoute);
app.use('/api/simulate/advanced', advancedSimulateRoute);
app.use('/api/metadata', metadataRoute);

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

