Settings = require("settings-sharelatex")
session = require("express-session")
MongoStore = require('connect-mongo')(session)

SESSION_TTL_SECS = 60 * 60   # 1 hour

sessionStore = new MongoStore({
	url: Settings.mongo.url
	collection: "sessions"
	ttl: SESSION_TTL_SECS
})

middleware = session({
	resave: false
	saveUninitialized: false
	secret: Settings.security.sessionSecret
	proxy: Settings.behindProxy
	cookie:
		domain: Settings.cookieDomain
		secure: Settings.secureCookie
	store: sessionStore
	key: Settings.cookieName
})

module.exports = {
	middleware: middleware
}
