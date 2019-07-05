// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const Settings = require("settings-sharelatex");
const session = require("express-session");
const MongoStore = require('connect-mongo')(session);

const SESSION_TTL_SECS = 60 * 60;   // 1 hour

const sessionStore = new MongoStore({
	url: Settings.mongo.url,
	collection: "sessions",
	ttl: SESSION_TTL_SECS
});

const middleware = session({
	resave: false,
	saveUninitialized: false,
	secret: Settings.security.sessionSecret,
	proxy: Settings.behindProxy,
	cookie: {
		domain: Settings.cookieDomain,
		secure: Settings.secureCookie
	},
	store: sessionStore,
	key: Settings.cookieName
});

module.exports = {
	middleware
};
