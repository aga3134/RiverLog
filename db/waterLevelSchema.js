var mongoose = require('mongoose');

var WaterLevelSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	StationIdentifier: String,	//測站ID
	WaterLevel: Number,			//測站水位(離海平面m)
	RecordTime : Date,			//觀測時間
});

module.exports = WaterLevelSchema;