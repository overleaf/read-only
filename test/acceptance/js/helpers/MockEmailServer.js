/* eslint-disable
    no-return-assign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const MailDev = require('maildev')
const logger = require('logger-sharelatex')

module.exports = {
  running: false,
  initing: false,
  startCallbacks: [],
  emailCallbacks: [],
  maildev: new MailDev(),

  ensureRunning(callback) {
    if (this.running) {
      return callback()
    }
    if (this.initing) {
      this.startCallbacks.push(callback)
      return
    }
    this.initing = true
    this.startCallbacks.push(callback)
    return this.maildev.listen(err => {
      if (!err) {
        this.running = true
        this.maildev.on('new', email => this.handleNewEmail(email))
        logger.info('Mock email server ready')
      }
      return (() => {
        const result = []
        for (callback of Array.from(this.startCallbacks)) {
          result.push(callback(err))
        }
        return result
      })()
    })
  },

  waitForEmail(callback) {
    return this.emailCallbacks.push(callback)
  },

  handleNewEmail(email) {
    for (const callback of Array.from(this.emailCallbacks)) {
      callback(null, email)
    }
    return (this.emailCallbacks = [])
  }
}
