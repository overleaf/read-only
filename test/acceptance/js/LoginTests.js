const _ = require('lodash')
const async = require('async')
const { JSDOM } = require('jsdom')
const { expect } = require('chai')
const request = require('request')
const ReadOnlyApp = require('./helpers/ReadOnlyApp')
const MongoDb = require('./helpers/MongoDb')
const MockEmailServer = require('./helpers/MockEmailServer')

describe('ReadOnly', function() {
  const appUrl = path => new URL(path, 'http://localhost:3038').toString()
  const parseHtml = html => new JSDOM(html).window.document

  const validateUserProjectPage = (user, html) => {
    const doc = parseHtml(html)
    const projectLinks = Array.from(
      doc.querySelectorAll('a[href^="/project/"]')
    )
    const projects = _.uniq(
      projectLinks.map(link => link.href.replace('/project/', ''))
    )
    const expectedProjects = user.projects.map(project =>
      project._id.toString()
    )
    expect(projects).to.have.members(expectedProjects)
  }

  before('Ensure Mongo is running', function(done) {
    return MongoDb.ensureRunning(done)
  })

  before('Prepare dummy data', function(done) {
    async.mapValuesSeries(
      {
        noProjects: {
          email: 'no-projects@example.com',
          password: 'secret!',
          numProjects: 0
        },
        oneProject: {
          email: 'one-project@example.com',
          password: 'shhhhh!',
          numProjects: 1
        },
        twoProjects: {
          email: 'two-projects@example.com',
          password: 'password123',
          numProjects: 2
        }
      },
      (value, key, cb) => {
        MongoDb.createDummyUser(value, cb)
      },
      (err, users) => {
        if (err != null) {
          return done(err)
        }
        this.users = users
        done()
      }
    )
  })

  before('Ensure read-only is running', function(done) {
    return ReadOnlyApp.ensureRunning(done)
  })

  before('Ensure mock email server is running', function(done) {
    return MockEmailServer.ensureRunning(done)
  })

  describe('home page', function() {
    return it('displays a login page', function(done) {
      return request.get(appUrl('/'), (err, res) => {
        if (err != null) {
          return done(err)
        }
        expect(res.statusCode).to.equal(200)
        const doc = parseHtml(res.body)
        const loginForm = doc.querySelector('form[action="/login"]')
        expect(loginForm).to.exist
        done()
      })
    })
  })

  describe('password login', function() {
    return it("logs the user in and shows the user's projects", function(done) {
      const user = this.users.twoProjects
      const cookieJar = request.jar()
      async.auto(
        {
          loginForm: cb => {
            request.get(
              {
                url: appUrl('/'),
                jar: cookieJar
              },
              (err, res) => {
                cb(err, res)
              }
            )
          },
          csrfToken: [
            'loginForm',
            ({ loginForm }, cb) => {
              const doc = parseHtml(loginForm.body)
              const csrfToken = doc.querySelector('input[name="_csrf"]').value
              cb(null, csrfToken)
            }
          ],
          login: [
            'csrfToken',
            ({ csrfToken }, cb) => {
              console.log({ csrfToken })
              request.post(
                {
                  url: appUrl('/login'),
                  jar: cookieJar,
                  form: {
                    _csrf: csrfToken,
                    email: user.email,
                    password: user.password
                  },
                  followRedirect: res => {
                    return res.headers['location'] === '/project'
                  },
                  followAllRedirects: true
                },
                (err, res) => {
                  cb(err, res)
                }
              )
            }
          ]
        },
        (err, { login }) => {
          if (err != null) {
            return done(err)
          }
          expect(login.statusCode).to.equal(200)
          validateUserProjectPage(user, login.body)
          done()
        }
      )
    })
  })

  describe('one-time login', function() {
    return it('sends an email with a one-time login link', function(done) {
      const user = this.users.oneProject
      const cookieJar = request.jar()
      async.auto(
        {
          email(cb) {
            MockEmailServer.waitForEmail(cb)
          },
          requestResponseForm: cb => {
            request.get(
              {
                url: appUrl('/read-only/one-time-login/request'),
                jar: cookieJar
              },
              (err, res) => {
                cb(err, res)
              }
            )
          },
          csrfToken: [
            'requestResponseForm',
            ({ requestResponseForm }, cb) => {
              const doc = parseHtml(requestResponseForm.body)
              const csrfToken = doc.querySelector('input[name="_csrf"]').value
              cb(null, csrfToken)
            }
          ],
          requestResponse: [
            'csrfToken',
            ({ csrfToken }, cb) => {
              request.post(
                {
                  url: appUrl('/read-only/one-time-login/request'),
                  jar: cookieJar,
                  form: {
                    _csrf: csrfToken,
                    email: user.email
                  },
                  followAllRedirects: true
                },
                (err, res) => {
                  cb(err, res)
                }
              )
            }
          ],
          loginUrl: [
            'email',
            function({ email }, cb) {
              const doc = parseHtml(email.html)
              const link = doc.querySelector('a[href*="one-time-login"]')
              const url = link.href
              cb(null, url)
            }
          ],
          loginResponse: [
            'loginUrl',
            ({ loginUrl }, cb) =>
              request.get(
                {
                  url: loginUrl,
                  jar: cookieJar
                },
                (err, res) => {
                  cb(err, res)
                }
              )
          ]
        },
        (err, { requestResponse, loginResponse }) => {
          if (err != null) {
            return done(err)
          }
          expect(requestResponse.statusCode).to.equal(200)
          expect(loginResponse.statusCode).to.equal(200)
          validateUserProjectPage(user, loginResponse.body)
          done()
        }
      )
    })
  })
})
