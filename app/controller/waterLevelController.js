var mongoose = require('mongoose');
var WaterLevelStation = require('../../db/waterLevelStation');
var WaterLevelDailySum = require('../../db/waterLevelDailySum');
var WaterLevel10minSum = require('../../db/waterLevel10minSum');
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var WaterLevelSchema = require('../../db/waterLevelSchema');

var wlc = {};

wlc.GetStation = function(param){
	WaterLevelStation.find({}, {_id: 0, __v:0}).exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

wlc.GetExtremeDate = function(param){
	var result = {};
	WaterLevelDailySum.findOne({}).sort({time: -1}).exec(function(err, maxDate) {
		if(err) return param.failFunc({err:err});
		if(!maxDate) return param.failFunc({err:"no max date"});

		result.maxDate = Util.DateToDateString(maxDate.time);
		WaterLevelDailySum.findOne({}).sort({time: 1}).exec(function(err, minDate) {
			if(err) return param.failFunc({err:err});
			if(!minDate) return param.failFunc({err:"no min date"});

			result.minDate = Util.DateToDateString(minDate.time);
			return param.succFunc(result);
		});
	});
};

wlc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({RecordTime: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({RecordTime: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var WaterLevel = mongoose.model("waterLevel"+t, WaterLevelSchema);
	WaterLevel.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});

		for(var i=0;i<data.length;i++){
			data[i].RecordTime = Util.DateToTimeString(data[i].RecordTime);
		}
		param.succFunc(data);
	});
}

wlc.Get10minSum = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	WaterLevel10minSum.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		for(var i=0;i<data.length;i++){
			data[i].time = Util.DateToTimeString(data[i].time);
		}
		param.succFunc(data);
	});
}

wlc.GetDailySum = function(param){
	if(!param.year) return param.failFunc({err:"no year"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.year+"-1-1")}});
	conditions.push({time: {$lte: new Date(param.year+"-12-31")}});
	var query   = {$and: conditions};

	WaterLevelDailySum.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		for(var i=0;i<data.length;i++){
			data[i].time = Util.DateToDateString(data[i].time);
		}
		param.succFunc(data);
	});
}

module.exports = wlc;