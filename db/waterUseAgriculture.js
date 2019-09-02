var mongoose = require('mongoose');

var WaterUseAgricultureSchema = new mongoose.Schema({
	_id : String,
	Area: String,										//所屬區域(1為北部、2為中部、3為南部、4為東部、5為其他)
	FirstPhaseMiscellaneousIrrigationArea  : Number,	//第一期雜作面積(公頃)
	FirstPhaseMiscellaneousWaterConsumption : Number,	//第一期雜作用水量(千立方公尺)
	FirstPhaseRiceIrrigationArea: Number,				//第一期水稻面積(公頃)
	FirstPhaseRiceWaterConsumption: Number,				//第一期水稻用水量(千立方公尺)
	IrrigationAssociation: String,						//水利會編號(水利會名稱，2為留公、3為七星、4為北基、5為桃園、6為石門、7為新竹、8為宜蘭、9為苗栗、10為台中、11為南投、12為彰化、13為雲林、14為嘉南、15為高雄、16為屏東、17為花蓮、18為台東)
	SecondPhaseMiscellaneousIrrigationArea: Number,		//第二期雜作面積(公頃)
	SecondPhaseMiscellaneousWaterConsumption: Number,	//第二期雜作用水量(千立方公尺)
	SecondPhaseRiceIrrigationArea: Number,				//第二期水稻面積(公頃)
	SecondPhaseRiceWaterConsumption: Number,			//第二期水稻用水量(千立方公尺)
	Status: String,										//資料狀態 (1為尚未審核、2為通過、3為退回、4為刪除、5為待議)
	Year: Number,										//年份
}, {collection: "waterUseAgriculture"});

module.exports = mongoose.model('waterUseAgriculture', WaterUseAgricultureSchema);