var mongoose = require('mongoose');

var CCTVStationSchema = new mongoose.Schema({
	_id : mongoose.Schema.Types.ObjectId,
	stationID: String,	//測站id
	name: String,	  //測站名稱
	lat  : Number,	//緯度
	lon : Number,	  //經度
  type: String,   //cctv類型
  link: String    //cctv影像連結
}, {collection: "cctvStation"});

module.exports = mongoose.model('cctvStation', CCTVStationSchema);