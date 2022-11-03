var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var CCTVController = require("../controller/cctvController");

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
	CCTVController.GetStation(param);
});

module.exports = router;