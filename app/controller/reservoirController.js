var mongoose = require('mongoose');
var ReservoirInfo = require('../../db/reservoirInfo');
var ReservoirDailySum = require('../../db/reservoirDailySum');
var ReservoirHourSum = require('../../db/reservoirHourSum');
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var ReservoirSchema = require('../../db/reservoirSchema');

var rc = {};

rc.GetInfo = function(param){
	ReservoirInfo.find({}, {_id: 0, __v:0}).exec(function(err, info){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(info);
	});
}

rc.GetExtremeDate = function(param){
	var result = {};
	ReservoirDailySum.findOne({}).sort({time: -1}).exec(function(err, maxDate) {
		if(err) return param.failFunc({err:err});
		if(!maxDate) return param.failFunc({err:"no max date"});

		result.maxDate = Util.DateToDateString(maxDate.time);
		ReservoirDailySum.findOne({}).sort({time: 1}).exec(function(err, minDate) {
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
	conditions.push({ObservationTime: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({ObservationTime: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Reservoir = mongoose.model("reservoir"+t, ReservoirSchema);
	Reservoir.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});

		for(var i=0;i<data.length;i++){
			data[i].ObservationTime = Util.DateToTimeString(data[i].ObservationTime);
		}
		param.succFunc(data);
	});
}

rc.GetHourSum = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	ReservoirHourSum.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		for(var i=0;i<data.length;i++){
			data[i].time = Util.DateToTimeString(data[i].time);
		}
		param.succFunc(data);
	});
}

rc.GetDailySum = function(param){
	if(!param.year) return param.failFunc({err:"no year"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.year+"-1-1")}});
	conditions.push({time: {$lte: new Date(param.year+"-12-31")}});
	var query   = {$and: conditions};

	ReservoirDailySum.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
		if(err) return param.failFunc({err:err});
		for(var i=0;i<data.length;i++){
			data[i].time = Util.DateToDateString(data[i].time);
		}
		param.succFunc(data);
	});
}

module.exports = rc;