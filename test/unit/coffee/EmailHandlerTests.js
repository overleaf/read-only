path = require('path')
sinon = require('sinon')
{ expect } = require('chai')
SandboxedModule = require('sandboxed-module')
{ ObjectId } = require('mongojs')

MODULE_PATH = path.join(__dirname, '../../../app/js/EmailHandler.js')

describe 'EmailHandler', ->
	beforeEach ->
		@Settings = {
			email:
				fromAddress: "Overleaf team <welcome@overleaf.com>"
				replyToAddress: "welcome@overleaf.com"
		}
		@logger = {
			info: sinon.stub()
		}
		@EmailSender = {
			sendMail: sinon.stub().yields()
		}
		@EmailHandler = SandboxedModule.require(MODULE_PATH, {
			requires:
				'settings-sharelatex': @Settings
				'logger-sharelatex': @logger
				'./EmailSender': @EmailSender
		})

	describe "sendOneTimeLoginEmail", ->
		it "builds and sends an email", (done) ->
			email = "user@example.com"
			token = "secret123"
			@EmailHandler.sendOneTimeLoginEmail email, token, (err) =>
				if err?
					return done(err)
				expect(@EmailSender.sendMail).to.have.been.calledWith({
					to: email
					from: @Settings.email.fromAddress
					replyTo: @Settings.email.replyToAddress
					subject: "Overleaf Read Only Access"
					text: sinon.match(/secret123/)
					html: sinon.match(/secret123/)
				})
				done()
