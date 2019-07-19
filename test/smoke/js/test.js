const child = require('child_process')
let fs = require('fs')
const Settings = require('settings-sharelatex')
const logger = require('logger-sharelatex')
const { expect } = require('chai')

const { port } = Settings.internal.read_only

const cookieFilePath = `/tmp/smoke-test-cookie-${port}.txt`

const buildUrl = path =>
  ` -H 'Expect:' -b ${cookieFilePath} --resolve 'www${Settings.cookieDomain}:${port}:127.0.0.1' http://www${Settings.cookieDomain}:${port}/${path}`

// Change cookie to be non secure so curl will send it
const convertCookieFile = function(callback) {
  fs = require('fs')
  fs.readFile(cookieFilePath, 'utf8', function(err, data) {
    if (err != null) {
      return callback(err)
    }
    const firstTrue = data.indexOf('TRUE')
    const secondTrue = data.indexOf('TRUE', firstTrue + 4)
    const result =
      data.slice(0, secondTrue) + 'FALSE' + data.slice(secondTrue + 4)
    fs.writeFile(cookieFilePath, result, 'utf8', function(err) {
      if (err != null) {
        return callback(err)
      }
      callback()
    })
  })
}

describe('Log in and download project', () =>
  it('should log in and download a project', function(done) {
    const testId = Math.floor(Math.random() * 100000).toString(16)
    const start = new Date()
    logger.log({ testId }, 'tests: starting smoke test')
    let command = `\
curl -H "X-Forwarded-Proto: https" -c ${cookieFilePath} --data "email=${encodeURIComponent(
      Settings.smokeTest.email
    )}&password=${encodeURIComponent(Settings.smokeTest.password)}" ${buildUrl(
      'login'
    )}\
`
    logger.log({ command, testId }, 'running login curl')
    child.exec(command, function(err, stdout, stderr) {
      if (err != null) {
        return done(err)
      }
      logger.log({ stdout, stderr, testId }, 'tests:  got login curl response')

      expect(
        !!stdout.match('Found. Redirecting to /project'),
        'Should redirect'
      ).to.equal(true)

      command = `\
curl -H "X-Forwarded-Proto: https" ${buildUrl(
        `project/${Settings.smokeTest.projectId}`
      )} > /tmp/${Settings.smokeTest.projectId}.zip\
`
      logger.log({ command, testId }, 'tests: running download curl')
      convertCookieFile(function(error) {
        if (error != null) {
          logger.err({ error }, 'tests: error convreing cookiefile')
          return done(error)
        }
        child.exec(command, function(error, stdout, stderr) {
          if (err != null) {
            logger.err({ err: error, stderr }, 'tests: error execing command')
            return done(err)
          }
          logger.log(
            { stdout, stderr, testId },
            'tests: got download curl response'
          )
          command = `\
unzip /tmp/${Settings.smokeTest.projectId}.zip -d /tmp/${Settings.smokeTest.projectId}\
`
          child.exec(command, function(err, stdout, stderr) {
            if (err != null) {
              logger.err({ err }, 'tests: error trying to unzip')
              return done(err)
            }
            expect(
              !!stdout.match(
                `inflating: /tmp/${Settings.smokeTest.projectId}/main.tex`
              ),
              'Should unzip'
            ).to.equal(true)
            logger.log(
              { testId, time_taken: new Date() - start },
              'tests: successfully ran smoke test'
            )
            child.exec(
              `rm -r /tmp/${Settings.smokeTest.projectId} /tmp/${Settings.smokeTest.projectId}.zip`,
              done
            )
          })
        })
      })
    })
  }))
