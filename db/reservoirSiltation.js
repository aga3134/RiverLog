var mongoose = require('mongoose');

var ReservoirSiltationSchema = new mongoose.Schema({
	_id : String,
	Area: String,											//所屬地區
	CurruntCapacity: Number,								//目前總容量(萬立方公尺)
	CurruntEffectiveCapacity : Number,						//目前有效容量(萬立方公尺)
	DesignedCapacity  : Number,								//設計總容量(萬立方公尺)
	DesignedEffectiveCapacity  : Number,					//設計有效容量(萬立方公尺)
	ReservoirName  : String,								//水庫名稱
	ReservoirSedimentationVolume  : Number,					//水庫淤積量(萬立方公尺)
	TheLastestMeasuredTimeOfReservoirCapacity  : String,	//最近完成庫容測量時間(年月)
	Year: Number,											//年份
}, {collection: "reservoirSiltation"});

module.exports = mongoose.model('reservoirSiltation', ReservoirSiltationSchema);