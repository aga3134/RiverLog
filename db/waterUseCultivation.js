var mongoose = require('mongoose');

var WaterUseCultivationSchema = new mongoose.Schema({
	_id : String,
	Area: String,					//所屬區域(1為北部、2為中部、3為南部、4為東部、5為其他)
	County: String,					//所屬縣市(1為基隆市、2為台北市、3為台北縣、4為桃園縣、5為新竹市、6為新竹縣、7為苗栗縣、8為台中市、9為台中縣、10為南投縣、11為彰化縣、12為雲林縣、13為嘉義市、14為嘉義縣、15為台南市、16為高雄市、17為高雄市、18為高雄縣、19為屏東縣、20為台東縣、21為花蓮縣、22為宜蘭縣、23為澎湖縣、24為金門縣、25為連江縣、26為新竹縣市、27為台中縣市、28為嘉義縣市、29為台南縣市、0為其他)
	CultivationArea  : Number,		//養殖面積(公頃)
	CultivationKind : String,		//養殖種類(1為吳郭魚、2為鰻魚、3為鱸魚、4為虱目魚、5為鯛類、7為烏魚、8為海水蝦類、9為長腳大蝦、10為文蛤、11為蜆、12為龍鬚菜、14為其他鹹水、15為其他淡水、16為鱠、17為九孔、18為香魚)
	TotalWaterConsumption: Number,	//年總用水量(千立方公尺/年)
	Status: String,					//資料狀態 (1為尚未審核、2為通過、3為退回、4為刪除、5為待議)
	Year: Number,					//年份
}, {collection: "waterUseCultivation"});

module.exports = mongoose.model('waterUseCultivation', WaterUseCultivationSchema);