var express = require("express");
var ejs = require("ejs");
var mongoose = require("mongoose");
var Config = require("./config");

var ViewRoute = require("./app/route/viewRoute.js");
var RainRoute = require("./app/route/rainRoute.js");
var ReservoirRoute = require("./app/route/reservoirRoute.js");
var WaterLevelRoute = require("./app/route/waterLevelRoute.js");
var WaterLevelDrainRoute = require("./app/route/waterLevelDrainRoute.js");
var WaterLevelAgriRoute = require("./app/route/waterLevelAgriRoute.js");
var WaterLevelGateRoute = require("./app/route/waterLevelGateRoute.js");
var SewerRoute = require("./app/route/sewerRoute.js");
var PumpRoute = require("./app/route/pumpRoute.js");
var TideRoute = require("./app/route/tideRoute.js");
var AlertRoute = require("./app/route/alertRoute.js");
var FloodRoute = require("./app/route/floodRoute.js");
var StatisticRoute = require("./app/route/statisticRoute.js");
var ElevRoute = require("./app/route/elevRoute.js");
var WindRoute = require("./app/route/windRoute.js");
var WaterboxRoute = require("./app/route/waterboxRoute.js");

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
app.use("/waterLevelDrain", WaterLevelDrainRoute);
app.use("/waterLevelAgri", WaterLevelAgriRoute);
app.use("/waterLevelGate", WaterLevelGateRoute);
app.use("/sewer", SewerRoute);
app.use("/pump", PumpRoute);
app.use("/tide", TideRoute);
app.use("/alert", AlertRoute);
app.use("/flood", FloodRoute);
app.use("/statistic", StatisticRoute);
app.use("/elev", ElevRoute);
app.use("/wind", WindRoute);
app.use("/waterbox", WaterboxRoute);

process.on('exit',function(code){
	mongoose.disconnect();
});

app.listen(app.port, app.host);
console.log("Server started");

