var mongoose = require('mongoose');

var WindSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationID: String,	//測站ID
	time: Date,			//觀測時間
	ELEV: Number,		//海拔高度
	WDIR: Number,		//風向
	WDSD: Number,		//風速
	TEMP: Number,		//溫度
	HUMD: Number,		//溼度
	PRES: Number		//氣壓
});

module.exports = WindSchema;