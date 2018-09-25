var mongoose = require('mongoose');

var RainStationSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationID: String,	//測站id
	name: String,	//測站名稱
	lat  : Number,	//緯度
	lon : Number,	//經度
	city: String,	//縣市
	town: String,	//鄉鎮
}, {collection: "rainStation"});

module.exports = mongoose.model('rainStation', RainStationSchema);