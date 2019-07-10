const logger = require('logger-sharelatex')
const { isCelebrate } = require('celebrate')

const AuthHandler = require('./AuthHandler')
const EmailHandler = require('./EmailHandler')
const Errors = require('./Errors')

module.exports = {
  login(req, res, next) {
    const { email, password } = req.body
    logger.info({ email }, 'received password login request')
    AuthHandler.login(email, password, function(err, userId) {
      if (err != null) {
        return next(err)
      }
      logger.info({ email, userId }, 'successful login')
      req.session.user_id = userId
      res.redirect('/project')
    })
  },

  handleLoginErrors(err, req, res, next) {
    if (err instanceof Errors.AuthenticationError || isCelebrate(err)) {
      res.render('home', { failedLogin: true })
    } else {
      next(err)
    }
  },

  logout(req, res, next) {
    req.session.destroy(function(err) {
      if (err != null) {
        return next(err)
      }
      res.redirect('/')
    })
  },

  oneTimeLogin(req, res, next) {
    const { email, token } = req.query
    logger.info({ email }, 'received one-time login request')
    AuthHandler.oneTimeLogin(email, token, function(err, userId) {
      if (err != null) {
        return next(err)
      }
      logger.info({ email, userId }, 'successful one-time login')
      req.session.user_id = userId
      res.redirect('/project')
    })
  },

  handleOneTimeLoginErrors(err, req, res, next) {
    if (err instanceof Errors.AuthenticationError || isCelebrate(err)) {
      res.render('home', { failedOneTimeLogin: true })
    } else {
      next(err)
    }
  },

  oneTimeLoginRequestForm(req, res, next) {
    res.render('one-time-login-request-form')
  },

  oneTimeLoginRequest(req, res, next) {
    const { email } = req.body
    AuthHandler.generateOneTimeLoginToken(email, function(err, token) {
      if (err != null) {
        if (err instanceof Errors.UserNotFoundError) {
          res.render('one-time-login-request-form', {
            error: 'This email address is not registered in Overleaf',
            email
          })
        } else {
          next(err)
        }
      } else {
        EmailHandler.sendOneTimeLoginEmail(email, token, function(err) {
          if (err != null) {
            return next(err)
          }
          res.render('one-time-login-email-sent')
        })
      }
    })
  },

  handleOneTimeLoginRequestErrors(err, req, res, next) {
    if (err instanceof Errors.UserNotFoundError || isCelebrate(err)) {
      res.render('one-time-login-request-form', {
        error: 'This email address is not registered in Overleaf',
        email: req.body.email
      })
    } else {
      next(err)
    }
  }
}
