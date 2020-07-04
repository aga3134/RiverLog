var mongoose = require('mongoose');
var WindStation = require('../../db/windStation');
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var WindSchema = require('../../db/windSchema');

var wc = {};

wc.GetStation = function(param){
	WindStation.find({}, {__v:0}).lean().exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

wc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Wind = mongoose.model("wind"+t, WindSchema);
	Wind.find(query, {_id: 0,__v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
}



module.exports = wc;