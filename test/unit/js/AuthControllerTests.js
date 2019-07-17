const path = require('path')
const sinon = require('sinon')
const { expect } = require('chai')
const SandboxedModule = require('sandboxed-module')
const Errors = require('../../../app/js/Errors')

const MODULE_PATH = path.join(__dirname, '../../../app/js/AuthController.js')

describe('AuthController', function() {
  beforeEach(function() {
    this.celebrate = {
      isCelebrate: sinon.stub().returns(false)
    }
    this.logger = {
      info: sinon.stub()
    }
    this.AuthHandler = {
      login: sinon.stub(),
      oneTimeLogin: sinon.stub(),
      generateOneTimeLoginToken: sinon.stub()
    }
    this.EmailHandler = {
      sendOneTimeLoginEmail: sinon.stub().yields()
    }
    this.AuthController = SandboxedModule.require(MODULE_PATH, {
      requires: {
        celebrate: this.celebrate,
        'logger-sharelatex': this.logger,
        './AuthHandler': this.AuthHandler,
        './EmailHandler': this.EmailHandler,
        './Errors': Errors
      }
    })

    this.req = {
      body: {},
      session: {
        destroy: sinon.stub().yields()
      }
    }
    this.res = {
      redirect: sinon.stub(),
      render: sinon.stub(),
      status: sinon.stub().returnsThis()
    }
    this.next = sinon.stub()
  })

  describe('login', function() {
    beforeEach(function() {
      this.email = 'user@example.com'
      this.password = 'secret123'
      this.userId = 'abc123'
      this.req.body = { email: this.email, password: this.password }
    })

    it('sets the session and redirects to the project page', function(done) {
      this.AuthHandler.login
        .withArgs(this.email, this.password)
        .yields(null, this.userId)
      this.res.redirect.callsFake(url => {
        expect(this.req.session.userId).to.equal(this.userId)
        expect(url).to.equal('/project')
        done()
      })

      this.AuthController.login(this.req, this.res, this.next)
    })
  })

  describe('handleLoginErrors', () =>
    it('rerenders the login screen on authentication failure', function(done) {
      this.res.render.callsFake((template, vars) => {
        expect(this.res.status).to.have.been.calledWith(400)
        expect(template).to.equal('login-form')
        expect(vars).to.deep.equal({ failedLogin: true })
        done()
      })

      this.AuthController.handleLoginErrors(
        new Errors.AuthenticationError(),
        this.req,
        this.res,
        this.next
      )
    }))

  describe('logout', () =>
    it('clears the session and redirects to the login page', function(done) {
      this.res.redirect.callsFake(url => {
        expect(url).to.equal('/')
        expect(this.req.session.destroy).to.have.been.called
        done()
      })

      this.AuthController.logout(this.req, this.res, this.next)
    }))

  describe('oneTimeLogin', function() {
    beforeEach(function() {
      this.email = 'user@example.com'
      this.token = 'secret123'
      this.userId = 'abc123'
      this.req.query = { email: this.email, token: this.token }
    })

    it('sets the session and redirects to the project page', function(done) {
      this.AuthHandler.oneTimeLogin
        .withArgs(this.email, this.token)
        .yields(null, this.userId)
      this.res.redirect.callsFake(url => {
        expect(this.req.session.userId).to.equal(this.userId)
        expect(url).to.equal('/project')
        done()
      })

      this.AuthController.oneTimeLogin(this.req, this.res, this.next)
    })
  })

  describe('handleOneTimeLoginErrors', () =>
    it('rerenders the login screen on authentication failure', function(done) {
      this.res.render.callsFake((template, vars) => {
        expect(this.res.status).to.have.been.calledWith(400)
        expect(template).to.equal('login-form')
        expect(vars).to.deep.equal({ failedOneTimeLogin: true })
        done()
      })

      this.AuthController.handleOneTimeLoginErrors(
        new Errors.AuthenticationError(),
        this.req,
        this.res,
        this.next
      )
    }))

  describe('oneTimeLoginRequest', function() {
    it('sends an email with a one-time login token', function(done) {
      const email = 'user@example.com'
      const token = 'secret123'
      this.req.body = { email }
      this.AuthHandler.generateOneTimeLoginToken
        .withArgs(email)
        .yields(null, token)
      this.res.render.callsFake(() => {
        expect(this.EmailHandler.sendOneTimeLoginEmail).to.have.been.calledWith(
          email,
          token
        )
        done()
      })

      this.AuthController.oneTimeLoginRequest(this.req, this.res, this.next)
    })

    it('rerenders the request form if the email is not registered', function(done) {
      const email = 'not-a-user@example.com'
      this.req.body = { email }
      this.AuthHandler.generateOneTimeLoginToken.yields(
        new Errors.UserNotFoundError()
      )
      this.res.render.callsFake((template, vars) => {
        expect(this.res.status).to.have.been.calledWith(400)
        expect(template).to.equal('one-time-login-request-form')
        expect(vars.email).to.equal(email)
        expect(vars.error).to.exist
        done()
      })

      this.AuthController.oneTimeLoginRequest(this.req, this.res, this.next)
    })
  })
})
