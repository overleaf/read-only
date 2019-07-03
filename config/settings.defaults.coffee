http = require('http')
yn = require('yn')

http.globalAgent.maxSockets = 300

MONGO_HOST = process.env['MONGO_HOST'] or "localhost"
MONGO_URL = process.env['MONGO_URL'] or "mongodb://#{MONGO_HOST}/read_only"
PROJECT_ARCHIVER_HOST = process.env['PROJECT_ARCHIVER_HOST'] or "localhost"
HOST_LISTEN_PORT = process.env['HOST_LISTEN_PORT'] or 3038

emailTransportParams = switch process.env['EMAIL_TRANSPORT']
	when "sendgrid" then {
		auth:
			api_key: process.env['SENDGRID_API_KEY']
	}
	when "smtp" then {
		host: process.env['SMTP_HOST']
		port: process.env['SMTP_PORT'] or 25
		auth:
			user: process.env['SMTP_USER']
			pass: process.env['SMTP_PASS']
	}
	else {}

module.exports =
	internal:
		read_only:
			host: process.env['LISTEN_ADDRESS'] or "localhost"
			port: HOST_LISTEN_PORT

	apis:
		project_archiver:
			url: "http://#{PROJECT_ARCHIVER_HOST}:3020"

	mongo:
		url: MONGO_URL

	cookieName: "overleaf_read_only.sid"
	cookieDomain: process.env['COOKIE_DOMAIN']
	secureCookie: yn(process.env['SECURE_COOKIE'], { default: false })
	behindProxy: yn(process.env['BEHIND_PROXY'], { default: false })

	security:
		sessionSecret: process.env['SESSION_SECRET'] or "not-so-secret"

	email:
		fromAddress: "Overleaf <welcome@overleaf.com>"
		replyToAddress: "welcome@overleaf.com"
		transport: process.env['EMAIL_TRANSPORT']
		parameters: emailTransportParams

	siteUrl: process.env['PUBLIC_URL'] or "http://localhost:#{HOST_LISTEN_PORT}"
