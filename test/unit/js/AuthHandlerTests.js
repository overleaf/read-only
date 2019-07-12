const _ = require('lodash')
const crypto = require('crypto')
const path = require('path')
const sinon = require('sinon')
const { expect } = require('chai')
const SandboxedModule = require('sandboxed-module')
const { ObjectId } = require('mongojs')
const Errors = require('../../../app/js/Errors')

const MODULE_PATH = path.join(__dirname, '../../../app/js/AuthHandler.js')

describe('AuthHandler', function() {
  beforeEach(function() {
    this.bcrypt = {
      compare: sinon.stub()
    }
    this.crypto = {
      randomBytes: sinon.stub(),
      timingSafeEqual: crypto.timingSafeEqual
    }
    this.logger = {
      info: sinon.stub()
    }
    this.db = {
      users: {
        findOne: sinon.stub()
      },
      oneTimeLoginTokens: {
        findOne: sinon.stub(),
        insertOne: sinon.stub().yields(),
        updateOne: sinon.stub().yields()
      }
    }
    this.AuthHandler = SandboxedModule.require(MODULE_PATH, {
      requires: {
        lodash: _,
        bcrypt: this.bcrypt,
        crypto: this.crypto,
        'logger-sharelatex': this.logger,
        './MongoHandler': { db: this.db },
        './Errors': Errors
      }
    })
  })

  describe('login', function() {
    beforeEach(function() {
      this.email = 'user@example.com'
      this.password = 'secret'
      this.userId = 'aaaaaaaaaaaaaaaaaaaaaaaa'
      this.user = {
        _id: ObjectId(this.userId),
        hashedPassword: 'hashed-secret'
      }
      this.db.users.findOne.yields(null, null)
      this.db.users.findOne
        .withArgs({ email: this.email })
        .yields(null, this.user)
      this.bcrypt.compare.yields(null, false)
      this.bcrypt.compare
        .withArgs(this.password, this.user.hashedPassword)
        .yields(null, true)
    })

    it('checks the password and returns the user id', function(done) {
      this.AuthHandler.login(this.email, this.password, (err, userId) => {
        if (err != null) {
          return done(err)
        }
        expect(userId).to.equal(this.userId)
        done()
      })
    })

    it('is case-insensitive relative to the email', function(done) {
      this.AuthHandler.login(
        'User@Example.Com',
        this.password,
        (err, userId) => {
          if (err != null) {
            return done(err)
          }
          expect(userId).to.equal(this.userId)
          done()
        }
      )
    })

    it("throws an AuthenticationError if the user doesn't exist", function(done) {
      this.AuthHandler.login('incorrect@email.com', this.password, err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        done()
      })
    })

    it('throws an AuthenticationError if the password is wrong', function(done) {
      this.AuthHandler.login(this.email, 'not-a-pass', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        done()
      })
    })

    it("throws an AuthenticationError if the user doesn't have a password", function(done) {
      delete this.user.hashedPassword
      this.AuthHandler.login(this.email, this.password, err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        done()
      })
    })
  })

  describe('oneTimeLogin', function() {
    beforeEach(function() {
      this.email = 'user@example.com'
      this.token = 'secret123'
      this.userId = new ObjectId()
      this.tokenId = new ObjectId()
      this.user = { _id: this.userId }
      this.db.oneTimeLoginTokens.findOne.yields(null, null)
      this.db.oneTimeLoginTokens.findOne
        .withArgs(sinon.match({ email: this.email }))
        .yields(null, { _id: this.tokenId, token: this.token })
      this.db.users.findOne.yields(null, null)
      this.db.users.findOne
        .withArgs({ email: this.email })
        .yields(null, this.user)
    })

    it('picks an unused token, uses it and returns the user id', function(done) {
      this.AuthHandler.oneTimeLogin(this.email, this.token, (err, userId) => {
        if (err != null) {
          return done(err)
        }
        expect(this.db.oneTimeLoginTokens.findOne).to.have.been.calledWith(
          sinon.match({
            usedAt: { $exists: false }
          })
        )
        expect(this.db.oneTimeLoginTokens.updateOne).to.have.been.calledWith(
          { _id: this.tokenId },
          {
            $set: {
              usedAt: sinon.match.date
            }
          }
        )
        expect(userId).to.equal(this.userId.toString())
        done()
      })
    })

    it('is case-insensitive relative to the email', function(done) {
      this.AuthHandler.oneTimeLogin(
        'User@Example.Com',
        this.token,
        (err, userId) => {
          if (err != null) {
            return done(err)
          }
          expect(userId).to.equal(this.userId.toString())
          done()
        }
      )
    })

    it('throws an AuthenticationError when the token is invalid', function(done) {
      this.AuthHandler.oneTimeLogin(this.email, 'secret456', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        done()
      })
    })

    it('throws an AuthenticationError when the token is empty', function(done) {
      this.AuthHandler.oneTimeLogin(this.email, '', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        done()
      })
    })

    it('throws an AuthenticationError when the token is the wrong length', function(done) {
      this.AuthHandler.oneTimeLogin(this.email, 'bad-token-too-long', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        done()
      })
    })

    it('throws an AuthenticationError when the email has no token', function(done) {
      this.AuthHandler.oneTimeLogin('unknown@email.com', this.token, err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        done()
      })
    })

    it('throws an AuthenticationError when the user does not exist', function(done) {
      this.db.users.findOne.withArgs({ email: this.email }).yields(null, null)
      this.AuthHandler.oneTimeLogin(this.email, 'bad-token', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        done()
      })
    })
  })

  describe('generateOneTimeLoginToken', function() {
    it('generates a token and inserts it in the database', function(done) {
      const email = 'user@example.com'
      this.db.users.findOne.yields(null, { email })
      this.crypto.randomBytes.returns(Buffer.from([0xde, 0xad, 0xbe, 0xef]))

      this.AuthHandler.generateOneTimeLoginToken(email, (err, token) => {
        if (err != null) {
          return done(err)
        }
        expect(this.db.oneTimeLoginTokens.insertOne).to.have.been.calledWith({
          email,
          token: 'deadbeef',
          createdAt: sinon.match.date,
          expiresAt: sinon.match.date
        })
        done()
      })
    })

    it('throws a UserNotFoundError when the user does not exist', function(done) {
      this.db.users.findOne.yields(null, null)

      this.AuthHandler.generateOneTimeLoginToken(
        'not-a-user@example.com',
        (err, token) => {
          expect(err).to.be.instanceof(Errors.UserNotFoundError)
          done()
        }
      )
    })
  })
})
