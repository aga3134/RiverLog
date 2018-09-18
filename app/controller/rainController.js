var mongoose = require('mongoose');
var RainStation = require('../../db/rainStation');
var RainDailySum = require('../../db/rainDailySum');
var Rain10minSum = require('../../db/rain10minSum');

//一天的data存成一個collection，必免資料太大存取很慢
var RainSchema = require('../../db/rainSchema');

var rc = {};

rc.GetStation = function(param){

}

rc.GetData = function(param){

}

rc.Get10minSum = function(param){

}

rc.GetDailySum = function(param){

}

module.exports = rc;