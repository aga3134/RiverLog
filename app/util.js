
var util = {};

util.PadLeft = function(val, totalLen, ch){
	var  len = (totalLen - String(val).length)+1;
	return len > 0? new Array(len).join(ch || '0')+val : val;
}

util.DateToString = function (date,dateSep="-",timeSep=":"){
	var yyyy = date.getFullYear();
	var mm = util.PadLeft(date.getMonth()+1,2);
	var dd = util.PadLeft(date.getDate(),2);
	var HH = util.PadLeft(date.getHours(),2);
	var MM = util.PadLeft(date.getMinutes(),2);
	var SS = util.PadLeft(date.getSeconds(),2);
	return yyyy+dateSep+mm+dateSep+dd+" "+HH+timeSep+MM+timeSep+SS;
}

util.DateToTimeString = function(date,dateSep="-"){
	var HH = util.PadLeft(date.getHours(),2);
	var MM = util.PadLeft(date.getMinutes(),2);
	var SS = util.PadLeft(date.getSeconds(),2);
	return HH+dateSep+MM+dateSep+SS;
}

util.DateToDateString = function(date,timeSep=":"){
	var yyyy = date.getFullYear();
	var mm = util.PadLeft(date.getMonth()+1,2);
	var dd = util.PadLeft(date.getDate(),2);
	return yyyy+timeSep+mm+timeSep+dd;
}

module.exports = util;