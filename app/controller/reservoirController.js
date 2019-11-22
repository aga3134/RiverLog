var mongoose = require('mongoose');
var ReservoirInfo = require('../../db/reservoirInfo');
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


rc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({ObservationTime: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({ObservationTime: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Reservoir = mongoose.model("reservoir"+t, ReservoirSchema);
	Reservoir.find(query, {_id: 0, __v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
}

module.exports = rc;