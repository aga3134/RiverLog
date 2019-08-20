var mongoose = require("mongoose");
var Util = require("../util");
var WaterUseAgriculture = require('../../db/waterUseAgriculture');
var WaterUseCultivation = require('../../db/waterUseCultivation');
var WaterUseIndustry = require('../../db/waterUseIndustry');
var WaterUseLivestock = require('../../db/waterUseLivestock');
var WaterUseLiving = require('../../db/waterUseLiving');
var WaterUseOverview = require('../../db/waterUseOverview');
var MonthWaterUse = require('../../db/monthWaterUse');
var ReservoirUse = require('../../db/reservoirUse');
var ReservoirSiltation = require('../../db/reservoirSiltation');

var sc = {};

sc.WaterUseAgriculture = function(param){
	WaterUseAgriculture.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

sc.WaterUseCultivation = function(param){
	WaterUseCultivation.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

sc.WaterUseIndustry = function(param){
	WaterUseIndustry.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

sc.WaterUseLivestock = function(param){
	WaterUseLivestock.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

sc.WaterUseLiving = function(param){
	WaterUseLiving.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

sc.WaterUseOverview = function(param){
	WaterUseOverview.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

sc.MonthWaterUse = function(param){
	MonthWaterUse.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

sc.ReservoirUse = function(param){
	ReservoirUse.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

sc.ReservoirSiltation = function(param){
	ReservoirSiltation.find({}, {_id:0,__v: 0}).exec(function(err, data){
		if(err) return param.failFunc({err:err});
		param.succFunc(data);
	});
};

module.exports = sc;