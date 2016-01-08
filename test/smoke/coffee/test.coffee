child   = require "child_process"
fs = require "fs"
Settings = require "settings-sharelatex"
logger = require "logger-sharelatex"

port = Settings.internal.read_only.port

cookieFilePath = "/tmp/smoke-test-cookie-#{port}.txt"

buildUrl = (path) ->
	" -b #{cookieFilePath} --resolve 'www#{Settings.cookieDomain}:#{port}:127.0.0.1' http://www#{Settings.cookieDomain}:#{port}/#{path}"

# Change cookie to be non secure so curl will send it
convertCookieFile = (callback) ->
	fs = require("fs")
	fs.readFile cookieFilePath, "utf8", (err, data) ->
		return callback(err) if err
		firstTrue = data.indexOf("TRUE")
		secondTrue = data.indexOf("TRUE", firstTrue+4)
		result = data.slice(0, secondTrue)+"FALSE"+data.slice(secondTrue+4)
		fs.writeFile cookieFilePath, result, "utf8", (err) ->
			return callback(err) if err
			callback()

describe "Log in and download project", ->
	it "should log in and download a project", (done) ->
		command =  """
			curl -H  "X-Forwarded-Proto: https" -c #{cookieFilePath} --form email="#{Settings.smokeTest.email}" --form password="#{Settings.smokeTest.password}" #{buildUrl('login')}
		"""
		console.log "COMMAND", command
		child.exec command, (err, stdout, stderr)->
			return done(err) if err?
			console.log "LOGIN STDOUT", stdout
			console.log "LOGIN STDERR", stderr
			command =  """
				curl -H "X-Forwarded-Proto: https" -v #{buildUrl("project/#{Settings.smokeTest.projectId}")}
			"""
			console.log "COMMAND", command
			child.exec command, (error, stdout, stderr)->
				return done(err) if err?
				console.log "DOWNLOAD STDOUT", stdout
				console.log "DOWNLOAD STDERR", stderr
				done()
