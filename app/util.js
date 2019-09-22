var dayjs = require('dayjs');

var util = {};
var timeZone = "Asia/Taipei";

util.PadLeft = function(val, totalLen, ch){
	var  len = (totalLen - String(val).length)+1;
	return len > 0? new Array(len).join(ch || '0')+val : val;
}

util.DateToString = function (date,dateSep="-",timeSep=":"){
	var t = dayjs(date,{timeZone: timeZone});
	var yyyy = date.get("year");
	var mm = util.PadLeft(t.get("month")+1,2);
	var dd = util.PadLeft(t.get("date"),2);
	var HH = util.PadLeft(t.get("hour"),2);
	var MM = util.PadLeft(t.get("minute"),2);
	var SS = util.PadLeft(t.get("second"),2);
	//console.log(yyyy+dateSep+mm+dateSep+dd+" "+HH+timeSep+MM+timeSep+SS);
	return yyyy+dateSep+mm+dateSep+dd+" "+HH+timeSep+MM+timeSep+SS;
}

util.DateToDateString = function(date,dateSep="-"){
	var t = dayjs(date,{timeZone: timeZone});
	var yyyy = t.get("year");
	var mm = util.PadLeft(t.get("month")+1,2);
	var dd = util.PadLeft(t.get("date"),2);
	//console.log(yyyy+dateSep+mm+dateSep+dd);
	return yyyy+dateSep+mm+dateSep+dd;
}

util.DateToTimeString = function(date,timeSep=":"){
	var t = dayjs(date,{timeZone: timeZone});
	var HH = util.PadLeft(t.get("hour"),2);
	var MM = util.PadLeft(t.get("minute"),2);
	var SS = util.PadLeft(t.get("second"),2);
	//console.log(HH+timeSep+MM+timeSep+SS);
	return HH+timeSep+MM+timeSep+SS;
}

module.exports = util;