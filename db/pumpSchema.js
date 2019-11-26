var mongoose = require('mongoose');

var PumpSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationNo: String,		//測站ID
	levelIn: Number,		//內水水位(m)
	levelOut: Number,		//外水水位(m)
	allPumbLights: String,	//總抽水狀態
	pumbNum: Number,		//抽水機數
	doorNum: Number,		//閘門數
	time : Date,			//觀測時間
});

module.exports = PumpSchema;