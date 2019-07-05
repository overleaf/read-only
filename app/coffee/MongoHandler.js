/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let MongoHandler;
const async = require("async");
const mongojs = require("mongojs");
const Settings = require("settings-sharelatex");
const logger = require("logger-sharelatex");

module.exports = (MongoHandler = {
	db: mongojs(Settings.mongo.url, ["users", "projects", "oneTimeLoginTokens"]),
	ObjectId: mongojs.ObjectId,

	initialize(callback) {
		logger.info("Initializing Mongo database");
		return async.series({
			findUsersByEmail: cb => {
				return this.db.users.ensureIndex({ email: 1 }, { background: true }, cb);
			},
			findTokensByEmail: cb => {
				return this.db.oneTimeLoginTokens.ensureIndex({ email: 1 }, { background: true }, cb);
			},
			findProjectsByOwner: cb => {
				return this.db.projects.ensureIndex({ owner_ref: 1 }, { background: true }, cb);
			},
			expireTokens: cb => {
				return this.db.oneTimeLoginTokens.ensureIndex(
					{ expiresAt: 1 },
					{ background: true, expireAfterSeconds: 0 },
					cb
				);
			}
		}, err => callback(err));
	}
});
