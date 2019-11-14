var mongoose = require('mongoose');

var WaterLevelDrainGridSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	lev: Number,
	t: Date,
	x : Number,
	y : Number,
	num : Number,
	latSum : Number,
	lngSum : Number,
	valueSum  : Number,
});

module.exports = WaterLevelDrainGridSchema;