path = require('path')
sinon = require('sinon')
{ expect } = require('chai')
SandboxedModule = require('sandboxed-module')
Errors = require("../../../app/js/Errors")

MODULE_PATH = path.join(__dirname, '../../../app/js/AuthController.js')

describe 'AuthController', ->
	beforeEach ->
		@celebrate = {
			isCelebrate: sinon.stub().returns(false)
		}
		@logger = {
			info: sinon.stub()
		}
		@AuthHandler = {
			login: sinon.stub()
			oneTimeLogin: sinon.stub()
			generateOneTimeLoginToken: sinon.stub()
		}
		@EmailHandler = {
			sendOneTimeLoginEmail: sinon.stub().yields()
		}
		@AuthController = SandboxedModule.require(MODULE_PATH, {
			requires:
				'celebrate': @celebrate
				'logger-sharelatex': @logger
				'./AuthHandler': @AuthHandler
				'./EmailHandler': @EmailHandler
				'./Errors': Errors
		})

		@req = {
			body: {}
			session:
				destroy: sinon.stub().yields()
		}
		@res = {
			redirect: sinon.stub()
			render: sinon.stub()
		}
		@next = sinon.stub()

	describe "login", ->
		beforeEach ->
			@email = "user@example.com"
			@password = "secret123"
			@userId = "abc123"
			@req.body = { email: @email, password: @password }

		it "sets the session and redirects to the project page", (done) ->
			@AuthHandler.login.withArgs(@email, @password).yields(null, @userId)
			@res.redirect.callsFake (url) =>
				expect(@req.session.user_id).to.equal(@userId)
				expect(url).to.equal('/project')
				done()

			@AuthController.login(@req, @res, @next)

	describe "handleLoginErrors", ->
		it "rerenders the login screen on authentication failure", (done) ->
			@res.render.callsFake (template, vars) =>
				expect(template).to.equal("home")
				expect(vars).to.deep.equal({ failedLogin: true })
				done()

			@AuthController.handleLoginErrors(new Errors.AuthenticationError(), @req, @res, @next)

	describe "logout", ->
		it "clears the session and redirects to the login page", (done) ->
			@res.redirect.callsFake (url) =>
				expect(url).to.equal("/")
				expect(@req.session.destroy).to.have.been.called
				done()

			@AuthController.logout(@req, @res, @next)

	describe "oneTimeLogin", ->
		beforeEach ->
			@email = "user@example.com"
			@token = "secret123"
			@userId = "abc123"
			@req.query = { email: @email, token: @token }

		it "sets the session and redirects to the project page", (done) ->
			@AuthHandler.oneTimeLogin.withArgs(@email, @token).yields(null, @userId)
			@res.redirect.callsFake (url) =>
				expect(@req.session.user_id).to.equal(@userId)
				expect(url).to.equal('/project')
				done()

			@AuthController.oneTimeLogin(@req, @res, @next)

	describe "handleOneTimeLoginErrors", ->
		it "rerenders the login screen on authentication failure", (done) ->
			@res.render.callsFake (template, vars) =>
				expect(template).to.equal("home")
				expect(vars).to.deep.equal({ failedOneTimeLogin: true })
				done()

			@AuthController.handleOneTimeLoginErrors(new Errors.AuthenticationError(), @req, @res, @next)

	describe "oneTimeLoginRequest", ->
		it "sends an email with a one-time login token", (done) ->
			email = "user@example.com"
			token = "secret123"
			@req.body = { email }
			@AuthHandler.generateOneTimeLoginToken.withArgs(email).yields(null, token)
			@res.render.callsFake () =>
				expect(@EmailHandler.sendOneTimeLoginEmail).to.have.been.calledWith(email, token)
				done()

			@AuthController.oneTimeLoginRequest(@req, @res, @next)

		it "rerenders the request form if the email is not registered", (done) ->
			email = "not-a-user@example.com"
			@req.body = { email }
			@AuthHandler.generateOneTimeLoginToken.yields(new Errors.UserNotFoundError())
			@res.render.callsFake (template, vars) =>
				expect(template).to.equal("one-time-login-request-form")
				expect(vars.email).to.equal(email)
				expect(vars.error).to.exist
				done()

			@AuthController.oneTimeLoginRequest(@req, @res, @next)
