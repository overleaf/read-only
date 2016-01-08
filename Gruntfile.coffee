module.exports = (grunt) ->
	grunt.initConfig
		forever:
			app:
				options:
					index: "app.js"

		coffee:
			app_src:
				expand: true,
				flatten: true,
				cwd: "app"
				src: ['coffee/*.coffee'],
				dest: 'app/js/',
				ext: '.js'

			app:
				src: "app.coffee"
				dest: "app.js"

			unit_tests:
				expand: true
				cwd:  "test/unit/coffee"
				src: ["**/*.coffee"]
				dest: "test/unit/js/"
				ext:  ".js"

			smoke_tests:
				expand: true
				cwd:  "test/smoke/coffee"
				src: ["**/*.coffee"]
				dest: "test/smoke/js/"
				ext:  ".js"

		clean:
			app: ["app/js/"]
			unit_tests: ["test/unit/js"]
			smoke_tests: ["test/smoke/js"]

		execute:
			app:
				src: "app.js"

		mochaTest:
			unit:
				options:
					reporter: grunt.option('reporter') or 'spec'
					grep: grunt.option("grep")
				src: ["test/unit/js/**/*.js"]

	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-contrib-clean'
	grunt.loadNpmTasks 'grunt-mocha-test'
	grunt.loadNpmTasks 'grunt-shell'
	grunt.loadNpmTasks 'grunt-execute'
	grunt.loadNpmTasks 'grunt-bunyan'
	grunt.loadNpmTasks 'grunt-forever'

	grunt.registerTask 'compile:app', ['clean:app', 'coffee:app', 'coffee:app_src', 'compile:smoke_tests']
	grunt.registerTask 'run',         ['compile:app', 'bunyan', 'execute']

	grunt.registerTask 'compile:unit_tests', ['clean:unit_tests', 'coffee:unit_tests']
	grunt.registerTask 'test:unit',          ['compile:app', 'compile:unit_tests', 'mochaTest:unit']

	grunt.registerTask 'compile:smoke_tests', ['clean:smoke_tests', 'coffee:smoke_tests']

	grunt.registerTask 'install', 'compile:app'

	grunt.registerTask 'default', ['run']


