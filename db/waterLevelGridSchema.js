var mongoose = require('mongoose');

var WaterLevelGridSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	lev: Number,
	t: Date,
	x : Number,
	y : Number,
	num : Number,
	latSum : Number,
	lngSum : Number,
	WaterLevelSum  : Number,
});

module.exports = WaterLevelGridSchema;