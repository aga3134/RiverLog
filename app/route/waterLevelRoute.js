var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var WaterLevelController = require("../controller/waterLevelController");

var meta = {};
meta.version = Config.version;
meta.hostname = Config.hostname;

router.get("/station", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	WaterLevelController.GetStation(param);
});

router.get("/waterLevelData", function(req, res){
	var param = {};
	param.date = req.query.date;
	param.minLat = req.query.minLat;
	param.maxLat = req.query.maxLat;
	param.minLng = req.query.minLng;
	param.maxLng = req.query.maxLng;
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	WaterLevelController.GetData(param);
});

router.get("/gridData", function(req, res){
	var param = {};
	param.date = req.query.date;
	param.level = req.query.level;
	param.minLat = req.query.minLat;
	param.maxLat = req.query.maxLat;
	param.minLng = req.query.minLng;
	param.maxLng = req.query.maxLng;
	
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	WaterLevelController.GridData(param);
});

module.exports = router;