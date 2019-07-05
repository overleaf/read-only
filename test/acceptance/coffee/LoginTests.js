_ = require("lodash")
async = require("async")
{ JSDOM } = require("jsdom")
{ expect } = require("chai")
request = require("request")
ReadOnlyApp = require("./helpers/ReadOnlyApp")
MongoDb = require("./helpers/MongoDb")
MockEmailServer = require("./helpers/MockEmailServer")

describe "ReadOnly", ->
	appUrl = (path) => new URL(path, "http://localhost:3038").toString()
	parseHtml = (html) => new JSDOM(html).window.document

	validateUserProjectPage = (user, html) =>
		doc = parseHtml(html)
		projectLinks = Array.from(doc.querySelectorAll('a[href^="/project/"]'))
		projects = _.uniq(projectLinks.map((link) -> link.href.replace('/project/', '')))
		expectedProjects = user.projects.map((project) => project._id.toString())
		expect(projects).to.have.members(expectedProjects)

	before "Ensure Mongo is running", (done) ->
		MongoDb.ensureRunning(done)

	before "Prepare dummy data", (done) ->
		async.mapValuesSeries {
			noProjects:
				email: "no-projects@example.com"
				password: "secret!"
				numProjects: 0
			oneProject:
				email: "one-project@example.com"
				password: "shhhhh!"
				numProjects: 1
			twoProjects:
				email: "two-projects@example.com"
				password: "password123"
				numProjects: 2
		}, (value, key, cb) =>
			MongoDb.createDummyUser(value, cb)
		, (err, users) =>
			if err?
				return done(err)
			@users = users
			done()

	before "Ensure read-only is running", (done) ->
		ReadOnlyApp.ensureRunning(done)

	before "Ensure mock email server is running", (done) ->
		MockEmailServer.ensureRunning(done)

	describe "home page", ->
		it "displays a login page", (done) ->
			request.get appUrl("/"), (err, res) =>
				if err?
					return done(err)
				expect(res.statusCode).to.equal(200)
				doc = parseHtml(res.body)
				loginForm = doc.querySelector('form[action="/login"]')
				expect(loginForm).to.exist
				done()

	describe "password login", ->
		it "logs the user in and shows the user's projects", (done) ->
			user = @users.twoProjects
			cookieJar = request.jar()
			request.post {
				url: appUrl("/login")
				jar: cookieJar
				form: {
					email: user.email
					password: user.password
				}
				followRedirect: (res) =>
					return res.headers['location'] == '/project'
				followAllRedirects: true
			}, (err, res) =>
				if err?
					return done(err)
				expect(res.statusCode).to.equal(200)
				validateUserProjectPage(user, res.body)
				done()

	describe "one-time login", ->
		it "sends an email with a one-time login link", (done) ->
			user = @users.oneProject
			cookieJar = request.jar()
			async.auto {
				email: (cb) ->
					MockEmailServer.waitForEmail(cb)
				requestResponse: (cb) ->
					request.post {
						url: appUrl("/one-time-login/request"),
						jar: cookieJar
						form: {
							email: user.email
						}
						followAllRedirects: true
					}, (err, res) =>
						cb(err, res)
				loginUrl: ['email', ({ email }, cb) ->
					doc = parseHtml(email.html)
					link = doc.querySelector('a[href*="one-time-login"]')
					url = link.href
					cb(null, url)
				]
				loginResponse: ['loginUrl', ({ loginUrl }, cb) ->
					request.get {
						url: loginUrl
						jar: cookieJar
					}, (err, res) =>
						cb(err, res)
				]
			}, (err, { requestResponse, loginResponse }) =>
					if err?
						return done(err)
					expect(requestResponse.statusCode).to.equal(200)
					expect(loginResponse.statusCode).to.equal(200)
					validateUserProjectPage(user, loginResponse.body)
					done()
