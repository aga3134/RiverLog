var mongoose = require('mongoose');

var SewerStationSchema = new mongoose.Schema({
	_id : String,
	no: String,			//測站id
	district: String,	//行政區
	village: String,	//村里
	region: String,		//系統分區
	name: String,		//測站名稱
	address: String,	//地址
	lat: Number,		//緯度
	lng: Number,		//經度
}, {collection: "sewerStation"});

module.exports = mongoose.model('sewerStation', SewerStationSchema);