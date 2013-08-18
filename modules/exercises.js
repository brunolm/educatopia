var mongo = require('mongodb')

var Server = mongo.Server,
	Db = mongo.Db,
	BSON = mongo.BSONPure

var db = new Db('educatopiadev', new Server("127.0.0.1", 27017, {auto_reconnect: true}), {w: 1})

db.open(function (err, db) {
	if (!err) {
		console.log("Connected to educatopias database")
		db.collection('exercises', {safe: true}, function (err, collection) {
			if (err) {
				console.log("The exercises don't exist.")
				//populateDB()
			}
		})
	}
})


//Exports

exports.findById = function (req, res) {

	var id = req.params.id

	console.log('Retrieving exercise: ' + id)

	db.collection('exercises', function (err, collection) {
		collection.findOne({'_id': new BSON.ObjectID(id)}, function (err, item) {
			res.send(item)
		})
	})
}

exports.findAll = function (req, res) {
	db.collection(
		'exercises',
		function (err, collection) {
			collection
				.find()
				.sort({_id: 1})
				.toArray(function (err, items) {

					items.forEach(function (item) {
						item.urlid = item.id
						item.id = item._id
						delete item._id

						item.task = item.task || ""
						item.approach = item.approach || ""
						item.solution = item.solution || ""
						item.subjects = item.subjects || ""
						item.type = item.type || ""
						item.credits = item.credits || ""
						item.difficulty = item.difficulty || ""
						item.duration = item.duration || ""
						item.tags = item.tags || ""
						item.note = item.note || ""
						item.hints = item.hints || ""
						item.flags = item.flags || ""
					})

					res.send(items)
				})
		})
}

exports.add = function (req, res) {

	var exercise = req.body

	console.log('Adding exercise: ' + JSON.stringify(exercise))

	db.collection('exercises', function (err, collection) {
		collection.insert(exercise, {safe: true}, function (err, result) {
			if (err) {
				res.send({'error': 'An error has occurred'})
			} else {
				console.log('Success: ' + JSON.stringify(result))
				res.send(result[0])
			}
		})
	})
}

exports.update = function (req, res) {

	var id = req.body.id,
		exercise = req.body

	console.log('Updating exercise: ' + id)
	console.log(JSON.stringify(exercise))

	console.log(new BSON.ObjectID(id))

	db.collection('exercises', function (err, collection) {
		collection.update(
			{'_id': new BSON.ObjectID(id)},
			exercise,
			{safe: true}, function (err, result) {
				if (err) {
					console.log('Error updating exercise: ' + err)
					res.send({'error': 'An error has occurred'})
				} else {
					console.log('' + result + ' document(s) updated')
					res.send(exercise)
				}
			})
	})
}

exports.delete = function (req, res) {

	var id = req.params.id

	console.log('Deleting exercise: ' + id)

	db.collection('exercises', function (err, collection) {
		collection.remove({'_id': new BSON.ObjectID(id)}, {safe: true}, function (err, result) {
			if (err) {
				res.send({'error': 'An error has occurred - ' + err})
			} else {
				console.log('' + result + ' document(s) deleted')
				res.send(req.body)
			}
		})
	})
}