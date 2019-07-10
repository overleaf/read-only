const path = require('path')
const BodyParser = require('body-parser')
const { celebrate, Joi } = require('celebrate')
const express = require('express')
const logger = require('logger-sharelatex')
const SmokeTest = require('smoke-test-sharelatex')

const AuthController = require('./AuthController')
const HttpController = require('./HttpController')
const SessionMiddleware = require('./SessionMiddleware')
const RateLimitMiddleware = require('./RateLimitMiddleware')

module.exports = {
  initialize
}

function initialize(app) {
  app.use(express.static('public'))
  app.use(SessionMiddleware.middleware)
  app.use(BodyParser.urlencoded({ extended: false }))

  app.get('/', HttpController.home)

  app.post(
    '/login',
    celebrate({
      body: Joi.object({
        email: Joi.string()
          .trim()
          .email()
          .required(),
        password: Joi.string()
          .trim()
          .required()
      })
    }),
    RateLimitMiddleware.loginRateLimiter(),
    AuthController.login,
    AuthController.handleLoginErrors
  )

  app.get('/logout', AuthController.logout)
  app.get('/one-time-login/request', AuthController.oneTimeLoginRequestForm)

  app.post(
    '/one-time-login/request',
    celebrate({
      body: Joi.object({
        email: Joi.string()
          .trim()
          .email()
          .required()
      })
    }),
    RateLimitMiddleware.tokenRequestRateLimiter(),
    AuthController.oneTimeLoginRequest,
    AuthController.handleOneTimeLoginRequestErrors
  )

  app.get(
    '/one-time-login',
    celebrate({
      query: Joi.object({
        email: Joi.string()
          .email()
          .required(),
        token: Joi.string()
          .regex(/^[0-9a-f]{64}$/, 'token')
          .required()
      })
    }),
    RateLimitMiddleware.loginRateLimiter(),
    AuthController.oneTimeLogin,
    AuthController.handleOneTimeLoginErrors
  )

  app.get('/project', HttpController.projects)
  app.get('/project/:project_id', HttpController.getProject)

  app.get('/status', function(req, res) {
    logger.log('hit status')
    res.send('read-only is alive')
  })

  app.get(
    '/health_check',
    SmokeTest.run(path.join(__dirname, '../../test/smoke/js/test.js'), 30000)
  )
}
