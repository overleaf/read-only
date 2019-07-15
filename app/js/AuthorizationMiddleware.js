const { ObjectId } = require('mongodb')
const { db } = require('./MongoHandler.js')
const { expressify } = require('./Utils')

module.exports = {
  restricted: expressify(restricted)
}

async function restricted(req, res, next) {
  if (req.session.userId == null) {
    return res.redirect('/')
  }

  let userId
  try {
    // Checking if we can create an ObjectId out of the user id
    userId = ObjectId(req.session.userId)
  } catch (err) {
    // Malformed user id. Better clear the session.
    delete req.session.userId
    return res.redirect('/')
  }

  const user = await db.users.findOne({ _id: userId })
  if (user == null) {
    return res.redirect('/')
  }
  res.locals.user = user
  next()
}
