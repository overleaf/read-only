const logger = require('logger-sharelatex')

const MongoHandler = require('./MongoHandler')
const ProjectHandler = require('./ProjectHandler')
const { expressify } = require('./Utils')

module.exports = {
  status,
  healthCheck: expressify(healthCheck)
}

function status(req, res) {
  logger.log('hit status')
  res.send('read-only is alive')
}

async function healthCheck(req, res) {
  const mongoHealthy = await MongoHandler.isHealthy()
  if (!mongoHealthy) {
    return res.status(500).send('No connection to MongoDB')
  }
  const projectArchiverHealthy = await ProjectHandler.isProjectArchiverHealthy()
  if (!projectArchiverHealthy) {
    return res.status(500).send('Connection to project archiver unhealthy')
  }
  res.status(200).send('read-only is healthy')
}
