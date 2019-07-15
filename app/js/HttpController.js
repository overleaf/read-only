const logger = require('logger-sharelatex')
const { ObjectId } = require('mongodb')
const { db } = require('./MongoHandler')
const request = require('request')
const Settings = require('settings-sharelatex')

module.exports = {
  home(req, res, next) {
    if (req.session.userId != null) {
      res.redirect('/project')
    } else {
      res.render('home')
    }
  },

  projects(req, res, next) {
    const { user } = res.locals
    logger.log({ userId: user._id.toString() }, 'showing project page')
    db.projects.find({ owner_ref: user._id }).toArray((error, projects) => {
      if (error != null) {
        return next(error)
      }
      projects = projects.sort((a, b) => {
        if (a.lastUpdated > b.lastUpdated) {
          return -1
        } else if (a.lastUpdated < b.lastUpdated) {
          return 1
        } else {
          return 0
        }
      })
      res.render('projects', { projects })
    })
  },

  getProject(req, res, next) {
    const { user } = res.locals
    const { projectId } = req.params
    logger.log({ projectId }, 'downloading project')
    db.projects.findOne({ _id: ObjectId(projectId) }, (error, project) => {
      if (error != null) {
        return next(error)
      }
      if (project == null) {
        logger.log({ projectId }, 'project not found')
        res.status(404).end()
      } else if (!project.owner_ref.equals(user._id)) {
        logger.log(
          {
            projectId,
            owner_ref: project.owner_ref.toString(),
            user: user
          },
          'unauthorized project download'
        )
        res.status(403).end()
      } else {
        const url = `${Settings.apis.project_archiver.url}/project/${project._id}/zip`
        logger.log({ projectId, url }, 'proxying request to project archiver')
        const upstream = request.get({ url })
        upstream.pause()
        res.header(
          'Content-Disposition',
          `attachment; filename=${project.name}.zip`
        )
        upstream.on('error', error => next(error))
        upstream.on('end', () => res.end())
        upstream.on('response', response => {
          res.status(response.statusCode)
          upstream.pipe(res)
          upstream.resume()
        })
      }
    })
  }
}
