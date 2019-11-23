var mongoose = require("mongoose");
var Util = require("../util");
var Typhoon = require("../../db/typhoon");
var AlertStatistic = require("../../db/alertStatistic");

//一天的data存成一個collection，必免資料太大存取很慢
var AlertSchema = require("../../db/alertSchema");

var ac = {};

ac.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Alert = mongoose.model("alert"+t, AlertSchema);
	Alert.find({}, {__v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

ac.GetStatistic = function(param){
	if(!param.year) return param.failFunc({err:"no year"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.year+"-1-1 00:00")}});
	conditions.push({time: {$lte: new Date(param.year+"-12-31 23:59")}});
	var query = {$and: conditions};

	AlertStatistic.find(query, {__v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

ac.GetTyphoonData = function(param){
	if(!param.date && !param.year) return param.failFunc({err:"no date"});

	var conditions = [];
	
	if(param.date){
		conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
		conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	}
	else if(param.year){
		conditions.push({time: {$gte: new Date(param.year+"-1-1 00:00")}});
		conditions.push({time: {$lte: new Date(param.year+"-12-31 23:59")}});
	}
	var query = {$and: conditions};

	Typhoon.find(query, {__v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

module.exports = ac;