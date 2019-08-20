var mongoose = require('mongoose');

var MonthWaterUseSchema = new mongoose.Schema({
	_id : String,
	County: String,											//縣市
	Town: String,											//鄉鎮
	Month : Number,											//月份
	TheDailyDomesticConsumptionOfWaterPerPerson  : Number,	//每人每日生活用水量(公升)
	Year: Number,											//年份
}, {collection: "monthWaterUse"});

module.exports = mongoose.model('monthWaterUse', MonthWaterUseSchema);