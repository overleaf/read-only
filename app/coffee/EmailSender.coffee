nodemailer = require("nodemailer")
sengridTransport = require("nodemailer-sendgrid-transport")
Settings = require("settings-sharelatex")
logger = require('logger-sharelatex')

mailer = null

module.exports = {
	initialize: () ->
		switch Settings.email.transport
			when "sendgrid"
				logger.info("Configuring sendgrid mail transport")
				mailer = nodemailer.createTransport(sendgridTransport(Settings.email.parameters))
			when "smtp"
				logger.info({ host: Settings.email.parameters.host }, "Configuring SMTP mail transport")
				mailer = nodemailer.createTransport(Settings.email.parameters)
			else
				logger.info("No mail transport configured")

	sendMail: (options, callback) ->
		if !mailer?
			logger.info({ recipient: options.to }, "Not sending email: transport not configured")
			return callback()
		mailer.sendMail(options, callback)
}
