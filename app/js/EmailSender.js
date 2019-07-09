/* eslint-disable
    no-return-assign,
    no-undef,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const nodemailer = require('nodemailer')
const sengridTransport = require('nodemailer-sendgrid-transport')
const Settings = require('settings-sharelatex')
const logger = require('logger-sharelatex')

let mailer = null

module.exports = {
  initialize() {
    switch (Settings.email.transport) {
      case 'sendgrid':
        logger.info('Configuring sendgrid mail transport')
        return (mailer = nodemailer.createTransport(
          sendgridTransport(Settings.email.parameters)
        ))
      case 'smtp':
        logger.info(
          { host: Settings.email.parameters.host },
          'Configuring SMTP mail transport'
        )
        return (mailer = nodemailer.createTransport(Settings.email.parameters))
      default:
        return logger.info('No mail transport configured')
    }
  },

  sendMail(options, callback) {
    if (mailer == null) {
      logger.info(
        { recipient: options.to },
        'Not sending email: transport not configured'
      )
      return callback()
    }
    return mailer.sendMail(options, callback)
  }
}
