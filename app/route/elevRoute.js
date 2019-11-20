var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var ElevController = require("../controller/elevController");

router.get("/gridData", function(req, res){
	var param = {};
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
	ElevController.GridData(param);
});

module.exports = router;