BodyParser = require("body-parser")
{ celebrate, Joi } = require("celebrate")
express = require("express")
logger = require("logger-sharelatex")
SmokeTest = require("smoke-test-sharelatex")

AuthController = require "./AuthController"
HttpController = require "./HttpController"
SessionMiddleware = require "./SessionMiddleware"

module.exports = Router =
	initialize: (app) ->
		app.use(express.static('public'))
		app.use(SessionMiddleware.middleware)
		app.use(BodyParser.urlencoded({ extended: false }))

		app.get('/', HttpController.home)

		app.post(
			"/login",
			celebrate({
				body: Joi.object({
					email: Joi.string().trim().email().required()
					password: Joi.string().trim().required()
				})
			}),
			AuthController.login,
			AuthController.handleLoginErrors
		)

		app.get("/logout", AuthController.logout)
		app.get("/one-time-login/request", AuthController.oneTimeLoginRequestForm)

		app.post(
			"/one-time-login/request",
			celebrate({
				body: Joi.object({
					email: Joi.string().trim().email().required()
				})
			}),
			AuthController.oneTimeLoginRequest,
			AuthController.handleOneTimeLoginRequestErrors
		)

		app.get(
			"/one-time-login",
			celebrate({
				query: Joi.object({
					email: Joi.string().email().required()
					token: Joi.string().regex(/^[0-9a-f]{64}$/, 'token').required()
				})
			})
			AuthController.oneTimeLogin,
			AuthController.handleOneTimeLoginErrors
		)

		app.get("/project", HttpController.projects)
		app.get("/project/:project_id", HttpController.getProject)

		app.get '/status', (req, res)->
			logger.log "hit status"
			res.send('read-only is alive')

		app.get '/health_check', SmokeTest.run(__dirname + "../../../test/smoke/js/test.js", 30000)
