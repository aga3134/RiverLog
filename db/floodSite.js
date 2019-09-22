var mongoose = require('mongoose');

var FloodSiteSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationName: String,	//測站名稱
	lat  : Number,	//緯度
	lon : Number,	//經度
}, {collection: "floodSite"});

module.exports = mongoose.model('floodSite', FloodSiteSchema);