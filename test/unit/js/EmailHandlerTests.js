/* eslint-disable
    no-return-assign,
    no-undef,
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
const path = require('path');
const sinon = require('sinon');
const { expect } = require('chai');
const SandboxedModule = require('sandboxed-module');
const { ObjectId } = require('mongojs');

const MODULE_PATH = path.join(__dirname, '../../../app/js/EmailHandler.js');

describe('EmailHandler', function() {
	beforeEach(function() {
		this.Settings = {
			email: {
				fromAddress: "Overleaf team <welcome@overleaf.com>",
				replyToAddress: "welcome@overleaf.com"
			}
		};
		this.logger = {
			info: sinon.stub()
		};
		this.EmailSender = {
			sendMail: sinon.stub().yields()
		};
		return this.EmailHandler = SandboxedModule.require(MODULE_PATH, {
			requires: {
				'settings-sharelatex': this.Settings,
				'logger-sharelatex': this.logger,
				'./EmailSender': this.EmailSender
			}
		});
	});

	return describe("sendOneTimeLoginEmail", () =>
		it("builds and sends an email", function(done) {
			const email = "user@example.com";
			const token = "secret123";
			return this.EmailHandler.sendOneTimeLoginEmail(email, token, err => {
				if (err != null) {
					return done(err);
				}
				expect(this.EmailSender.sendMail).to.have.been.calledWith({
					to: email,
					from: this.Settings.email.fromAddress,
					replyTo: this.Settings.email.replyToAddress,
					subject: "Overleaf Read Only Access",
					text: sinon.match(/secret123/),
					html: sinon.match(/secret123/)
				});
				return done();
			});
		})
	);
});
