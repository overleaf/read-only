http = require('http')
http.globalAgent.maxSockets = 300

module.exports =
	internal:
		read_only:
			port: 3038
			host: "localhost"
	
	apis:
		project_archiver:
			url: "http://localhost:3020"

	mongo:
		url: 'mongodb://127.0.0.1/sharelatex'
	
	redis:
		web:
			host: "localhost"
			port: "6379"
			password: ""
	
	cookieName: "sharelatex_read_only.sid"
	cookieSessionLength: 5 * 24 * 60 * 60 * 1000
	secureCookie: false
	security:
		sessionSecret: "banana"
