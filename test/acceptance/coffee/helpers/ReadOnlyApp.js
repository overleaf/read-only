/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const app = require('../../../../app');
require("logger-sharelatex").logger.level("info");
const logger = require("logger-sharelatex");
const Settings = require("settings-sharelatex");

module.exports = {
	running: false,
	initing: false,
	callbacks: [],

	ensureRunning(callback) {
		if (this.running) {
			return callback();
		}
		if (this.initing) {
			this.callbacks.push(callback);
			return;
		}
		this.initing = true;
		this.callbacks.push(callback);
		return app.listen(3038, err => {
			if (!err) {
				this.running = true;
				logger.info("read-only running in dev mode");
			}
			return (() => {
				const result = [];
				for (callback of Array.from(this.callbacks)) {
					result.push(callback(err));
				}
				return result;
			})();
		});
	}
};
