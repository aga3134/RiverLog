var mongoose = require('mongoose');

var WaterLevelStationSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	BasinIdentifier: String,		//測站id
	AffiliatedBasin  : String,				//所屬主流
	AffiliatedSubsidiaryBasin : String,			//所屬支流
	AffiliatedSubSubsidiaryBasin: String,		//所屬次支流
	AlertLevel1: Number,	//一級警戒水位(重 m)
	AlertLevel2: Number,	//二級警戒水位(中 m)
	AlertLevel3: Number,	//三級警戒水位(輕 m)
	LocationAddress: String,	//測站位置
	lat: Number,				//緯度
	lon: Number,				//經度
	ObservatoryName: String,	//測站名稱
	RiverName: String,			//所屬河川名稱
	Town: Number,				//鄉鎮名稱
	TownIdentifier: String,		//鄉鎮代碼
}, {collection: "waterLevelStation"});

module.exports = mongoose.model('waterLevelStation', WaterLevelStationSchema);