http = require('http')
http.globalAgent.maxSockets = 300

MONGO_HOST = process.env['MONGO_HOST'] or "localhost"
MONGO_URL = process.env['MONGO_URL'] or "mongodb://#{MONGO_HOST}/read_only"
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
		url: MONGO_URL

	cookieName: "sharelatex_read_only.sid"
	cookieSessionLength: 5 * 24 * 60 * 60 * 1000
	secureCookie: false
	behindProxy: false
	security:
		sessionSecret: "banana"
