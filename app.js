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
  if (Settings.behindProxy) {
    app.set('trust proxy', Settings.trustedProxyIps || false)
    app.use(fixForwardedForHeaders)
  }

  app.locals.settings = {
    statusPageUrl: Settings.statusPageUrl
  }

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

/**
 * Handle the X-Original-Forwarded-For header.
 *
 * The nginx ingress sends us the contents of X-Forwarded-For it received in
 * X-Original-Forwarded-For. Express expects all proxy IPs to be in a comma
 * separated list in X-Forwarded-For.
 */
function fixForwardedForHeaders(req, res, next) {
  if (
    req.headers['x-original-forwarded-for'] &&
    req.headers['x-forwarded-for']
  ) {
    req.headers['x-forwarded-for'] =
      req.headers['x-original-forwarded-for'] +
      ', ' +
      req.headers['x-forwarded-for']
  }
  next()
}
