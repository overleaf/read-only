const { callbackify } = require('util')
const { MongoClient } = require('mongodb')
const Settings = require('settings-sharelatex')
const logger = require('logger-sharelatex')

// Native DB object
let nativeDb

// Exported DB object whose properties are the individual collections
const db = {}

module.exports = {
  db,
  isHealthy,
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

async function isHealthy() {
  if (nativeDb == null) {
    return false
  }
  try {
    await nativeDb.admin().ping()
  } catch (err) {
    logger.log({ err }, 'MongoDB did not respond to ping')
    return false
  }
  return true
}

async function _connect() {
  const client = new MongoClient(Settings.mongo.url, {
    useNewUrlParser: true
  })
  await client.connect()
  nativeDb = client.db(Settings.mongo.db)
  db.users = nativeDb.collection('users')
  db.projects = nativeDb.collection('projects')
  db.oneTimeLoginTokens = nativeDb.collection('oneTimeLoginTokens')
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
