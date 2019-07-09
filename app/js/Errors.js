/* eslint-disable
    no-proto,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
var AuthenticationError = function(msg) {
  const err = new Error(msg)
  err.name = 'AuthenticationError'
  err.__proto__ = AuthenticationError.prototype
  return err
}
AuthenticationError.prototype.__proto__ = Error.prototype

module.exports.AuthenticationError = AuthenticationError

var UserNotFoundError = function(msg) {
  const err = new Error(msg)
  err.name = 'UserNotFoundError'
  err.__proto__ = UserNotFoundError.prototype
  return err
}
UserNotFoundError.prototype.__proto__ = Error.prototype

module.exports.UserNotFoundError = UserNotFoundError
