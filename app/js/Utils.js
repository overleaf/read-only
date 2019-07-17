module.exports = { expressify }

/**
 * Turn an async function into a callback-style express middleware.
 */
function expressify(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
