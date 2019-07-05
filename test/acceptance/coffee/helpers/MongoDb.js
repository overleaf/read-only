async = require("async")
bcrypt = require("bcrypt")
mongojs = require('mongojs')
logger = require("logger-sharelatex")
Settings = require("settings-sharelatex")

module.exports =
	running: false
	initing: false
	callbacks: []
	db: mongojs(Settings.mongo.url, ['users', 'projects'])

	ensureRunning: (callback) ->
		if @running
			return callback()
		if @initing
			@callbacks.push(callback)
			return
		@initing = true
		@callbacks.push(callback)
		# Force a connection by executing a command
		@db.stats (err) =>
			if !err
				@running = true
				logger.info("MongoDB ready")
			for callback in @callbacks
				callback(err)

	createDummyUser: (params, callback) ->
		{ email, password, numProjects } = params
		async.auto {
			hashedPassword: (cb) =>
				bcrypt.hash(password, 10, cb)
			user: ['hashedPassword', ({ hashedPassword }, cb) =>
				@db.users.insert({
					email: email
					hashedPassword: hashedPassword
				}, cb)
			]
			projects: ['user', ({ user }, cb) =>
				if numProjects == 0
					return cb(null, [])
				projects = []
				for i in [0...numProjects]
					projects.push({
						name: "Project #{i + 1}"
						owner_ref: user._id
						collaberator_refs: []
						lastUpdated: new Date()
						readOnly_refs: []
					})
				@db.projects.insert(projects, cb)
			]
		}, (err, { user, projects }) =>
			if err?
				return callback(err)
			callback(null, Object.assign({
				password: password
				projects: projects
			}, user))
