const simulationRateLimiter = (req, res, next) => {
  next();
};

module.exports = { simulationRateLimiter };