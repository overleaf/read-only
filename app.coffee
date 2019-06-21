Settings   = require "settings-sharelatex"
logger     = require "logger-sharelatex"
express    = require "express"
bodyParser = require "body-parser"
Metrics    = require "metrics-sharelatex"
Path       = require "path"

HttpController = require "./app/js/HttpController"
SessionMiddleware = require "./app/js/SessionMiddleware"

Metrics.initialize("read-only")
logger.initialize("read-only")

app = express()
app.use(express.static('public'))
app.set('views', __dirname + '/app/views')
app.set('view engine', 'pug')

app.use(SessionMiddleware.middleware)

app.get '/', HttpController.home
app.post "/login", bodyParser.urlencoded(), HttpController.login
app.get "/project", HttpController.projects
app.get "/project/:project_id", HttpController.getProject

app.get '/status', (req, res)->
	logger.log "hit status"
	res.send('read-only is alive')

smokeTest = require "smoke-test-sharelatex"
app.get '/health_check', smokeTest.run(__dirname + "/test/smoke/js/test.js", 30000)

port = Settings.internal.read_only.port
host = Settings.internal.read_only.host
app.listen port, host, (error) ->
	throw error if error?
	logger.info "read-only starting up, listening on #{host}:#{port}"
