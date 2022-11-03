var mongoose = require('mongoose');
var CCTVStation = require('../../db/cctvStation');
var Util = require("../util");

var cc = {};

cc.GetStation = function(param){
	CCTVStation.find({}, {__v:0}).lean().exec(function(err, sites){
		if(err) return param.failFunc({err:err});
		else return param.succFunc(sites);
	});
}

module.exports = cc;