var express = require("express");
var ejs = require("ejs");
var mongoose = require("mongoose");
var Config = require("./config");

var ViewRoute = require("./app/route/viewRoute.js");
var RainRoute = require("./app/route/rainRoute.js");
var ReservoirRoute = require("./app/route/reservoirRoute.js");
var WaterLevelRoute = require("./app/route/waterLevelRoute.js");
var AlertRoute = require("./app/route/alertRoute.js");
var FloodRoute = require("./app/route/floodRoute.js");
var StatisticRoute = require("./app/route/statisticRoute.js");

mongoose.connect("mongodb://localhost/RiverLog", {useNewUrlParser:true,useUnifiedTopology:true});
mongoose.Promise = global.Promise;
mongoose.pluralize(null);

var app = express();
app.set('view engine', 'ejs');
app.set("views", __dirname);
app.port = Config.serverPort;
app.host = "0.0.0.0";
app.use('/static',express.static(__dirname + '/static'));

app.use("/", ViewRoute);
app.use("/rain", RainRoute);
app.use("/reservoir", ReservoirRoute);
app.use("/waterLevel", WaterLevelRoute);
app.use("/alert", AlertRoute);
app.use("/flood", FloodRoute);
app.use("/statistic", StatisticRoute);

process.on('exit',function(code){
	mongoose.disconnect();
});

app.listen(app.port, app.host);
console.log("Server started");

