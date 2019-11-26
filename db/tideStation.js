var mongoose = require('mongoose');

var TideStationSchema = new mongoose.Schema({
	_id : String,
	id: String,			//測站id
	name: String,		//測站名稱
	lat: Number,		//緯度
	lng: Number,		//經度
}, {collection: "tideStation"});

module.exports = mongoose.model('tideStation', TideStationSchema);