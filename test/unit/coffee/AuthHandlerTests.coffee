_ = require("lodash")
crypto = require("crypto")
path = require('path')
sinon = require('sinon')
{ expect } = require('chai')
SandboxedModule = require('sandboxed-module')
{ ObjectId } = require('mongojs')
Errors = require('../../../app/js/Errors')

MODULE_PATH = path.join(__dirname, '../../../app/js/AuthHandler.js')

describe 'AuthHandler', ->
	beforeEach ->
		@bcrypt = {
			compare: sinon.stub()
		}
		@crypto = {
			randomBytes: sinon.stub()
			timingSafeEqual: crypto.timingSafeEqual
		}
		@logger = {
			info: sinon.stub()
		}
		@db = {
			users:
				findOne: sinon.stub()
			oneTimeLoginTokens:
				findOne: sinon.stub()
				insert: sinon.stub().yields()
				update: sinon.stub().yields()
		}
		@AuthHandler = SandboxedModule.require(MODULE_PATH, {
			requires:
				'lodash': _
				'bcrypt': @bcrypt
				'crypto': @crypto
				'logger-sharelatex': @logger
				'./MongoHandler': { db: @db }
				'./Errors': Errors
		})

	describe "login", ->
		beforeEach ->
			@email = 'user@example.com'
			@password = 'secret'
			@userId = 'aaaaaaaaaaaaaaaaaaaaaaaa'
			@user = {
				_id: ObjectId(@userId)
				hashedPassword: 'hashed-secret'
			}
			@db.users.findOne.yields(null, null)
			@db.users.findOne.withArgs({ @email }).yields(null, @user)
			@bcrypt.compare.yields(null, false)
			@bcrypt.compare.withArgs(@password, @user.hashedPassword).yields(null, true)

		it "checks the password and returns the user id", (done) ->
			@AuthHandler.login @email, @password, (err, userId) =>
				if err?
					return done(err)
				expect(userId).to.equal(@userId)
				done()

		it "is case-insensitive relative to the email", (done) ->
			@AuthHandler.login "User@Example.Com", @password, (err, userId) =>
				if err?
					return done(err)
				expect(userId).to.equal(@userId)
				done()

		it "throws an AuthenticationError if the user doesn't exist", (done) ->
			@AuthHandler.login "incorrect@email.com", @password, (err) =>
				expect(err).to.be.instanceof(Errors.AuthenticationError)
				done()

		it "throws an AuthenticationError if the password is wrong", (done) ->
			@AuthHandler.login @email, "not-a-pass", (err) =>
				expect(err).to.be.instanceof(Errors.AuthenticationError)
				done()

		it "throws an AuthenticationError if the user doesn't have a password", (done) ->
			delete @user.hashedPassword
			@AuthHandler.login @email, @password, (err) =>
				expect(err).to.be.instanceof(Errors.AuthenticationError)
				done()

	describe "oneTimeLogin", ->
		beforeEach ->
			@email = 'user@example.com'
			@token = 'secret123'
			@userId = new ObjectId()
			@tokenId = new ObjectId()
			@user = { _id: @userId }
			@db.oneTimeLoginTokens.findOne.yields(null, null)
			@db.oneTimeLoginTokens.findOne
				.withArgs(sinon.match({ email: @email }))
				.yields(null, { _id: @tokenId, token: @token })
			@db.users.findOne.yields(null, null)
			@db.users.findOne.withArgs({ email: @email }).yields(null, @user)

		it "picks an unused token, uses it and returns the user id", (done) ->
			@AuthHandler.oneTimeLogin @email, @token, (err, userId) =>
				if err?
					return done(err)
				expect(@db.oneTimeLoginTokens.findOne).to.have.been.calledWith(sinon.match({
					usedAt: { $exists: false }
				}))
				expect(@db.oneTimeLoginTokens.update).to.have.been.calledWith(
					{ _id: @tokenId }
					{
						$set:
							usedAt: sinon.match.date
					}
				)
				expect(userId).to.equal(@userId.toString())
				done()

		it "is case-insensitive relative to the email", (done) ->
			@AuthHandler.oneTimeLogin "User@Example.Com", @token, (err, userId) =>
				if err?
					return done(err)
				expect(userId).to.equal(@userId.toString())
				done()

		it "throws an AuthenticationError when the token is invalid", (done) ->
			@AuthHandler.oneTimeLogin @email, "secret456", (err) =>
				expect(err).to.be.instanceof(Errors.AuthenticationError)
				done()

		it "throws an AuthenticationError when the token is empty", (done) ->
			@AuthHandler.oneTimeLogin @email, "", (err) =>
				expect(err).to.be.instanceof(Errors.AuthenticationError)
				done()

		it "throws an AuthenticationError when the token is the wrong length", (done) ->
			@AuthHandler.oneTimeLogin @email, "bad-token-too-long", (err) =>
				expect(err).to.be.instanceof(Errors.AuthenticationError)
				done()

		it "throws an AuthenticationError when the email has no token", (done) ->
			@AuthHandler.oneTimeLogin 'unknown@email.com', @token, (err) =>
				expect(err).to.be.instanceof(Errors.AuthenticationError)
				done()

		it "throws an AuthenticationError when the user does not exist", (done) ->
			@db.users.findOne.withArgs({ email: @email }).yields(null, null)
			@AuthHandler.oneTimeLogin @email, "bad-token", (err) =>
				expect(err).to.be.instanceof(Errors.AuthenticationError)
				done()

	describe "generateOneTimeLoginToken", ->
		it "generates a token and inserts it in the database", (done) ->
			email = 'user@example.com'
			@db.users.findOne.yields(null, { email })
			@db.oneTimeLoginTokens.insert
			@crypto.randomBytes.returns(Buffer.from([0xde, 0xad, 0xbe, 0xef]))

			@AuthHandler.generateOneTimeLoginToken email, (err, token) =>
				expect(@db.oneTimeLoginTokens.insert).to.have.been.calledWith({
					email: email
					token: "deadbeef"
					createdAt: sinon.match.date
					expiresAt: sinon.match.date
				})
				done()

		it "throws a UserNotFoundError when the user does not exist", (done) ->
			@db.users.findOne.yields(null, null)

			@AuthHandler.generateOneTimeLoginToken 'not-a-user@example.com', (err, token) =>
				expect(err).to.be.instanceof(Errors.UserNotFoundError)
				done()
