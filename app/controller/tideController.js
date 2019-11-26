var mongoose = require('mongoose');
var TideStation = require('../../db/tideStation');
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var TideSchema = require('../../db/tideSchema');


var tc = {};

tc.GetStation = function(param){
	TideStation.find({}, {_id: 0, __v:0}).lean().exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

tc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var condition = [];
	if(param.minLat) condition.push({'lat': {$gte: param.minLat}});
	if(param.maxLat) condition.push({'lat': {$lte: param.maxLat}});
	if(param.minLng) condition.push({'lng': {$gte: param.minLng}});
	if(param.maxLng) condition.push({'lng': {$lte: param.maxLng}});

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Tide = mongoose.model("tide"+t, TideSchema);

	var query = {};
	if(condition.length > 0){
		query.$and = condition;
		TideStation.find(query, {_id:0,  __v:0}).lean().exec(function(err, sites){
			if(err) return param.failFunc({err:err});
			
			var idArr = [];
			for(var i=0;i<sites.length;i++){
				idArr.push(sites[i].no);
			}

			var condition = [];
			condition.push({stationNo: {$in:idArr}});
			var query   = {$and: condition};
			Tide.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
				if(err) return param.failFunc({err:err});
				param.succFunc(data);
			});
		});
	}
	else{
		Tide.find({}, {_id: 0, __v: 0}).lean().exec(function(err, data){
			if(err) return param.failFunc({err:err});
			param.succFunc(data);
		});
	}

	
}

module.exports = tc;