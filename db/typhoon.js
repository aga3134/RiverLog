var mongoose = require('mongoose');

var TyphoonSchema = new mongoose.Schema({
	_id : String,
	typhoon_name: String,		//颱風英文名稱
	cwb_typhoon_name: String,	//颱風中文名稱
	cwb_td_no: String,			//颱風編號
	time: Date,					//定位時間
	lat: Number,				//位置緯度
	lng: Number,				//位置經度
	max_wind_speed : Number,	//近中心最大風速(m/s)
	max_gust_speed  : Number,	//近中心最大陣風(m/s)
	pressure: Number,			//中心氣壓(百帕)
	circle_of_15ms: Number,		//七級風暴風半徑 (公里)
	circle_of_25ms: Number,		//十級風暴風半徑 (公里)
}, {collection: "typhoon"});

module.exports = mongoose.model('typhoon', TyphoonSchema);