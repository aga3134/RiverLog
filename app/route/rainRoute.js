var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var RainController = require("../controller/rainController");

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
	RainController.GetStation(param);
});

router.get("/extremeDate", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	RainController.GetExtremeDate(param);
});

router.get("/rainData", function(req, res){
	var param = {};
	param.date = req.query.date;
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	RainController.GetData(param);
});

router.get("/10minSum", function(req, res){
	var param = {};
	param.date = req.query.date;
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	RainController.Get10minSum(param);
});

router.get("/dailySum", function(req, res){
	var param = {};
	param.year = req.query.year;
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	RainController.GetDailySum(param);
});

module.exports = router;