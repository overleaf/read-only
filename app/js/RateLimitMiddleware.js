const rateLimit = require('express-rate-limit')
const logger = require('logger-sharelatex')

const LOGIN_RATE_LIMIT_WINDOW_MS = 60000
const LOGIN_RATE_LIMIT_MAX_REQUESTS = 10

module.exports = {
  loginRateLimiter,
  tokenRequestRateLimiter
}

function loginRateLimiter(endpoint) {
  return rateLimit({
    max: LOGIN_RATE_LIMIT_MAX_REQUESTS,
    windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
    skipSuccessfulRequests: true,
    headers: false,
    handler: (req, res) => {
      res.status(429).render('too-many-login-attempts')
    },
    onLimitReached: _handleRateLimitReached
  })
}

function tokenRequestRateLimiter(endpoint) {
  return rateLimit({
    max: LOGIN_RATE_LIMIT_MAX_REQUESTS,
    windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
    headers: false,
    handler: (req, res) => {
      res.status(429).render('too-many-token-requests')
    },
    onLimitReached: _handleRateLimitReached
  })
}

function _handleRateLimitReached(req) {
  logger.warn({ req }, 'rate limit reached')
}
