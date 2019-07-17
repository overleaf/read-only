const logger = require('logger-sharelatex')
const request = require('request')
const Settings = require('settings-sharelatex')
const { ObjectId } = require('mongodb')
const { db } = require('./MongoHandler')

module.exports = {
  getUserProjects,
  getUserProject,
  getProjectDownloadStream
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
  const upstream = request.get({ url, timeout: 30000 })
  return upstream
}
