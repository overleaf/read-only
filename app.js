/* eslint-disable
    no-path-concat,
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
const async = require("async");
const Settings = require("settings-sharelatex");
const logger = require("logger-sharelatex");
const express = require("express");
const Metrics = require("metrics-sharelatex");
const Path = require("path");

const EmailSender = require("./app/js/EmailSender");
const MongoHandler = require("./app/js/MongoHandler");
const Router = require("./app/js/Router");

Metrics.initialize("read-only");
logger.initialize("read-only");
EmailSender.initialize();

const app = express();
app.set('views', __dirname + '/app/views');
app.set('view engine', 'pug');
Router.initialize(app);

const { port } = Settings.internal.read_only;
const { host } = Settings.internal.read_only;
if (!module.parent) { // Called directly
	async.series({
		initDb(cb) {
			return MongoHandler.initialize(cb);
		},
		startHttpServer(cb) {
			logger.info("Starting HTTP server");
			return app.listen(port, host, cb);
		}
	}, function(err) {
		if (err != null) {
			throw err;
		}
		return logger.info(`HTTP server ready and listening on ${host}:${port}`);
	});
}

module.exports = app;
