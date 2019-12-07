var mongoose = require('mongoose');

var WaterboxLatestSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	device_id: String,		//測站ID
	lat  : Number,			//緯度
	lng : Number,			//經度
	s_t0:Number,			//水溫(-20.0~150.0C)
	s_ph:Number,			//酸鹼度(0.00~-14.00)
	s_ec:Number,			//導電度(0~200000 uS/cm)
	s_Tb:Number,			//濁度(0~10000 NTU)
	s_Lv:Number,			//水位(0.000~20.000 M)
	s_DO:Number,			//溶氧(DO 0.00~12.00 mg/L)
	s_orp:Number,			//氧化還原電位(ORP -2000~2000 mV)
	time : Date,			//觀測時間
}, {collection: "waterboxLatest"});

module.exports = mongoose.model('waterboxLatest', WaterboxLatestSchema);