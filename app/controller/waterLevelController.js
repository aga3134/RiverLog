var mongoose = require('mongoose');
var WaterLevelStation = require('../../db/waterLevelStation');
var WaterLevelDailySum = require('../../db/waterLevelDailySum');
var WaterLevel10minSum = require('../../db/waterLevel10minSum');

//一天的data存成一個collection，必免資料太大存取很慢
var WaterLevelSchema = require('../../db/waterLevelSchema');

var wlc = {};

wlc.GetStation = function(param){

}

wlc.GetData = function(param){

}

wlc.Get10minSum = function(param){

}

wlc.GetDailySum = function(param){

}

module.exports = wlc;