MailDev = require('maildev')
logger = require('logger-sharelatex')

module.exports = {
	running: false
	initing: false
	startCallbacks: []
	emailCallbacks: []
	maildev: new MailDev()

	ensureRunning: (callback) ->
		if @running
			return callback()
		if @initing
			@startCallbacks.push(callback)
			return
		@initing = true
		@startCallbacks.push(callback)
		@maildev.listen (err) =>
			if !err
				@running = true
				@maildev.on('new', (email) => @handleNewEmail(email))
				logger.info("Mock email server ready")
			for callback in @startCallbacks
				callback(err)

	waitForEmail: (callback) ->
		@emailCallbacks.push(callback)

	handleNewEmail: (email) ->
		for callback in @emailCallbacks
			callback(null, email)
		@emailCallbacks = []
}
