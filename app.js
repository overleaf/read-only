const async = require('async')
const Settings = require('settings-sharelatex')
const logger = require('logger-sharelatex')
const express = require('express')
const Metrics = require('metrics-sharelatex')
const Path = require('path')

const EmailSender = require('./app/js/EmailSender')
const MongoHandler = require('./app/js/MongoHandler')
const Router = require('./app/js/Router')

module.exports = { startApp }

if (!module.parent) {
  // Called directly
  const { host, port } = Settings.internal.read_only

  startApp(host, port, err => {
    if (err != null) {
      throw err
    }
    logger.info(`HTTP server ready and listening on ${host}:${port}`)
  })
}

function startApp(host, port, callback) {
  const app = express()
  app.set('views', Path.join(__dirname, 'app/views'))
  app.set('view engine', 'pug')
  app.set('trust proxy', Settings.behindProxy)
  Router.initialize(app)
  Metrics.initialize('read-only')
  logger.initialize('read-only')
  EmailSender.initialize()

  async.series(
    {
      initDb(cb) {
        MongoHandler.initialize(cb)
      },
      startHttpServer(cb) {
        logger.info('Starting HTTP server')
        app.listen(port, host, cb)
      }
    },
    callback
  )
}
