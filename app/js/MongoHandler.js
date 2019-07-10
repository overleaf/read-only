const async = require('async')
const mongojs = require('mongojs')
const Settings = require('settings-sharelatex')
const logger = require('logger-sharelatex')

module.exports = {
  db: mongojs(Settings.mongo.url, ['users', 'projects', 'oneTimeLoginTokens']),
  ObjectId: mongojs.ObjectId,

  initialize(callback) {
    logger.info('Initializing Mongo database')
    async.series(
      {
        findUsersByEmail: cb => {
          this.db.users.ensureIndex({ email: 1 }, { background: true }, cb)
        },
        findTokensByEmail: cb => {
          this.db.oneTimeLoginTokens.ensureIndex(
            { email: 1 },
            { background: true },
            cb
          )
        },
        findProjectsByOwner: cb => {
          this.db.projects.ensureIndex(
            { owner_ref: 1 },
            { background: true },
            cb
          )
        },
        expireTokens: cb => {
          this.db.oneTimeLoginTokens.ensureIndex(
            { expiresAt: 1 },
            { background: true, expireAfterSeconds: 0 },
            cb
          )
        }
      },
      err => callback(err)
    )
  }
}
