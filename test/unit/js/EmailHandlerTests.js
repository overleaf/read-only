const path = require('path')
const sinon = require('sinon')
const { expect } = require('chai')
const SandboxedModule = require('sandboxed-module')

const MODULE_PATH = path.join(__dirname, '../../../app/js/EmailHandler.js')

describe('EmailHandler', function() {
  beforeEach(function() {
    this.Settings = {
      email: {
        fromAddress: 'Overleaf team <welcome@overleaf.com>',
        replyToAddress: 'welcome@overleaf.com'
      }
    }
    this.logger = {
      info: sinon.stub()
    }
    this.EmailSender = {
      sendMail: sinon.stub().yields()
    }
    this.EmailHandler = SandboxedModule.require(MODULE_PATH, {
      requires: {
        'settings-sharelatex': this.Settings,
        'logger-sharelatex': this.logger,
        './EmailSender': this.EmailSender
      }
    })
  })

  describe('sendOneTimeLoginEmail', function() {
    return it('builds and sends an email', function(done) {
      const email = 'user@example.com'
      const token = 'secret123'
      this.EmailHandler.sendOneTimeLoginEmail(email, token, err => {
        if (err != null) {
          return done(err)
        }
        expect(this.EmailSender.sendMail).to.have.been.calledWith({
          to: email,
          from: this.Settings.email.fromAddress,
          replyTo: this.Settings.email.replyToAddress,
          subject: 'Overleaf Read Only Access',
          text: sinon.match(/secret123/),
          html: sinon.match(/secret123/)
        })
        done()
      })
    })
  })
})
