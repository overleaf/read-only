AuthenticationError = (msg) ->
	err = new Error(msg)
	err.name = 'AuthenticationError'
	err.__proto__ = AuthenticationError.prototype
	return err
AuthenticationError.prototype.__proto__ = Error.prototype

module.exports.AuthenticationError = AuthenticationError

UserNotFoundError = (msg) ->
	err = new Error(msg)
	err.name = 'UserNotFoundError'
	err.__proto__ = UserNotFoundError.prototype
	return err
UserNotFoundError.prototype.__proto__ = Error.prototype

module.exports.UserNotFoundError = UserNotFoundError
