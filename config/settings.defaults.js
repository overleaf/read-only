const http = require('http')
const yn = require('yn')

http.globalAgent.maxSockets = 300

const MONGO_HOST = process.env['MONGO_HOST'] || 'localhost'
const MONGO_URL =
  process.env['MONGO_URL'] || `mongodb://${MONGO_HOST}/read_only`
const PROJECT_ARCHIVER_HOST =
  process.env['PROJECT_ARCHIVER_HOST'] || 'localhost'
const HOST_LISTEN_PORT = process.env['HOST_LISTEN_PORT'] || 3038

let emailTransportParams
switch (process.env['EMAIL_TRANSPORT']) {
  case 'sendgrid':
    emailTransportParams = {
      auth: {
        api_key: process.env['SENDGRID_API_KEY']
      }
    }
    break
  case 'smtp':
    emailTransportParams = {
      host: process.env['SMTP_HOST'],
      port: process.env['SMTP_PORT'] || 25,
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS']
      }
    }
    break
  default:
    emailTransportParams = {}
}

module.exports = {
  behindProxy: yn(process.env['BEHIND_PROXY'], { default: false }),
  trustedProxyIps: process.env['TRUSTED_PROXY_IPS'],
  cookieDomain: process.env['COOKIE_DOMAIN'],
  cookieName: 'overleaf_read_only.sid',
  secureCookie: yn(process.env['SECURE_COOKIE'], { default: false }),

  apis: {
    project_archiver: {
      url: `http://${PROJECT_ARCHIVER_HOST}:3020`
    }
  },

  email: {
    fromAddress: 'Overleaf <welcome@overleaf.com>',
    replyToAddress: 'welcome@overleaf.com',
    transport: process.env['EMAIL_TRANSPORT'],
    parameters: emailTransportParams
  },

  internal: {
    read_only: {
      host: process.env['LISTEN_ADDRESS'] || 'localhost',
      port: HOST_LISTEN_PORT
    }
  },

  mongo: {
    url: MONGO_URL,
    db: 'read_only'
  },

  security: {
    sessionSecret: process.env['SESSION_SECRET'] || 'not-so-secret'
  },

  siteUrl: process.env['PUBLIC_URL'] || `http://localhost:${HOST_LISTEN_PORT}`,

  smokeTest: {
    email: process.env['SMOKE_TEST_EMAIL'],
    password: process.env['SMOKE_TEST_PASSWORD'],
    projectId: process.env['SMOKE_TEST_PROJECT_ID']
  }
}
