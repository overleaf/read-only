async = require "async"
Settings = require "settings-sharelatex"
logger = require "logger-sharelatex"
express = require "express"
Metrics = require "metrics-sharelatex"
Path = require "path"

EmailSender = require "./app/js/EmailSender"
MongoHandler = require "./app/js/MongoHandler"
Router = require "./app/js/Router"

Metrics.initialize("read-only")
logger.initialize("read-only")
EmailSender.initialize()

app = express()
app.set('views', __dirname + '/app/views')
app.set('view engine', 'pug')
Router.initialize(app)

port = Settings.internal.read_only.port
host = Settings.internal.read_only.host
if !module.parent # Called directly
	async.series {
		initDb: (cb) ->
			MongoHandler.initialize(cb)
		startHttpServer: (cb) ->
			logger.info("Starting HTTP server")
			app.listen(port, host, cb)
	}, (err) ->
		if err?
			throw err
		logger.info("HTTP server ready and listening on #{host}:#{port}")

module.exports = app
