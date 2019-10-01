var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var AlertController = require("../controller/alertController");

var meta = {};
meta.version = Config.version;
meta.hostname = Config.hostname;

router.get("/alertData", function(req, res){
	var param = {};
	param.date = req.query.date;
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	AlertController.GetData(param);
});

router.get("/typhoonData", function(req, res){
	var param = {};
	param.date = req.query.date;
	param.year = req.query.year;
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	AlertController.GetTyphoonData(param);
});

module.exports = router;