var mongoose = require("mongoose");
var RainStation = require("../../db/rainStation");
var RainDailySum = require("../../db/rainDailySum");
var Rain10minSum = require("../../db/rain10minSum");
var Util = require("../util");

//一天的data存成一個collection，必免資料太大存取很慢
var RainSchema = require("../../db/rainSchema");
var RainGridSchema = require("../../db/rainGridSchema");

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
	
	var condition = [];
	if(param.minLat) condition.push({'lat': {$gte: param.minLat}});
	if(param.maxLat) condition.push({'lat': {$lte: param.maxLat}});
	if(param.minLng) condition.push({'lon': {$gte: param.minLng}});
	if(param.maxLng) condition.push({'lon': {$lte: param.maxLng}});

	var date = new Date(param.date);
	var t = Util.DateToDateString(date,"");
	var Rain = mongoose.model("rain"+t, RainSchema);

	var query = {};
	if(condition.length > 0){
		query.$and = condition;
		RainStation.find(query, {_id: 0, __v:0}).exec(function(err, sites){
			if(err) return param.failFunc({err:err});
			
			var idArr = [];
			for(var i=0;i<sites.length;i++){
				idArr.push(sites[i].stationID);
			}

			var condition = [];
			condition.push({stationID: {$in:idArr}});
			var query   = {$and: condition};
			Rain.find(query, {_id:0,__v:0,hour12:0,hour24:0}).exec(function(err, data){
				if(err) return param.failFunc({err:err});
				param.succFunc(data);
			});
		});
	}
	else{
		Rain.find({}, {_id:0,__v:0,hour12:0,hour24:0}).exec(function(err, data){
			if(err) return param.failFunc({err:err});
			param.succFunc(data);
		});
	}

	
};

rc.Get10minSum = function(param){
	if(!param.date) return param.failFunc({err:"no date"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.date+" 00:00")}});
	conditions.push({time: {$lte: new Date(param.date+" 23:59")}});
	var query   = {$and: conditions};

	Rain10minSum.find(query, {_id: 0, __v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

rc.GetDailySum = function(param){
	if(!param.year) return param.failFunc({err:"no year"});

	var conditions = [];
	conditions.push({time: {$gte: new Date(param.year+"-1-1")}});
	conditions.push({time: {$lte: new Date(param.year+"-12-31")}});
	var query   = {$and: conditions};

	RainDailySum.find(query, {_id: 0, __v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

rc.GridData = function(param){
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
	var RainGrid = mongoose.model('rainGrid'+t, RainGridSchema);
	RainGrid.find(query, { '_id': 0, '__v': 0,'lev': 0}).exec(function(err, data){
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

module.exports = rc;