var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var ReservoirController = require("../controller/reservoirController");

var meta = {};
meta.version = Config.version;
meta.hostname = Config.hostname;

router.get("/info", function(req, res){

});

router.get("/data", function(req, res){

});

router.get("/hourSum", function(req, res){

});

router.get("/dailySum", function(req, res){

});

module.exports = router;