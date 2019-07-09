/* eslint-disable
    chai-friendly/no-unused-expressions,
    handle-callback-err,
    no-return-assign,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
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
        insert: sinon.stub().yields(),
        update: sinon.stub().yields()
      }
    }
    return (this.AuthHandler = SandboxedModule.require(MODULE_PATH, {
      requires: {
        lodash: _,
        bcrypt: this.bcrypt,
        crypto: this.crypto,
        'logger-sharelatex': this.logger,
        './MongoHandler': { db: this.db },
        './Errors': Errors
      }
    }))
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
      return this.bcrypt.compare
        .withArgs(this.password, this.user.hashedPassword)
        .yields(null, true)
    })

    it('checks the password and returns the user id', function(done) {
      return this.AuthHandler.login(
        this.email,
        this.password,
        (err, userId) => {
          if (err != null) {
            return done(err)
          }
          expect(userId).to.equal(this.userId)
          return done()
        }
      )
    })

    it('is case-insensitive relative to the email', function(done) {
      return this.AuthHandler.login(
        'User@Example.Com',
        this.password,
        (err, userId) => {
          if (err != null) {
            return done(err)
          }
          expect(userId).to.equal(this.userId)
          return done()
        }
      )
    })

    it("throws an AuthenticationError if the user doesn't exist", function(done) {
      return this.AuthHandler.login(
        'incorrect@email.com',
        this.password,
        err => {
          expect(err).to.be.instanceof(Errors.AuthenticationError)
          return done()
        }
      )
    })

    it('throws an AuthenticationError if the password is wrong', function(done) {
      return this.AuthHandler.login(this.email, 'not-a-pass', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        return done()
      })
    })

    return it("throws an AuthenticationError if the user doesn't have a password", function(done) {
      delete this.user.hashedPassword
      return this.AuthHandler.login(this.email, this.password, err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        return done()
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
      return this.db.users.findOne
        .withArgs({ email: this.email })
        .yields(null, this.user)
    })

    it('picks an unused token, uses it and returns the user id', function(done) {
      return this.AuthHandler.oneTimeLogin(
        this.email,
        this.token,
        (err, userId) => {
          if (err != null) {
            return done(err)
          }
          expect(this.db.oneTimeLoginTokens.findOne).to.have.been.calledWith(
            sinon.match({
              usedAt: { $exists: false }
            })
          )
          expect(this.db.oneTimeLoginTokens.update).to.have.been.calledWith(
            { _id: this.tokenId },
            {
              $set: {
                usedAt: sinon.match.date
              }
            }
          )
          expect(userId).to.equal(this.userId.toString())
          return done()
        }
      )
    })

    it('is case-insensitive relative to the email', function(done) {
      return this.AuthHandler.oneTimeLogin(
        'User@Example.Com',
        this.token,
        (err, userId) => {
          if (err != null) {
            return done(err)
          }
          expect(userId).to.equal(this.userId.toString())
          return done()
        }
      )
    })

    it('throws an AuthenticationError when the token is invalid', function(done) {
      return this.AuthHandler.oneTimeLogin(this.email, 'secret456', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        return done()
      })
    })

    it('throws an AuthenticationError when the token is empty', function(done) {
      return this.AuthHandler.oneTimeLogin(this.email, '', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        return done()
      })
    })

    it('throws an AuthenticationError when the token is the wrong length', function(done) {
      return this.AuthHandler.oneTimeLogin(
        this.email,
        'bad-token-too-long',
        err => {
          expect(err).to.be.instanceof(Errors.AuthenticationError)
          return done()
        }
      )
    })

    it('throws an AuthenticationError when the email has no token', function(done) {
      return this.AuthHandler.oneTimeLogin(
        'unknown@email.com',
        this.token,
        err => {
          expect(err).to.be.instanceof(Errors.AuthenticationError)
          return done()
        }
      )
    })

    return it('throws an AuthenticationError when the user does not exist', function(done) {
      this.db.users.findOne.withArgs({ email: this.email }).yields(null, null)
      return this.AuthHandler.oneTimeLogin(this.email, 'bad-token', err => {
        expect(err).to.be.instanceof(Errors.AuthenticationError)
        return done()
      })
    })
  })

  return describe('generateOneTimeLoginToken', function() {
    it('generates a token and inserts it in the database', function(done) {
      const email = 'user@example.com'
      this.db.users.findOne.yields(null, { email })
      this.db.oneTimeLoginTokens.insert
      this.crypto.randomBytes.returns(Buffer.from([0xde, 0xad, 0xbe, 0xef]))

      return this.AuthHandler.generateOneTimeLoginToken(email, (err, token) => {
        expect(this.db.oneTimeLoginTokens.insert).to.have.been.calledWith({
          email,
          token: 'deadbeef',
          createdAt: sinon.match.date,
          expiresAt: sinon.match.date
        })
        return done()
      })
    })

    return it('throws a UserNotFoundError when the user does not exist', function(done) {
      this.db.users.findOne.yields(null, null)

      return this.AuthHandler.generateOneTimeLoginToken(
        'not-a-user@example.com',
        (err, token) => {
          expect(err).to.be.instanceof(Errors.UserNotFoundError)
          return done()
        }
      )
    })
  })
})