var mongoose = require('mongoose');

var FloodStationSchema = new mongoose.Schema({
	_id : String,
	stationName: String,	//測站名稱
	lat  : Number,	//緯度
	lon : Number,	//經度
}, {collection: "floodSite"});

module.exports = mongoose.model('floodStation', FloodStationSchema);