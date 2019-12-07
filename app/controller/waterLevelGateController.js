var mongoose = require('mongoose');
var WaterLevelGateSite = require('../../db/waterLevelGateSite');
var Util = require("../util");

//一天的data存成一個collection，避免資料太大存取很慢
var WaterLevelGateSchema = require('../../db/waterLevelGateSchema');


var wlc = {};

wlc.GetStation = function(param){
	WaterLevelGateSite.find({}, {__v:0}).lean().exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

wlc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var condition = [];
	if(param.minLat) condition.push({'lat': {$gte: param.minLat}});
	if(param.maxLat) condition.push({'lat': {$lte: param.maxLat}});
	if(param.minLng) condition.push({'lng': {$gte: param.minLng}});
	if(param.maxLng) condition.push({'lng': {$lte: param.maxLng}});

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var WaterLevelGate = mongoose.model("waterLevelGate"+t, WaterLevelGateSchema);

	var query = {};
	if(condition.length > 0){
		query.$and = condition;
		WaterLevelGateSite.find(query, { __v:0}).lean().exec(function(err, sites){
			if(err) return param.failFunc({err:err});
			
			var idArr = [];
			for(var i=0;i<sites.length;i++){
				idArr.push(sites[i]._id);
			}

			var condition = [];
			condition.push({stationID: {$in:idArr}});
			var query   = {$and: condition};
			WaterLevelGate.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
				if(err) return param.failFunc({err:err});
				param.succFunc(data);
			});
		});
	}
	else{
		WaterLevelGate.find({}, {_id: 0, __v: 0}).lean().exec(function(err, data){
			if(err) return param.failFunc({err:err});
			param.succFunc(data);
		});
	}

	
}

module.exports = wlc;