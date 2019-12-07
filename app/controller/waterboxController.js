var mongoose = require('mongoose');
var WaterboxDevice = require('../../db/waterboxDevice');
var WaterboxLatest = require('../../db/waterboxLatest');
var Util = require("../util");

//一天的data存成一個collection，避免資料太大存取很慢
var WaterboxSchema = require('../../db/waterboxSchema');


var wbc = {};

wbc.GetStation = function(param){
	WaterboxDevice.find({}, {__v:0}).lean().exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

wbc.GetLatestData = function(param){
	WaterboxLatest.find({}, {__v:0}).lean().exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

wbc.GetData = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var condition = [];
	if(param.minLat) condition.push({'lat': {$gte: param.minLat}});
	if(param.maxLat) condition.push({'lat': {$lte: param.maxLat}});
	if(param.minLng) condition.push({'lng': {$gte: param.minLng}});
	if(param.maxLng) condition.push({'lng': {$lte: param.maxLng}});

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Waterbox = mongoose.model("waterbox"+t, WaterboxSchema);

	var query = {};
	if(condition.length > 0){
		query.$and = condition;
		WaterboxDevice.find(query, { __v:0}).lean().exec(function(err, sites){
			if(err) return param.failFunc({err:err});
			
			var idArr = [];
			for(var i=0;i<sites.length;i++){
				idArr.push(sites[i]._id);
			}

			var condition = [];
			condition.push({stationID: {$in:idArr}});
			var query   = {$and: condition};
			Waterbox.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
				if(err) return param.failFunc({err:err});
				param.succFunc(data);
			});
		});
	}
	else{
		Waterbox.find({}, {_id: 0, __v: 0}).lean().exec(function(err, data){
			if(err) return param.failFunc({err:err});
			param.succFunc(data);
		});
	}

	
}

module.exports = wbc;