const { startApp } = require('../../../../app')
const logger = require('logger-sharelatex')

module.exports = {
  running: false,
  initing: false,
  callbacks: [],

  ensureRunning(callback) {
    if (this.running) {
      return callback()
    }
    if (this.initing) {
      this.callbacks.push(callback)
      return
    }
    this.initing = true
    this.callbacks.push(callback)
    startApp('localhost', 3038, err => {
      if (err == null) {
        this.running = true
        logger.info('read-only running in dev mode')
      }
      for (callback of this.callbacks) {
        callback(err)
      }
    })
  }
}
