Settings = require "settings-sharelatex"
mongojs = require "mongojs"
db = mongojs(Settings.mongo.url, ["users", "projects"])
module.exports =
	db: db
	ObjectId: mongojs.ObjectId

