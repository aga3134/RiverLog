var mongoose = require('mongoose');

var RainGridSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	lev: Number,
	t: Date,
	x : Number,
	y : Number,
	num : Number,
	latSum : Number,
	lngSum : Number,
	nowSum  : Number,
});

module.exports = RainGridSchema;