var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var WaterLevelDrainController = require("../controller/waterLevelDrainController");

router.get("/station", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	WaterLevelDrainController.GetStation(param);
});

router.get("/waterLevelDrainData", function(req, res){
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
	WaterLevelDrainController.GetData(param);
});

module.exports = router;