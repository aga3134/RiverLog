var mongoose = require('mongoose');

var WaterboxDeviceSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	id: String,		//測站id
	device: String,	//主控板類型
	lat  : Number,	//緯度
	lng : Number,	//經度
}, {collection: "waterboxDevice"});

module.exports = mongoose.model('waterboxDevice', WaterboxDeviceSchema);