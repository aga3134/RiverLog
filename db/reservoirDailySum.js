var mongoose = require('mongoose');

var ReservoirDailySumSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	time: Date,			//日期
	northSum  : Number,	//北部總水量
	northNum : Number,	//北部總容量
	centralSum: Number,	//中部總水量
	centralNum: Number,	//中部總容量
	southSum: Number,	//南部總水量
	southNum: Number,	//南部總容量
});

module.exports = mongoose.model('reservoirDailySum', ReservoirDailySumSchema);