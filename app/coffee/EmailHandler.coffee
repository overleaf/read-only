Settings = require("settings-sharelatex")
logger = require("logger-sharelatex")

EmailBuilder = require("./EmailBuilder")
EmailSender = require("./EmailSender")

module.exports = EmailHandler = {
	sendOneTimeLoginEmail: (email, token, callback) ->
		logger.info({ email }, "Sending one-time login message")
		templateVars = {
			title: "Overleaf Read Only Access"
			message: """
The link below will log you into Overleaf's read only maintenance site, so you
can download your projects.

The link is valid for one hour or until the maintenance is finished.
"""
			ctaText: "Access my Projects"
			ctaUrl: "#{Settings.siteUrl}/one-time-login?email=#{encodeURIComponent(email)}&token=#{encodeURIComponent(token)}"
		}
		textBody = EmailBuilder.buildPlainTextBody(templateVars)
		htmlBody = EmailBuilder.buildHtmlBody(templateVars)
		mailerParams = {
			to: email
			from: Settings.email.fromAddress
			subject: "Overleaf Read Only Access"
			text: textBody
			html: htmlBody
			replyTo: Settings.email.replyToAddress
		}
		EmailSender.sendMail mailerParams, (err) ->
			if err?
				logger.err({ err }, 'error sending email')
				return callback(new Error('Cannot send mail'))
			logger.info({ email }, "One-time login message sent")
			callback()
}
