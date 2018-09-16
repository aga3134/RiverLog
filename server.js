var express = require("express");
var ejs = require("ejs");
var route = require("./app/route.js");
var Config = require('./config');

var app = express();
app.set('view engine', 'ejs');
app.set("views", __dirname);
app.port = Config.serverPort;
app.host = "0.0.0.0";
app.use('/static',express.static(__dirname + '/static'));

route(app);
app.listen(app.port, app.host);
console.log("Server started");

