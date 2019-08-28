var mongoose = require('mongoose');

var RainSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationID: String,	//測站ID
	time: Date,			//觀測時間
	hour12 : Number,	//12小時累積雨量(mm)
	hour24 : Number,	//24小時累積雨量(mm)
	now  : Number,		//今日累積雨量(mm)
});

module.exports = RainSchema;