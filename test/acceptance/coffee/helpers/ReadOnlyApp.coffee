app = require('../../../../app')
require("logger-sharelatex").logger.level("info")
logger = require("logger-sharelatex")
Settings = require("settings-sharelatex")

module.exports =
	running: false
	initing: false
	callbacks: []

	ensureRunning: (callback) ->
		if @running
			return callback()
		if @initing
			@callbacks.push(callback)
			return
		@initing = true
		@callbacks.push(callback)
		app.listen 3038, (err) =>
			if !err
				@running = true
				logger.info("read-only running in dev mode")
			for callback in @callbacks
				callback(err)
