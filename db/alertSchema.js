var mongoose = require('mongoose');

var AlertSchema = new mongoose.Schema({
	_id : String,			//警示id
	msgType: String,		//訊息類型 Alert、Update、Cancel、Ack、Error
	reference: String,		//同一事件之前的示警
	eventcode: String,		//警示種類
	effective: Date,		//警示開始時間
	expires : Date,			//警示結束時間
	urgency: String,		//緊急程度 Immediate(立即應變) Expected(一小時內盡快採取應變) Future(應採取應變) Past(已不須採取應變) Unknown(未知)
	severity: String,		//嚴重程度 Extreme(嚴重威脅) Severe(威脅) Moderate(可能有威脅) Minor(較小的威脅) Unknown(未知)
	certainty: String,		//確定性 Observed(確定已發生或將發生) Likely(超過一半的機率會發生) Possible(可能會發生) Unlikely(可能不會發生) Unknown(未知)
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