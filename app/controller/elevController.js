var mongoose = require("mongoose");
var ElevGrid = require("../../db/elevGrid");
var Util = require("../util");

var ec = {};

ec.GridData = function(param){
	var gridPerUnit = 1000;
	var levelNum = 8;
	var level = parseInt(param.level);
	var minLat = parseFloat(param.minLat);
	var maxLat = parseFloat(param.maxLat);
	var minLng = parseFloat(param.minLng);
	var maxLng = parseFloat(param.maxLng);
	if(!param.level || level < 0 || level >= levelNum) return param.failFunc({err:"invalid param"});;

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
	ElevGrid.find(query, { '_id': 0, '__v': 0,'lev': 0}).exec(function(err, data){
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

module.exports = ec;