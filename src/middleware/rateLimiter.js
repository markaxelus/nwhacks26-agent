const rateLimit = require('express-rate-limit');
const config = require('../config');


const simulationRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // Time window in milliseconds
  max: config.rateLimit.maxRequests, // Max requests per window
  message: {
    success: false,
    error: `Too many requests. Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds.`
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`[RateLimiter] Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: `Too many requests. Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds. Please try again later.`
    });
  }
});
module.exports = apiRateLimiter;