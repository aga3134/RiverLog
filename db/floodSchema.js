var mongoose = require('mongoose');

var FloodSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationID: String,	//測站ID
	time: Date,			//觀測時間
	value : Number,		//淹水深度(cm)
});

module.exports = FloodSchema;