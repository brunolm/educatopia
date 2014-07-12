var exercisesApi = require('../api/exercises'),
    fs = require('fs'),
    path = require('path'),
    yaml = require('js-yaml'),

    exercises = {},

    schemaPath = path.resolve(__dirname, '../public/shared/exerciseSchema.yaml'),
    schema = yaml.safeLoad(fs.readFileSync(schemaPath, 'utf8')),

    fieldsetsPath = path.resolve(__dirname, '../public/shared/exerciseFieldsets.yaml'),
    fieldsets = yaml.safeLoad(fs.readFileSync(fieldsetsPath, 'utf8'))


function stringsToObjects (object) {

	var key

	for (key in schema)
		if (schema.hasOwnProperty(key))
			if (schema[key].type === 'list' && schema[key].subtype === 'text')
				object[key] = object[key].split(/\s*,\s*/)

			else if (schema[key].type === 'date')
				object[key] = new Date(object[key])

	return object
}

function addEmptyFields (request) {

	// Adds empty fields to render empty input-fields in form

	for (key in request.query)
		if (request.query.hasOwnProperty(key)) {
			request.body[key] = request.body[key] || []
			request.body[key].push("")
		}
}

function validateExercise (exercise) {

	var fieldName,
	    booleanSum = 0

	for (fieldName in schema) {

		if (schema.hasOwnProperty(fieldName) && schema[fieldName].validators) {

			booleanSum += schema[fieldName].validators.every(function (constraint) {

				// TODO: Add more types of validators

				if (constraint === 'required') {
					return Boolean(exercise[fieldName])
				}
				else
					return true
			})
		}
		else
			booleanSum++

		console.log(booleanSum)
	}

	return booleanSum === Object.keys(schema).length
}


function submit (request, response, renderObject) {

	var isValid

	if (request.session.user) {

		isValid = validateExercise(request.body)

		if (isValid)
			exercisesApi.add(
				stringsToObjects(request.body),
				request.session.user,
				function (error, exercise) {

					if (error)
						console.error(error)

					else
						response.redirect('/exercises/' + exercise['_id'])
				}
			)

		else {
			renderObject.message = 'Exercise is not valid! ' +
			                       'Please correct mistakes and try to submit again.'

			renderObject.exercise = stringsToObjects(request.body)

			response.render('exercises/create', renderObject)
		}
	}
	else
		response.redirect('/exercises/' + exercise['_id'])
}


exercises.one = function (request, response, next) {

	exercisesApi.getByIdRendered(
		request.params.id,
		function (error, exercise) {

			if (error)
				console.log(error)

			else if (exercise)
				response.render('exercises/view', {
					page: 'exerciseView',
					exercise: exercise
				})

			else
				next()
		}
	)
}

exercises.create = function (request, response) {

	var renderObject = {
		page: 'exerciseCreate',
		schema: schema,
		fieldsets: fieldsets,
		exercise: {}
	}


	if (request.method === 'POST' && request.session.user) {

		if (Object.keys(request.query).length) {

			addEmptyFields(request)

			renderObject.exercise = stringsToObjects(request.body)

			response.render('exercises/create', renderObject)
		}
		else
			submit(request, response, renderObject)
	}
	else {
		delete renderObject.fieldsets[2]

		response.render('exercises/create', renderObject)
	}
}


exercises.all = function (request, response) {

	exercisesApi.getAll(function (error, exercises) {

		if (error)
			throw new Error(error)

		response.render('exercises/all', {
			page: 'exercises',
			exercises: exercises
		})
	})
}

exercises.edit = function (request, response, next) {

	var renderObject = {
		page: 'exerciseEdit',
		schema: schema,
		fieldsets: fieldsets
	}

	if (request.method === 'POST' && request.session.user) {

		addEmptyFields(request)

		renderObject.exercise = stringsToObjects(request.body)

		response.render('exercises/edit', renderObject)
	}

	else
		exercisesApi.getById(
			request.params.id,
			function (error, exercise) {

				if (error)
					console.log(error)

				else if (exercise) {
					renderObject.exercise = exercise
					response.render('exercises/edit', renderObject)
				}
				else
					next()
			}
		)
}

exercises.history = function (request, response, next) {

	exercisesApi.getHistoryById(
		request.params.id,
		function (error, history) {

			if (error)
				console.log(error)

			if (history)
				response.render('exercises/history', {
					page: 'exerciseHistory',
					history: history,
					exercise: {
						id: request.params.id
					}
				})
			else
				next()
		}
	)
}

exercises.update = function (request, response) {

	var updatedExercise = stringsToObjects(request.body, schema)

	exercisesApi.update(
		updatedExercise,
		request.session.user,
		function (error, exercise) {

			if (error)
				throw new Error(error)

			else {
				response.render('exercises/view', {
					page: 'exerciseView',
					exercise: exercise
				})
			}
		}
	)
}


module.exports = exercises
