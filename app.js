const async = require('async')
const Settings = require('settings-sharelatex')
const logger = require('logger-sharelatex')
const express = require('express')
const Metrics = require('metrics-sharelatex')
const Path = require('path')

const EmailSender = require('./app/js/EmailSender')
const MongoHandler = require('./app/js/MongoHandler')
const Router = require('./app/js/Router')

Metrics.initialize('read-only')
logger.initialize('read-only')
EmailSender.initialize()

const app = express()
app.set('views', Path.join(__dirname, 'app/views'))
app.set('view engine', 'pug')
app.set('trust proxy', Settings.behindProxy)
Router.initialize(app)

const { port } = Settings.internal.read_only
const { host } = Settings.internal.read_only
if (!module.parent) {
  // Called directly
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
    function(err) {
      if (err != null) {
        throw err
      }
      logger.info(`HTTP server ready and listening on ${host}:${port}`)
    }
  )
}

module.exports = app
