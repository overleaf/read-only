const csurf = require('csurf')

const csurfMiddleware = csurf()

module.exports = {
  middleware
}

function middleware(req, res, next) {
  csurfMiddleware(req, res, err => {
    if (err != null) {
      if (err.code === 'EBADCSRFTOKEN') {
        res.status(403).render('bad-csrf-token')
      } else {
        next(err)
      }
    } else {
      // Stick the csrfToken() function in the response locals so that we can use
      // it in views
      res.locals.csrfToken = req.csrfToken
      next()
    }
  })
}
