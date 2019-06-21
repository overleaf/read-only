Settings = require("settings-sharelatex")
session = require("express-session")
MongoStore = require('connect-mongo')(session)

sessionStore = new MongoStore({
	url: Settings.mongo.url
	collection: "sessions"
})

middleware = session({
	resave: false
	saveUninitialized: false
	secret: Settings.security.sessionSecret
	proxy: Settings.behindProxy
	cookie:
		domain: Settings.cookieDomain
		maxAge: Settings.cookieSessionLength
		secure: Settings.secureCookie
	store: sessionStore
	key: Settings.cookieName
})

module.exports = {
	middleware: middleware
}
