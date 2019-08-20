var mongoose = require('mongoose');

var WaterUseOverviewSchema = new mongoose.Schema({
	_id : String,
	TotalWaterSupply: Number,			//總供水量(百萬立方公尺)
	WaterSupplyRiver: Number,			//河川引水供水量(百萬立方公尺)
	WaterSupplyReservoir : Number,		//水庫調節供水量(百萬立方公尺)
	WaterSupplyUnderGround  : Number,	//地下水及其他供水量(百萬立方公尺)
	TotalWaterUse: Number,				//總用水量(百萬立方公尺)
	WaterUseAgriculture: Number,		//灌溉用水 (百萬立方公尺)
	WaterUseLivestock: Number,			//畜牧用水(百萬立方公尺)
	WaterUseCultivation: Number,		//養殖用水(百萬立方公尺)
	WaterUseLiving: Number,				//生活用水(百萬立方公尺)
	WaterUseIndustry: Number,			//工業用水(百萬立方公尺)
	Year: Number,						//年份
}, {collection: "waterUseOverview"});

module.exports = mongoose.model('waterUseOverview', WaterUseOverviewSchema);