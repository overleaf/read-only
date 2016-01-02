logger = require "logger-sharelatex"
{db, ObjectId} = require "./mongojs"
bcrypt = require "bcrypt"
request = require "request"
Settings = require "settings-sharelatex"

module.exports = HttpController =
	home: (req, res, next) ->
		if req.session.user_id?
			res.redirect "/project"
		else
			res.render "home"
	
	login: (req, res, next) ->
		{email, password} = req.body
		logger.log {email}, "received login request"
		email = email.trim().toLowerCase()
		db.users.findOne {email: email}, (error, user) ->
			return next(error) if error?
			if !user?
				logger.log {email}, "no user found"
				res.render "home", failedLogIn: true
				return
			else
				bcrypt.compare password, user.hashedPassword, (error, match) ->
					return next(error) if error?
					if !match
						logger.log {email}, "incorrect password"
						res.render "home", failedLogIn: true
						return
					else
						user_id = user._id.toString()
						logger.log {email, user_id}, "successful login"
						req.session.user_id = user_id
						res.redirect "/project"
	
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
		if !req.session.user_id?
			res.status(403).end()
			return

		try
			project_id = ObjectId(req.params.project_id)
		catch error
			return next(error)
			
		logger.log {project_id}, "downloading project"

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
				upstream = request.get { url: "#{Settings.apis.project_archiver.url}/project/#{project._id}/zip" }
				upstream.pause()
				res.header("Content-Disposition", "attachment; filename=#{project.name}.zip")
				upstream.on "error", (error) -> next(error)
				upstream.on "end", () -> res.end()
				upstream.on "response", (response) ->
					res.status(response.statusCode)
					upstream.pipe(res)
					upstream.resume()