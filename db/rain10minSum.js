var mongoose = require('mongoose');

var Rain10minSumSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	time: Date,			//時間
	northSum  : Number,	//北部總雨量
	northNum : Number,	//北部資料數
	centralSum: Number,	//中部總雨量
	centralNum: Number,	//中部資料數
	southSum: Number,	//南部總雨量
	southNum: Number,	//南部資料數
}, {collection: "rain10minSum"});

module.exports = mongoose.model('rain10minSum', Rain10minSumSchema);