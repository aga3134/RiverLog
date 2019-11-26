var mongoose = require('mongoose');

var PumpStationSchema = new mongoose.Schema({
	_id : String,
	id: String,			//測站id
	district: String,	//行政區
	system: String,		//河系
	admin: String,		//管理單位別
	name: String,		//測站名稱
	buildDate: String,	//建置年度
	lat: Number,		//緯度
	lng: Number,		//經度
}, {collection: "pumpStation"});

module.exports = mongoose.model('pumpStation', PumpStationSchema);