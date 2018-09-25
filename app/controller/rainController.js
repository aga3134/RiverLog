var mongoose = require("mongoose");
var RainStation = require("../../db/rainStation");
var RainDailySum = require("../../db/rainDailySum");
var Rain10minSum = require("../../db/rain10minSum");
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var RainSchema = require("../../db/rainSchema");

var rc = {};

rc.GetStation = function(param){
	RainStation.find({}, {_id: 0, __v:0}).exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
};

rc.GetExtremeDate = function(param){
	var result = {};
	RainDailySum.findOne({}).sort({time: -1}).exec(function(err, maxDate) {
		if(err) return param.failFunc({err:err});
		if(!maxDate) return param.failFunc({err:"no max date"});

		result.maxDate = Util.DateToDateString(maxDate.time);
		RainDailySum.findOne({}).sort({time: 1}).exec(function(err, minDate) {
			if(err) return param.failFunc({err:err});
			if(!minDate) return param.failFunc({err:"no min date"});

			result.minDate = Util.DateToDateString(minDate.time);
			return param.succFunc(result);
		});
	});
};

rc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Rain = mongoose.model("rain"+t, RainSchema);
	Rain.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});

		for(var i=0;i<data.length;i++){
			data[i].time = Util.DateToTimeString(data[i].time);
		}
		param.succFunc(data);
	});
};

rc.Get10minSum = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	Rain10minSum.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		for(var i=0;i<data.length;i++){
			data[i].time = Util.DateToTimeString(data[i].time);
		}
		param.succFunc(data);
	});
};

rc.GetDailySum = function(param){
	if(!param.year) return param.failFunc({err:"no year"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.year+"-1-1")}});
	conditions.push({time: {$lte: new Date(param.year+"-12-31")}});
	var query   = {$and: conditions};

	RainDailySum.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		for(var i=0;i<data.length;i++){
			data[i].time = Util.DateToDateString(data[i].time);
		}
		param.succFunc(data);
	});
};

module.exports = rc;