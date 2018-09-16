var mongoose = require('mongoose');

var RainStationSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	name: String,	//測站
	lat  : Number,	//緯度
	lng : Number,	//經度
	city: String,	//縣市
	town: String,	//鄉鎮
});

module.exports = mongoose.model('rainStation', RainStationSchema);