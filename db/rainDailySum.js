var mongoose = require('mongoose');

var RainDailySumSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	time: Date,			//日期
	northSum  : Number,	//北部總雨量
	northNum : Number,	//北部資料數
	centralSum: Number,	//中部總雨量
	centralNum: Number,	//中部資料數
	southSum: Number,	//南部總雨量
	southNum: Number,	//南部資料數
}, {collection: "rainDailySum"});

module.exports = mongoose.model('rainDailySum', RainDailySumSchema);