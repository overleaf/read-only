logger = require("logger-sharelatex")
{ isCelebrate } = require('celebrate')

AuthHandler = require("./AuthHandler")
EmailHandler = require("./EmailHandler")
Errors = require("./Errors")

module.exports = AuthController =
	login: (req, res, next) ->
		{ email, password } = req.body
		logger.info({ email }, "received password login request")
		AuthHandler.login email, password, (err, userId) ->
			if err?
				return next(err)
			logger.info({ email, userId }, "successful login")
			req.session.user_id = userId
			res.redirect("/project")

	handleLoginErrors: (err, req, res, next) ->
		if err instanceof Errors.AuthenticationError or isCelebrate(err)
			res.render("home", { failedLogin: true })
		else
			next(err)

	logout: (req, res, next) ->
		req.session.destroy (err) ->
			if err?
				return next(err)
			res.redirect("/")

	oneTimeLogin: (req, res, next) ->
		{ email, token } = req.query
		logger.info({ email }, "received one-time login request")
		AuthHandler.oneTimeLogin email, token, (err, userId) ->
			if err?
				return next(err)
			logger.info({ email, userId }, "successful one-time login")
			req.session.user_id = userId
			res.redirect("/project")

	handleOneTimeLoginErrors: (err, req, res, next) ->
		if err instanceof Errors.AuthenticationError or isCelebrate(err)
			res.render("home", { failedOneTimeLogin: true })
		else
			next(err)

	oneTimeLoginRequestForm: (req, res, next) ->
		res.render('one-time-login-request-form')

	oneTimeLoginRequest: (req, res, next) ->
		{ email } = req.body
		AuthHandler.generateOneTimeLoginToken email, (err, token) ->
			if err?
				if err instanceof Errors.UserNotFoundError
					res.render('one-time-login-request-form', {
						error: "This email address is not registered in Overleaf",
						email: email
					})
				else
					next(err)
			else
				EmailHandler.sendOneTimeLoginEmail email, token, (err) ->
					if err?
						return next(err)
					res.render('one-time-login-email-sent')

	handleOneTimeLoginRequestErrors: (err, req, res, next) ->
		if err instanceof Errors.UserNotFoundError or isCelebrate(err)
			res.render('one-time-login-request-form', {
				error: "This email address is not registered in Overleaf",
				email: req.body.email
			})
		else
			next(err)
