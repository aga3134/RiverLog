var mongoose = require('mongoose');

var WaterLevelDrainSiteSchema = new mongoose.Schema({
	_id : String,				//測站id
	stationName: String,		//測站名稱
	lat: Number,				//緯度
	lng: Number,				//經度
}, {collection: "waterLevelDrainSite"});

module.exports = mongoose.model('waterLevelDrainSite', WaterLevelDrainSiteSchema);