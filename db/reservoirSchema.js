var mongoose = require('mongoose');

var ReservoirSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	ReservoirIdentifier: String,	//水庫ID
	WaterLevel: Number,				//水庫水位(離海平面m)
	ObservationTime : Date,			//觀測時間
	EffectiveWaterStorageCapacity : Number,	//有效容量(萬立方公尺)
});

module.exports = ReservoirSchema;