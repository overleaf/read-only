const { ObjectId } = require('mongodb')
const { db } = require('./MongoHandler')
const { expressify } = require('./Utils')

module.exports = {
  restricted: expressify(restricted)
}

async function restricted(req, res, next) {
  if (req.session.userId == null) {
    return res.redirect('/login')
  }

  let userId
  try {
    // Checking if we can create an ObjectId out of the user id
    userId = ObjectId(req.session.userId)
  } catch (err) {
    // Malformed user id. Better clear the session.
    delete req.session.userId
    return res.redirect('/login')
  }

  const user = await db.users.findOne({ _id: userId })
  if (user == null) {
    return res.redirect('/login')
  }
  res.locals.user = user
  next()
}
