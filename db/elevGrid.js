var mongoose = require('mongoose');

var ElevGridSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	lev: Number,
	x : Number,
	y : Number,
	num : Number,
	elevSum  : Number,
}, {collection: "elevGrid"});

module.exports = mongoose.model('elevGrid', ElevGridSchema);