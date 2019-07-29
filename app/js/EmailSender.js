const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')
const Settings = require('settings-sharelatex')
const logger = require('logger-sharelatex')

let mailer = null

module.exports = {
  initialize() {
    switch (Settings.email.transport) {
      case 'sendgrid':
        logger.info('Configuring sendgrid mail transport')
        mailer = nodemailer.createTransport(
          sendgridTransport(Settings.email.parameters)
        )
        break
      case 'smtp':
        logger.info(
          { host: Settings.email.parameters.host },
          'Configuring SMTP mail transport'
        )
        mailer = nodemailer.createTransport(Settings.email.parameters)
        break
      default:
        logger.info('No mail transport configured')
        break
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
    mailer.sendMail(options, callback)
  }
}
