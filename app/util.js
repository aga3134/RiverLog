var spacetime = require('spacetime');

var util = {};
var taiwan = "Asia/Taipei";

util.PadLeft = function(val, totalLen, ch){
	var  len = (totalLen - String(val).length)+1;
	return len > 0? new Array(len).join(ch || '0')+val : val;
}

util.DateToString = function (date,dateSep="-",timeSep=":"){
	var t = spacetime(date,taiwan);
	return t.unixFmt("yyyy"+dateSep+"MM"+dateSep+"dd HH"+timeSep+"mm"+timeSep+"ss");
}

util.DateToDateString = function(date,dateSep="-"){
	var t = spacetime(date,taiwan);
	return t.unixFmt("yyyy"+dateSep+"MM"+dateSep+"dd");
}

util.DateToTimeString = function(date,timeSep=":"){
	var t = spacetime(date,taiwan);
	return t.unixFmt("HH"+timeSep+"mm"+timeSep+"ss");
}

module.exports = util;