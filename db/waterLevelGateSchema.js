var mongoose = require('mongoose');

var WaterLevelGateSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationID: String,	//測站ID
	value: Number,		//測站水位(m)
	time : Date,		//觀測時間
});

module.exports = WaterLevelGateSchema;