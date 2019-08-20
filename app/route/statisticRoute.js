var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");
var StatisticController = require("../controller/statisticController");

var meta = {};
meta.version = Config.version;
meta.hostname = Config.hostname;

router.get("/waterUseAgriculture", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.WaterUseAgriculture(param);
});

router.get("/waterUseCultivation", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.WaterUseCultivation(param);
});

router.get("/waterUseLivestock", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.WaterUseLivestock(param);
});

router.get("/waterUseLiving", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.WaterUseLiving(param);
});

router.get("/waterUseIndustry", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.WaterUseIndustry(param);
});

router.get("/waterUseOverview", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.WaterUseOverview(param);
});

router.get("/monthWaterUse", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.MonthWaterUse(param);
});

router.get("/reservoirUse", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.ReservoirUse(param);
});

router.get("/reservoirSiltation", function(req, res){
	var param = {};
	param.succFunc = function(result){
		res.status(200).json({"status":"ok","data": result});
	};
	param.failFunc = function(result){
		res.status(200).json({"status": "fail","message": result.err});
	};
	StatisticController.ReservoirSiltation(param);
});


module.exports = router;