var mongoose = require('mongoose');
var SewerStation = require('../../db/sewerStation');
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var SewerSchema = require('../../db/sewerSchema');

var sc = {};

sc.GetStation = function(param){
	SewerStation.find({}, {_id: 0, __v:0}).exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

sc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Sewer = mongoose.model("sewer"+t, SewerSchema);
	Sewer.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
}

module.exports = sc;