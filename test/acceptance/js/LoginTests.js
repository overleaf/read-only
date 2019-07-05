/* eslint-disable
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const async = require("async");
const { JSDOM } = require("jsdom");
const { expect } = require("chai");
const request = require("request");
const ReadOnlyApp = require("./helpers/ReadOnlyApp");
const MongoDb = require("./helpers/MongoDb");
const MockEmailServer = require("./helpers/MockEmailServer");

describe("ReadOnly", function() {
	const appUrl = path => new URL(path, "http://localhost:3038").toString();
	const parseHtml = html => new JSDOM(html).window.document;

	const validateUserProjectPage = (user, html) => {
		const doc = parseHtml(html);
		const projectLinks = Array.from(doc.querySelectorAll('a[href^="/project/"]'));
		const projects = _.uniq(projectLinks.map(link => link.href.replace('/project/', '')));
		const expectedProjects = user.projects.map(project => project._id.toString());
		return expect(projects).to.have.members(expectedProjects);
	};

	before("Ensure Mongo is running", done => MongoDb.ensureRunning(done));

	before("Prepare dummy data", function(done) {
		return async.mapValuesSeries({
			noProjects: {
				email: "no-projects@example.com",
				password: "secret!",
				numProjects: 0
			},
			oneProject: {
				email: "one-project@example.com",
				password: "shhhhh!",
				numProjects: 1
			},
			twoProjects: {
				email: "two-projects@example.com",
				password: "password123",
				numProjects: 2
			}
		}, (value, key, cb) => {
			return MongoDb.createDummyUser(value, cb);
		}
		, (err, users) => {
			if (err != null) {
				return done(err);
			}
			this.users = users;
			return done();
		});
	});

	before("Ensure read-only is running", done => ReadOnlyApp.ensureRunning(done));

	before("Ensure mock email server is running", done => MockEmailServer.ensureRunning(done));

	describe("home page", () =>
		it("displays a login page", done =>
			request.get(appUrl("/"), (err, res) => {
				if (err != null) {
					return done(err);
				}
				expect(res.statusCode).to.equal(200);
				const doc = parseHtml(res.body);
				const loginForm = doc.querySelector('form[action="/login"]');
				expect(loginForm).to.exist;
				return done();
			})
		)
	);

	describe("password login", () =>
		it("logs the user in and shows the user's projects", function(done) {
			const user = this.users.twoProjects;
			const cookieJar = request.jar();
			return request.post({
				url: appUrl("/login"),
				jar: cookieJar,
				form: {
					email: user.email,
					password: user.password
				},
				followRedirect: res => {
					return res.headers['location'] === '/project';
				},
				followAllRedirects: true
			}, (err, res) => {
				if (err != null) {
					return done(err);
				}
				expect(res.statusCode).to.equal(200);
				validateUserProjectPage(user, res.body);
				return done();
			});
		})
	);

	return describe("one-time login", () =>
		it("sends an email with a one-time login link", function(done) {
			const user = this.users.oneProject;
			const cookieJar = request.jar();
			return async.auto({
				email(cb) {
					return MockEmailServer.waitForEmail(cb);
				},
				requestResponse(cb) {
					return request.post({
						url: appUrl("/one-time-login/request"),
						jar: cookieJar,
						form: {
							email: user.email
						},
						followAllRedirects: true
					}, (err, res) => {
						return cb(err, res);
					});
				},
				loginUrl: ['email', function({ email }, cb) {
					const doc = parseHtml(email.html);
					const link = doc.querySelector('a[href*="one-time-login"]');
					const url = link.href;
					return cb(null, url);
				}
				],
				loginResponse: ['loginUrl', ({ loginUrl }, cb) =>
					request.get({
						url: loginUrl,
						jar: cookieJar
					}, (err, res) => {
						return cb(err, res);
					})
				
				]
			}, (err, { requestResponse, loginResponse }) => {
					if (err != null) {
						return done(err);
					}
					expect(requestResponse.statusCode).to.equal(200);
					expect(loginResponse.statusCode).to.equal(200);
					validateUserProjectPage(user, loginResponse.body);
					return done();
			});
		})
	);
});
