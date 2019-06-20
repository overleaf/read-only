http = require('http')
http.globalAgent.maxSockets = 300

MONGO_HOST = process.env['MONGO_HOST'] or "localhost"
PROJECT_ARCHIVER_HOST = process.env['PROJECT_ARCHIVER_HOST'] or "localhost"

module.exports =
	internal:
		read_only:
			host: process.env['LISTEN_ADDRESS'] or "localhost"
			port: process.env['HOST_LISTEN_PORT'] or 3038

	apis:
		project_archiver:
			url: "http://#{PROJECT_ARCHIVER_HOST}:3020"

	mongo:
		url: "mongodb://#{MONGO_HOST}/sharelatex"

	redis:
		web:
			host: process.env['REDIS_HOST'] or "localhost"
			port: process.env['REDIS_PORT'] or "6379"
			password: process.env['REDIS_PASSWORD']

	cookieName: "sharelatex_read_only.sid"
	cookieSessionLength: 5 * 24 * 60 * 60 * 1000
	secureCookie: false
	behindProxy: false
	security:
		sessionSecret: "banana"
