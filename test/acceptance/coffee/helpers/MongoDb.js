/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const async = require("async");
const bcrypt = require("bcrypt");
const mongojs = require('mongojs');
const logger = require("logger-sharelatex");
const Settings = require("settings-sharelatex");

module.exports = {
	running: false,
	initing: false,
	callbacks: [],
	db: mongojs(Settings.mongo.url, ['users', 'projects']),

	ensureRunning(callback) {
		if (this.running) {
			return callback();
		}
		if (this.initing) {
			this.callbacks.push(callback);
			return;
		}
		this.initing = true;
		this.callbacks.push(callback);
		// Force a connection by executing a command
		return this.db.stats(err => {
			if (!err) {
				this.running = true;
				logger.info("MongoDB ready");
			}
			return (() => {
				const result = [];
				for (callback of Array.from(this.callbacks)) {
					result.push(callback(err));
				}
				return result;
			})();
		});
	},

	createDummyUser(params, callback) {
		const { email, password, numProjects } = params;
		return async.auto({
			hashedPassword: cb => {
				return bcrypt.hash(password, 10, cb);
			},
			user: ['hashedPassword', ({ hashedPassword }, cb) => {
				return this.db.users.insert({
					email,
					hashedPassword
				}, cb);
			}
			],
			projects: ['user', ({ user }, cb) => {
				if (numProjects === 0) {
					return cb(null, []);
				}
				const projects = [];
				for (let i = 0, end = numProjects, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
					projects.push({
						name: `Project ${i + 1}`,
						owner_ref: user._id,
						collaberator_refs: [],
						lastUpdated: new Date(),
						readOnly_refs: []
					});
				}
				return this.db.projects.insert(projects, cb);
			}
			]
		}, (err, { user, projects }) => {
			if (err != null) {
				return callback(err);
			}
			return callback(null, Object.assign({
				password,
				projects
			}, user));
		});
	}
};
