var mongoose = require('mongoose');

var WaterLevel10minSumSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	time: Date,			//時間
	northSum  : Number,	//北部警戒程度
	northNum : Number,	//北部測站數
	centralSum: Number,	//中部警戒程度
	centralNum: Number,	//中部測站數
	southSum: Number,	//南部警戒程度
	southNum: Number,	//南部測站數
}, {collection: "waterLevel10minSum"});

module.exports = mongoose.model('waterLevel10minSum', WaterLevel10minSumSchema);