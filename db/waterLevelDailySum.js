var mongoose = require('mongoose');

var WaterLevelDailySumSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	time: Date,			//日期
	northSum  : Number,	//北部警戒程度
	northNum : Number,	//北部測站數
	centralSum: Number,	//中部警戒程度
	centralNum: Number,	//中部測站數
	southSum: Number,	//南部警戒程度
	southNum: Number,	//南部測站數
}, {collection: "waterLevelDailySum"});

module.exports = mongoose.model('waterLevelDailySum', WaterLevelDailySumSchema);