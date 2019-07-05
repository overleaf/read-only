/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let EmailHandler;
const Settings = require("settings-sharelatex");
const logger = require("logger-sharelatex");

const EmailBuilder = require("./EmailBuilder");
const EmailSender = require("./EmailSender");

module.exports = (EmailHandler = {
	sendOneTimeLoginEmail(email, token, callback) {
		logger.info({ email }, "Sending one-time login message");
		const templateVars = {
			title: "Overleaf Read Only Access",
			message: `\
The link below will log you into Overleaf's read only maintenance site, so you
can download your projects.

The link is valid for one hour or until the maintenance is finished.\
`,
			ctaText: "Access my Projects",
			ctaUrl: `${Settings.siteUrl}/one-time-login?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
		};
		const textBody = EmailBuilder.buildPlainTextBody(templateVars);
		const htmlBody = EmailBuilder.buildHtmlBody(templateVars);
		const mailerParams = {
			to: email,
			from: Settings.email.fromAddress,
			subject: "Overleaf Read Only Access",
			text: textBody,
			html: htmlBody,
			replyTo: Settings.email.replyToAddress
		};
		return EmailSender.sendMail(mailerParams, function(err) {
			if (err != null) {
				logger.err({ err }, 'error sending email');
				return callback(new Error('Cannot send mail'));
			}
			logger.info({ email }, "One-time login message sent");
			return callback();
		});
	}
});
