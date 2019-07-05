/* eslint-disable
    camelcase,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let HttpController;
const logger = require("logger-sharelatex");
const {db, ObjectId} = require("./MongoHandler");
const request = require("request");
const Settings = require("settings-sharelatex");

module.exports = (HttpController = {
	home(req, res, next) {
		if (req.session.user_id != null) {
			return res.redirect("/project");
		} else {
			return res.render("home");
		}
	},

	projects(req, res, next) {
		let user_id;
		if ((req.session.user_id == null)) {
			res.redirect("/");
			return;
		}
		try {
			user_id = ObjectId(req.session.user_id);
		} catch (error1) {
			const error = error1;
			return next(error);
		}

		logger.log({user_id: user_id.toString()}, "showing project page");
		return db.projects.find({owner_ref: user_id}, function(error, projects) {
			if (error != null) { return next(error); }
			projects = projects.sort(function(a, b) {
				if (a.lastUpdated > b.lastUpdated) {
					return -1;
				} else if (a.lastUpdated < b.lastUpdated) {
					return 1;
				} else {
					return 0;
				}
			});
			return res.render("projects", {projects});
		});
	},

	getProject(req, res, next) {
		let project_id;
		logger.log({project_id}, "downloading project");
		if ((req.session.user_id == null)) {
			logger.err({project_id}, "no user in session, not downloading project");
			res.status(403).end();
			return;
		}

		try {
			project_id = ObjectId(req.params.project_id);
		} catch (error1) {
			const error = error1;
			return next(error);
		}

		return db.projects.findOne({_id: project_id}, function(error, project) {
			if (error != null) { return next(error); }
			if ((project == null)) {
				logger.log({project_id}, "project not found");
				res.status(404).end();
				
			} else if (project.owner_ref.toString() !== req.session.user_id) {
				logger.log({project_id, owner_ref: project.owner_ref.toString(), user_id: req.session.user_id}, "unauthorized project download");
				res.status(403).end();
				
			} else {
				const url = `${Settings.apis.project_archiver.url}/project/${project._id}/zip`;
				logger.log({project_id, url}, "proxying request to project archiver");
				const upstream = request.get({ url });
				upstream.pause();
				res.header("Content-Disposition", `attachment; filename=${project.name}.zip`);
				upstream.on("error", error => next(error));
				upstream.on("end", () => res.end());
				return upstream.on("response", function(response) {
					res.status(response.statusCode);
					upstream.pipe(res);
					return upstream.resume();
				});
			}
		});
	}
});
