var express = require("express");
var ejs = require("ejs");
var Config = require('./config');

var ViewRoute = require("./app/route/viewRoute.js");
var RainRoute = require("./app/route/rainRoute.js");
var ReservoirRoute = require("./app/route/reservoirRoute.js");
var WaterLevelRoute = require("./app/route/waterLevelRoute.js");

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

app.listen(app.port, app.host);
console.log("Server started");

