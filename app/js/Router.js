const path = require('path')
const BodyParser = require('body-parser')
const { Joi } = require('celebrate')
const express = require('express')
const logger = require('logger-sharelatex')
const SmokeTest = require('smoke-test-sharelatex')

const AuthController = require('./AuthController')
const AuthorizationMiddleware = require('./AuthorizationMiddleware')
const ProjectController = require('./ProjectController')
const SessionMiddleware = require('./SessionMiddleware')
const RateLimitMiddleware = require('./RateLimitMiddleware')
const CsrfMiddleware = require('./CsrfMiddleware')
const ValidationMiddleware = require('./ValidationMiddleware')

module.exports = {
  initialize
}

function initialize(app) {
  app.use(express.static('public'))
  app.use(SessionMiddleware.middleware)
  app.use(BodyParser.urlencoded({ extended: false }))
  app.use(CsrfMiddleware.middleware)

  app.get('/', ProjectController.home)

  app.get('/login', AuthController.loginForm)
  app.post(
    '/login',
    ValidationMiddleware.validate({
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
  app.get(
    '/read-only/one-time-login/request',
    AuthController.oneTimeLoginRequestForm
  )

  app.post(
    '/read-only/one-time-login/request',
    ValidationMiddleware.validate({
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
    '/read-only/one-time-login',
    ValidationMiddleware.validate({
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

  app.get(
    '/project',
    AuthorizationMiddleware.restricted,
    ProjectController.projects
  )
  app.get(
    '/project/:projectId',
    AuthorizationMiddleware.restricted,
    ProjectController.getProject
  )

  app.get('/status', function(req, res) {
    logger.log('hit status')
    res.send('read-only is alive')
  })

  app.get(
    '/health_check',
    SmokeTest.run(path.join(__dirname, '../../test/smoke/js/test.js'), 30000)
  )
}
