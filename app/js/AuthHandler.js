const _ = require('lodash')
const async = require('async')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const logger = require('logger-sharelatex')

const { db } = require('./MongoHandler')
const Errors = require('./Errors')

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const TOKEN_SEARCH_PREFIX_LENGTH = 16 // 8 bytes

module.exports = {
  login(email, password, callback) {
    db.users.findOne({ email: email.toLowerCase() }, function(err, user) {
      if (err != null) {
        return callback(err)
      }
      if (!user) {
        return callback(new Errors.AuthenticationError('user not found'))
      }
      if (!user.hashedPassword) {
        return callback(
          new Errors.AuthenticationError('user does not have a password')
        )
      }
      bcrypt.compare(password, user.hashedPassword, function(err, match) {
        if (err != null) {
          return callback(err)
        }
        if (!match) {
          return callback(new Errors.AuthenticationError('incorrect password'))
        }
        callback(null, user._id.toString())
      })
    })
  },

  oneTimeLogin(email, token, callback) {
    const now = new Date()
    const normalizedEmail = email.toLowerCase()
    async.auto(
      {
        tokenDoc: cb => {
          const tokenPrefix = token.slice(0, TOKEN_SEARCH_PREFIX_LENGTH)
          const tokenPrefixRegexp = new RegExp(
            `^${_.escapeRegExp(tokenPrefix)}`
          )
          db.oneTimeLoginTokens.findOne(
            {
              email: normalizedEmail,
              token: tokenPrefixRegexp,
              expiresAt: { $gt: now },
              usedAt: { $exists: false }
            },
            cb
          )
        },
        checkToken: [
          'tokenDoc',
          ({ tokenDoc }, cb) => {
            if (!tokenDoc) {
              return cb(new Errors.AuthenticationError('invalid token'))
            }
            if (!this._compareTokens(token, tokenDoc.token)) {
              return cb(new Errors.AuthenticationError('invalid token'))
            }
            cb()
          }
        ],
        user: cb => {
          db.users.findOne({ email: normalizedEmail }, cb)
        },
        checkUser: [
          'user',
          ({ user }, cb) => {
            if (user == null) {
              return cb(new Errors.AuthenticationError('user not found'))
            }
            cb()
          }
        ],
        useToken: [
          'checkToken',
          'checkUser',
          'tokenDoc',
          ({ tokenDoc }, cb) => {
            db.oneTimeLoginTokens.updateOne(
              { _id: tokenDoc._id },
              { $set: { usedAt: now } },
              cb
            )
          }
        ]
      },
      (err, { user }) => {
        if (err != null) {
          return callback(err)
        }
        callback(null, user._id.toString())
      }
    )
  },

  generateOneTimeLoginToken(email, callback) {
    db.users.findOne({ email: email.toLowerCase() }, function(err, user) {
      if (err != null) {
        return callback(err)
      }
      if (user == null) {
        return callback(new Errors.UserNotFoundError('user not found'))
      }

      logger.info({ email }, 'Generating one-time login token')
      const now = new Date()
      const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS)
      const token = crypto.randomBytes(32).toString('hex')
      const doc = {
        email,
        token,
        createdAt: now,
        expiresAt
      }
      db.oneTimeLoginTokens.insertOne(doc, function(err) {
        if (err != null) {
          return callback(err)
        }
        callback(null, token)
      })
    })
  },

  _compareTokens(token1, token2) {
    const token1Buffer = Buffer.from(token1)
    const token2Buffer = Buffer.from(token2)
    if (token1Buffer.length !== token2Buffer.length) {
      return false
    }
    if (!crypto.timingSafeEqual(token1Buffer, token2Buffer)) {
      return false
    }
    return true
  }
}
