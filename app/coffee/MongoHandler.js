async = require "async"
mongojs = require "mongojs"
Settings = require "settings-sharelatex"
logger = require "logger-sharelatex"

module.exports = MongoHandler = {
	db: mongojs(Settings.mongo.url, ["users", "projects", "oneTimeLoginTokens"])
	ObjectId: mongojs.ObjectId

	initialize: (callback) ->
		logger.info("Initializing Mongo database")
		async.series {
			findUsersByEmail: (cb) =>
				@db.users.ensureIndex({ email: 1 }, { background: true }, cb)
			findTokensByEmail: (cb) =>
				@db.oneTimeLoginTokens.ensureIndex({ email: 1 }, { background: true }, cb)
			findProjectsByOwner: (cb) =>
				@db.projects.ensureIndex({ owner_ref: 1 }, { background: true }, cb)
			expireTokens: (cb) =>
				@db.oneTimeLoginTokens.ensureIndex(
					{ expiresAt: 1 },
					{ background: true, expireAfterSeconds: 0 },
					cb
				)
		}, (err) ->
			callback(err)
}
