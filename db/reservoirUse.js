var mongoose = require('mongoose');

var ReservoirUseSchema = new mongoose.Schema({
	_id : String,
	Area: String,												//所屬地區
	BackWaterVolumeOfPowerGeneration: Number,					//發電水量回流(萬立方公尺)
	DischargeWaterVolumeOfPowerGeneration : Number,				//發電水量放流(萬立方公尺)
	EndYearStoragedWater  : Number,								//年底水庫水量(萬立方公尺)
	EndYearWaterLevel  : Number,								//年底水庫水位(公尺)
	FlushingVolume  : Number,									//洩洪量(萬立方公尺)
	GrossVolumeOfWaterConsumptionForAgricultureWater  : Number,	//農業用水量(萬立方公尺)
	GrossVolumeOfWaterConsumptionForAllPurposes  : Number,		//各標的用水量總計(萬立方公尺)
	GrossVolumeOfWaterConsumptionForDomesticWater  : Number,	//生活用水量(萬立方公尺)
	GrossVolumeOfWaterConsumptionForIndustrialWater  : Number,	//工業用水量(萬立方公尺)
	InflowVolume  : Number,										//進水量(萬立方公尺)
	InitialStorageWater  : Number,								//期初存水量(萬立方公尺)
	LeakageVolume  : Number,									//損耗水量(萬立方公尺)
	OthersDischargeVolume  : Number,							//其他放流量(萬立方公尺)
	ReservoirName  : String,									//水庫名稱
	SedimentationVariation  : Number,							//淤積增減量(萬立方公尺)
	Year: Number,												//年份
}, {collection: "reservoirUse"});

module.exports = mongoose.model('reservoirUse', ReservoirUseSchema);