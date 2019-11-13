var mongoose = require('mongoose');
var FloodStation = require('../../db/floodStation');
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var FloodSchema = require('../../db/floodSchema');

var fc = {};

fc.GetStation = function(param){
	FloodStation.find({}, {__v:0}).exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

fc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Flood = mongoose.model("flood"+t, FloodSchema);
	Flood.find(query, {_id: 0,__v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
}



module.exports = fc;