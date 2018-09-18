var mongoose = require('mongoose');
var ReservoirInfo = require('../../db/reservoirInfo');
var ReservoirDailySum = require('../../db/reservoirDailySum');
var ReservoirHourSum = require('../../db/reservoirHourSum');

//一天的data存成一個collection，必免資料太大存取很慢
var ReservoirSchema = require('../../db/reservoirSchema');

var rc = {};

rc.GetInfo = function(param){

}

rc.GetData = function(param){

}

rc.GetHourSum = function(param){

}

rc.GetDailySum = function(param){

}

module.exports = rc;