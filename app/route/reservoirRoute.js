var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var ReservoirController = require("../controller/reservoirController");

var meta = {};
meta.version = Config.version;
meta.hostname = Config.hostname;

router.get("/info", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	ReservoirController.GetInfo(param);
});

router.get("/extremeDate", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	ReservoirController.GetExtremeDate(param);
});

router.get("/reservoirData", function(req, res){
	var param = {};
	param.date = req.query.date;
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	ReservoirController.GetData(param);
});

router.get("/hourSum", function(req, res){
	var param = {};
	param.date = req.query.date;
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	ReservoirController.GetHourSum(param);
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
	ReservoirController.GetDailySum(param);
});

module.exports = router;