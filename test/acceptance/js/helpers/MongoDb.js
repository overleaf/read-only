const async = require('async')
const bcrypt = require('bcrypt')
const mongojs = require('mongojs')
const logger = require('logger-sharelatex')
const Settings = require('settings-sharelatex')

module.exports = {
  running: false,
  initing: false,
  callbacks: [],
  db: mongojs(Settings.mongo.url, ['users', 'projects']),

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
    // Force a connection by executing a command
    this.db.stats(err => {
      if (!err) {
        this.running = true
        logger.info('MongoDB ready')
      }
      for (callback of this.callbacks) {
        callback(err)
      }
    })
  },

  createDummyUser(params, callback) {
    const { email, password, numProjects } = params
    async.auto(
      {
        hashedPassword: cb => {
          bcrypt.hash(password, 10, cb)
        },
        user: [
          'hashedPassword',
          ({ hashedPassword }, cb) => {
            this.db.users.insert(
              {
                email,
                hashedPassword
              },
              cb
            )
          }
        ],
        projects: [
          'user',
          ({ user }, cb) => {
            if (numProjects === 0) {
              return cb(null, [])
            }
            const projects = []
            for (let i = 0; i < numProjects; i++) {
              projects.push({
                name: `Project ${i + 1}`,
                owner_ref: user._id,
                collaberator_refs: [],
                lastUpdated: new Date(),
                readOnly_refs: []
              })
            }
            this.db.projects.insert(projects, cb)
          }
        ]
      },
      (err, { user, projects }) => {
        if (err != null) {
          return callback(err)
        }
        callback(
          null,
          Object.assign(
            {
              password,
              projects
            },
            user
          )
        )
      }
    )
  }
}
