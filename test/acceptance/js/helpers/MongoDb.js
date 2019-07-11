const async = require('async')
const bcrypt = require('bcrypt')
const logger = require('logger-sharelatex')
const { MongoClient } = require('mongodb')
const Settings = require('settings-sharelatex')

module.exports = {
  running: false,
  initing: false,
  callbacks: [],
  db: null,

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
    this._connect(callback)
  },

  _connect(callback) {
    const client = new MongoClient(Settings.mongo.url, {
      useNewUrlParser: true
    })
    client.connect((err, connection) => {
      if (err != null) {
        return callback(err)
      }
      this.db = connection.db(Settings.mongo.db)
      logger.info('MongoDB ready')
      callback()
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
            cb(null, { email, hashedPassword })
          }
        ],
        insertUser: [
          'user',
          ({ user }, cb) => {
            this.db.collection('users').insertOne(user, cb)
          }
        ],
        projects: [
          'insertUser',
          ({ user }, cb) => {
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
            cb(null, projects)
          }
        ],
        insertProjects: [
          'projects',
          ({ projects }, cb) => {
            if (projects.length === 0) {
              return cb(null, [])
            }
            this.db.collection('projects').insertMany(projects, cb)
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
