/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let AuthController
const logger = require('logger-sharelatex')
const { isCelebrate } = require('celebrate')

const AuthHandler = require('./AuthHandler')
const EmailHandler = require('./EmailHandler')
const Errors = require('./Errors')

module.exports = AuthController = {
  login(req, res, next) {
    const { email, password } = req.body
    logger.info({ email }, 'received password login request')
    return AuthHandler.login(email, password, function(err, userId) {
      if (err != null) {
        return next(err)
      }
      logger.info({ email, userId }, 'successful login')
      req.session.user_id = userId
      return res.redirect('/project')
    })
  },

  handleLoginErrors(err, req, res, next) {
    if (err instanceof Errors.AuthenticationError || isCelebrate(err)) {
      return res.render('home', { failedLogin: true })
    } else {
      return next(err)
    }
  },

  logout(req, res, next) {
    return req.session.destroy(function(err) {
      if (err != null) {
        return next(err)
      }
      return res.redirect('/')
    })
  },

  oneTimeLogin(req, res, next) {
    const { email, token } = req.query
    logger.info({ email }, 'received one-time login request')
    return AuthHandler.oneTimeLogin(email, token, function(err, userId) {
      if (err != null) {
        return next(err)
      }
      logger.info({ email, userId }, 'successful one-time login')
      req.session.user_id = userId
      return res.redirect('/project')
    })
  },

  handleOneTimeLoginErrors(err, req, res, next) {
    if (err instanceof Errors.AuthenticationError || isCelebrate(err)) {
      return res.render('home', { failedOneTimeLogin: true })
    } else {
      return next(err)
    }
  },

  oneTimeLoginRequestForm(req, res, next) {
    return res.render('one-time-login-request-form')
  },

  oneTimeLoginRequest(req, res, next) {
    const { email } = req.body
    return AuthHandler.generateOneTimeLoginToken(email, function(err, token) {
      if (err != null) {
        if (err instanceof Errors.UserNotFoundError) {
          return res.render('one-time-login-request-form', {
            error: 'This email address is not registered in Overleaf',
            email
          })
        } else {
          return next(err)
        }
      } else {
        return EmailHandler.sendOneTimeLoginEmail(email, token, function(err) {
          if (err != null) {
            return next(err)
          }
          return res.render('one-time-login-email-sent')
        })
      }
    })
  },

  handleOneTimeLoginRequestErrors(err, req, res, next) {
    if (err instanceof Errors.UserNotFoundError || isCelebrate(err)) {
      return res.render('one-time-login-request-form', {
        error: 'This email address is not registered in Overleaf',
        email: req.body.email
      })
    } else {
      return next(err)
    }
  }
}
