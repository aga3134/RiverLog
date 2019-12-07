var express = require("express");
var ejs = require("ejs");
var router = express.Router();
var Config = require("../../config.json");

var meta = {};
meta.version = Config.version;
meta.hostname = Config.hostname;

router.get('/', function(req, res) {
	meta.title = "山河事件簿";
	meta.path = req.originalUrl;
	meta.desc = Config.desc;
	res.render("view/index.ejs",{meta: meta});
});

router.get('/waterUse', function(req, res) {
	meta.title = "山河事件簿";
	meta.path = req.originalUrl;
	meta.desc = Config.desc;
	res.render("view/waterUse.ejs",{meta: meta});
});

router.get('/env', function(req, res) {
	meta.title = "山河事件簿";
	meta.path = req.originalUrl;
	meta.desc = Config.desc;
	res.render("view/env.ejs",{meta: meta});
});


module.exports = router;