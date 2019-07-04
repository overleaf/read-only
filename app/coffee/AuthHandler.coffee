_ = require("lodash")
async = require("async")
bcrypt = require("bcrypt")
crypto = require("crypto")
logger = require("logger-sharelatex")

{ db } = require("./MongoHandler")
Errors = require("./Errors")

TOKEN_TTL_MS = 60 * 60 * 1000    # 1 hour
TOKEN_SEARCH_PREFIX_LENGTH = 16  # 8 bytes

module.exports = AuthHandler =
	login: (email, password, callback) ->
		db.users.findOne {email: email.toLowerCase()}, (err, user) ->
			if err?
				return callback(err)
			if !user
				return callback(new Errors.AuthenticationError("user not found"))
			if !user.hashedPassword
				return callback(new Errors.AuthenticationError("user does not have a password"))
			bcrypt.compare password, user.hashedPassword, (err, match) ->
				if err?
					return callback(err)
				if !match
					return callback(new Errors.AuthenticationError("incorrect password"))
				callback(null, user._id.toString())

	oneTimeLogin: (email, token, callback) ->
		now = new Date()
		normalizedEmail = email.toLowerCase()
		async.auto {
			tokenDoc: (cb) =>
				tokenPrefix = token.slice(0, TOKEN_SEARCH_PREFIX_LENGTH)
				tokenPrefixRegexp = new RegExp("^#{_.escapeRegExp(tokenPrefix)}")
				db.oneTimeLoginTokens.findOne({
					email: normalizedEmail
					token: tokenPrefixRegexp
					expiresAt: { $gt: now }
					usedAt: { $exists: false }
				}, cb)
			checkToken: ['tokenDoc', ({ tokenDoc }, cb) =>
				if !tokenDoc
					return cb(new Errors.AuthenticationError("invalid token"))
				if !@_compareTokens(token, tokenDoc.token)
					return cb(new Errors.AuthenticationError("invalid token"))
				cb()
			]
			user: (cb) =>
				db.users.findOne({ email: normalizedEmail }, cb)
			checkUser: ['user', ({ user }, cb) =>
				if !user?
					return cb(new Errors.AuthenticationError("user not found"))
				cb()
			]
			useToken: ['checkToken', 'checkUser', 'tokenDoc', ({ tokenDoc }, cb) =>
				db.oneTimeLoginTokens.update({ _id: tokenDoc._id }, { $set: { usedAt: now } }, cb)
			]
		}, (err, { user }) =>
			if err?
				return callback(err)
			callback(null, user._id.toString())

	generateOneTimeLoginToken: (email, callback) ->
		db.users.findOne { email: email.toLowerCase() }, (err, user) ->
			if err?
				return callback(err)
			if !user?
				return callback(new Errors.UserNotFoundError("user not found"))

			logger.info({ email }, "Generating one-time login token")
			now = new Date()
			expiresAt = new Date(now.getTime() + TOKEN_TTL_MS)
			token = crypto.randomBytes(32).toString('hex')
			doc = {
				email: email
				token: token
				createdAt: now
				expiresAt: expiresAt
			}
			db.oneTimeLoginTokens.insert doc, (err) ->
				if err?
					return callback(err)
				callback(null, token)

	_compareTokens: (token1, token2) ->
		token1Buffer = Buffer.from(token1)
		token2Buffer = Buffer.from(token2)
		if token1Buffer.length != token2Buffer.length
			return false
		if !crypto.timingSafeEqual(token1Buffer, token2Buffer)
			return false
		return true
