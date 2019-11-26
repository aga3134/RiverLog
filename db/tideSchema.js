var mongoose = require('mongoose');

var TideSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationID: String,		//測站ID
	value: Number,			//潮位(m)
	time : Date,			//觀測時間
});

module.exports = TideSchema;