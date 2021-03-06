var mongoose = require('mongoose');
var WaterLevelDrainSite = require('../../db/waterLevelDrainSite');
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var WaterLevelDrainSchema = require('../../db/waterLevelDrainSchema');
var WaterLevelDrainGridSchema = require("../../db/waterLevelDrainGridSchema");


var wlc = {};

wlc.GetStation = function(param){
	WaterLevelDrainSite.find({}, {__v:0}).lean().exec(function(err, sites){
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
	var WaterLevelDrain = mongoose.model("waterLevelDrain"+t, WaterLevelDrainSchema);

	var query = {};
	if(condition.length > 0){
		query.$and = condition;
		WaterLevelDrainSite.find(query, { __v:0}).lean().exec(function(err, sites){
			if(err) return param.failFunc({err:err});
			
			var idArr = [];
			for(var i=0;i<sites.length;i++){
				idArr.push(sites[i]._id);
			}

			var condition = [];
			condition.push({stationID: {$in:idArr}});
			var query   = {$and: condition};
			WaterLevelDrain.find(query, {_id: 0, __v: 0}).lean().exec(function(err, data){
				if(err) return param.failFunc({err:err});
				param.succFunc(data);
			});
		});
	}
	else{
		WaterLevelDrain.find({}, {_id: 0, __v: 0}).lean().exec(function(err, data){
			if(err) return param.failFunc({err:err});
			param.succFunc(data);
		});
	}

	
}

wlc.GridData = function(param){
	var gridPerUnit = 10;
	var levelNum = 3;
	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var level = parseInt(param.level);
	var minLat = parseFloat(param.minLat);
	var maxLat = parseFloat(param.maxLat);
	var minLng = parseFloat(param.minLng);
	var maxLng = parseFloat(param.maxLng);
	if(!date || !param.level || level < 0 || level >= levelNum) return param.failFunc({err:"invalid param"});;

	var query = {"lev": level};
	var condition = [];
	var scale = gridPerUnit/Math.pow(2,level);
	var interval = 1.0/scale;
	if(minLat) condition.push({'y': {$gte: minLat*scale}});
	if(maxLat) condition.push({'y': {$lte: maxLat*scale}});
	if(minLng) condition.push({'x': {$gte: minLng*scale}});
	if(maxLng) condition.push({'x': {$lte: maxLng*scale}});

	if(condition.length > 0){
		query.$and = condition;
	}
	var WaterLevelDrainGrid = mongoose.model('waterLevelDrainGrid'+t, WaterLevelDrainGridSchema);
	WaterLevelDrainGrid.find(query, { '_id': 0, '__v': 0,'lev': 0}).lean().exec(function(err, data){
		if(err){
			console.log(err);
			return param.failFunc({err:"load grid fail"});
		}
		
		var result = {};
		result.level = level;
		result.data = data;
		param.succFunc(result);
	});
};

module.exports = wlc;