var mongoose = require('mongoose');

var AlertSchema = new mongoose.Schema({
	_id : String,			//警示id
	eventcode: String,		//警示種類
	effective: Date,		//警示開始時間
	expires : Date,			//警示結束時間
	urgency: String,		//緊急程度
	severity: String,		//嚴重程度
	certainty: String,		//確定性
	headline: String,		//標題
	description: String,	//內容
	instruction: String,	//行動建議
	responsetype: String,	//資料如何取得
	severity_level: String,	//嚴重分級
	debrisID: [String],		//土石流潛勢溪流編號
	counties: [String],		//縣市編號
	townships: [String],	//鄉鎮編號
	geocode: [String],		//行政區編號
	polygon: [String]		//地理區塊
});

module.exports = AlertSchema;