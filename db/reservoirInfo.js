var mongoose = require('mongoose');

var ReservoirInfoSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	Application: String,		//功能
	Area  : String,				//地區別
	BasinName : String,			//所在或越域引水溪流名稱
	CatchmentArea: Number,		//集水區面積(公頃Ha.)
	CurruntCapacity: Number,	//目前總容量(萬立方公尺)
	CurruntEffectiveCapacity: Number,	//目前有效容量(萬立方公尺)
	DesignedEffectiveCapacity: Number,	//設計有效容量(萬立方公尺)
	FullWaterLevelArea: Number,	//滿水位面積(公頃Ha.)
	Height: Number,				//壩堰高(公尺m)
	Length: Number,				//壩堰長(公尺m)
	Location: String,			//縣市鄉鎮
	ReservoirName: String,		//名稱
	TheLastestMeasuredTimeOfReservoirCapacity: Number,	//最近完成庫容測量時間(年月)
	Type: String,				//型式
	Year: Number,				//資料年份
	id: String,					//水庫編號
	lat: Number,				//緯度
	lng: Number,				//經度
	DeadStorageLevel: Number,	//呆水位
	EffectiveCapacity: Number,	//有效容量(從每日營運狀況取得)
	FullWaterLevel: Number,		//滿水位
}, {collection: "reservoirInfo"});

module.exports = mongoose.model('reservoirInfo', ReservoirInfoSchema);