const { callbackify } = require('util')
const { MongoClient } = require('mongodb')
const Settings = require('settings-sharelatex')
const logger = require('logger-sharelatex')

// Global collections object
const db = {}

module.exports = {
  db,
  initialize: callbackify(initialize),
  promises: {
    initialize
  }
}

async function initialize() {
  logger.info('Initializing Mongo database')
  await _connect()
  await _createIndexes()
}

async function _connect() {
  const client = new MongoClient(Settings.mongo.url, { useNewUrlParser: true })
  const connection = await client.connect()
  const _db = connection.db(Settings.mongo.db)
  db.users = _db.collection('users')
  db.projects = _db.collection('projects')
  db.oneTimeLoginTokens = _db.collection('oneTimeLoginTokens')
}

async function _createIndexes() {
  await db.users.createIndex({ email: 1 }, { background: true })
  await db.oneTimeLoginTokens.createIndex({ email: 1 }, { background: true })
  await db.oneTimeLoginTokens.createIndex(
    { expiresAt: 1 },
    { background: true, expireAfterSeconds: 0 }
  )
  await db.projects.createIndex({ owner_ref: 1 }, { background: true })
}
