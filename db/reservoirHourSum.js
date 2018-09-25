var mongoose = require('mongoose');

var ReservoirHourSumSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	time: Date,			//時間
	northSum  : Number,	//北部總水量
	northNum : Number,	//北部總容量
	centralSum: Number,	//中部總水量
	centralNum: Number,	//中部總容量
	southSum: Number,	//南部總水量
	southNum: Number,	//南部總容量
}, {collection: "reservoirHourSum"});

module.exports = mongoose.model('reservoirHourSum', ReservoirHourSumSchema);