var mongoose = require("mongoose");
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var AlertSchema = require("../../db/alertSchema");

var ac = {};

ac.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Alert = mongoose.model("alert"+t, AlertSchema);
	Alert.find({}, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

module.exports = ac;