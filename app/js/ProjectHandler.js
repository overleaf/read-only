const logger = require('logger-sharelatex')
const request = require('request')
const requestPromise = require('request-promise-native')
const Settings = require('settings-sharelatex')
const { ObjectId } = require('mongodb')
const { db } = require('./MongoHandler')

const REQUEST_TIMEOUT_MS = 30000

module.exports = {
  getUserProjects,
  getUserProject,
  getProjectDownloadStream,
  isProjectArchiverHealthy
}

async function getUserProjects(user) {
  return db.projects
    .find({ owner_ref: user._id })
    .sort('lastUpdated', -1)
    .toArray()
}

async function getUserProject(user, projectId) {
  return db.projects.findOne({ _id: ObjectId(projectId), owner_ref: user._id })
}

function getProjectDownloadStream(project) {
  const url = `${Settings.apis.project_archiver.url}/project/${project._id}/zip`
  logger.log(
    { projectId: project._id, url },
    'proxying request to project archiver'
  )
  const upstream = request.get({ url, timeout: REQUEST_TIMEOUT_MS })
  return upstream
}

async function isProjectArchiverHealthy() {
  const url = `${Settings.apis.project_archiver.url}/health_check`
  try {
    await requestPromise({ url, timeout: REQUEST_TIMEOUT_MS })
  } catch (err) {
    logger.error({ err }, 'Project archiver unhealthy')
    return false
  }
  return true
}
