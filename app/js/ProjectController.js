const logger = require('logger-sharelatex')
const ProjectHandler = require('./ProjectHandler')
const { expressify } = require('./Utils')

module.exports = {
  home,
  projects: expressify(projects),
  getProject: expressify(getProject)
}

function home(req, res, next) {
  res.redirect('/project')
}

async function projects(req, res, next) {
  const { user } = res.locals
  logger.log({ userId: user._id.toString() }, 'showing project page')
  const projects = await ProjectHandler.getUserProjects(user)
  res.render('projects', { projects })
}

async function getProject(req, res, next) {
  const { user } = res.locals
  const { projectId } = req.params
  logger.log({ projectId }, 'downloading project')
  const project = await ProjectHandler.getUserProject(user, projectId)
  if (project == null) {
    logger.log({ projectId }, 'project not found')
    return res.status(404).end()
  }
  const upstream = ProjectHandler.getProjectDownloadStream(project)
  upstream.pause()
  res.header('Content-Disposition', `attachment; filename=${project.name}.zip`)
  upstream.on('error', error => next(error))
  upstream.on('end', () => res.end())
  upstream.on('response', response => {
    res.status(response.statusCode)
    upstream.pipe(res)
    upstream.resume()
  })
}
