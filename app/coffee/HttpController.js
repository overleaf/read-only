logger = require "logger-sharelatex"
{db, ObjectId} = require "./MongoHandler"
request = require "request"
Settings = require "settings-sharelatex"

module.exports = HttpController =
	home: (req, res, next) ->
		if req.session.user_id?
			res.redirect "/project"
		else
			res.render "home"

	projects: (req, res, next) ->
		if !req.session.user_id?
			res.redirect "/"
			return
		try
			user_id = ObjectId(req.session.user_id)
		catch error
			return next(error)

		logger.log {user_id: user_id.toString()}, "showing project page"
		db.projects.find {owner_ref: user_id}, (error, projects) ->
			return next(error) if error?
			projects = projects.sort (a, b) ->
				if a.lastUpdated > b.lastUpdated
					return -1
				else if a.lastUpdated < b.lastUpdated
					return 1
				else
					return 0
			res.render "projects", projects: projects

	getProject: (req, res, next) ->
		logger.log {project_id}, "downloading project"
		if !req.session.user_id?
			logger.err {project_id}, "no user in session, not downloading project"
			res.status(403).end()
			return

		try
			project_id = ObjectId(req.params.project_id)
		catch error
			return next(error)

		db.projects.findOne {_id: project_id}, (error, project) ->
			return next(error) if error?
			if !project?
				logger.log {project_id}, "project not found"
				res.status(404).end()
				return
			else if project.owner_ref.toString() != req.session.user_id
				logger.log {project_id, owner_ref: project.owner_ref.toString(), user_id: req.session.user_id}, "unauthorized project download"
				res.status(403).end()
				return
			else
				url = "#{Settings.apis.project_archiver.url}/project/#{project._id}/zip"
				logger.log {project_id, url}, "proxying request to project archiver"
				upstream = request.get { url: url }
				upstream.pause()
				res.header("Content-Disposition", "attachment; filename=#{project.name}.zip")
				upstream.on "error", (error) -> next(error)
				upstream.on "end", () -> res.end()
				upstream.on "response", (response) ->
					res.status(response.statusCode)
					upstream.pipe(res)
					upstream.resume()
