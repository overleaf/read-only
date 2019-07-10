const logger = require('logger-sharelatex')
const { db, ObjectId } = require('./MongoHandler')
const request = require('request')
const Settings = require('settings-sharelatex')

module.exports = {
  home(req, res, next) {
    if (req.session.user_id != null) {
      res.redirect('/project')
    } else {
      res.render('home')
    }
  },

  projects(req, res, next) {
    let userId
    if (req.session.user_id == null) {
      res.redirect('/')
      return
    }
    try {
      userId = ObjectId(req.session.user_id)
    } catch (error1) {
      const error = error1
      return next(error)
    }

    logger.log({ userId: userId.toString() }, 'showing project page')
    db.projects.find({ owner_ref: userId }, function(error, projects) {
      if (error != null) {
        return next(error)
      }
      projects = projects.sort(function(a, b) {
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
    let projectId
    logger.log({ projectId }, 'downloading project')
    if (req.session.user_id == null) {
      logger.err({ projectId }, 'no user in session, not downloading project')
      res.status(403).end()
      return
    }

    try {
      projectId = ObjectId(req.params.project_id)
    } catch (error1) {
      const error = error1
      return next(error)
    }

    db.projects.findOne({ _id: projectId }, function(error, project) {
      if (error != null) {
        return next(error)
      }
      if (project == null) {
        logger.log({ projectId }, 'project not found')
        res.status(404).end()
      } else if (project.owner_ref.toString() !== req.session.user_id) {
        logger.log(
          {
            projectId,
            owner_ref: project.owner_ref.toString(),
            userId: req.session.user_id
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
        upstream.on('response', function(response) {
          res.status(response.statusCode)
          upstream.pipe(res)
          upstream.resume()
        })
      }
    })
  }
}
