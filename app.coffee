Settings   = require "settings-sharelatex"
logger     = require "logger-sharelatex"
express    = require "express"
bodyParser = require "body-parser"
HttpController = require "./app/js/HttpController"
Metrics    = require "metrics-sharelatex"
Path       = require "path"
redis = require("redis-sharelatex")
rclient = redis.createClient(Settings.redis.web)

Metrics.initialize("read-only")
logger.initialize("read-only")

app = express()
app.use(express.static('public'))
app.set('views', __dirname + '/app/views')
app.set('view engine', 'jade')

session = require("express-session")
RedisStore = require('connect-redis')(session)
sessionStore = new RedisStore(client:rclient)

app.use session
	resave: false
	saveUninitialized: false
	secret: Settings.security.sessionSecret
	cookie:
		domain: Settings.cookieDomain
		maxAge: Settings.cookieSessionLength
		secure: Settings.secureCookie
	store: sessionStore
	key: Settings.cookieName

app.get '/', HttpController.home
app.post "/login", bodyParser.urlencoded(), HttpController.login
app.get "/project", HttpController.projects
app.get "/project/:project_id", HttpController.getProject

app.get '/status', (req, res)->
	res.send('read-only is alive')

port = Settings.internal.read_only.port
host = Settings.internal.read_only.host
app.listen port, host, (error) ->
	throw error if error?
	logger.info "read-only starting up, listening on #{host}:#{port}"
