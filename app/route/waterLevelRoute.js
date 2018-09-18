var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var WaterLevelController = require("../controller/waterLevelController");

var meta = {};
meta.version = Config.version;
meta.hostname = Config.hostname;

router.get("/station", function(req, res){

});

router.get("/data", function(req, res){

});

router.get("/10minSum", function(req, res){

});

router.get("/dailySum", function(req, res){

});

module.exports = router;