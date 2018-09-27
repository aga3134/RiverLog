
var g_Util = function(){
	var PadLeft = function(val, totalLen, ch){
		var  len = (totalLen - String(val).length)+1;
		return len > 0? new Array(len).join(ch || '0')+val : val;
	}

	var DateToString = function (date,dateSep="-",timeSep=":"){
		var yyyy = date.getFullYear();
		var mm = PadLeft(date.getMonth()+1,2);
		var dd = PadLeft(date.getDate(),2);
		var HH = PadLeft(date.getHours(),2);
		var MM = PadLeft(date.getMinutes(),2);
		var SS = PadLeft(date.getSeconds(),2);
		return yyyy+dateSep+mm+dateSep+dd+" "+HH+timeSep+MM+timeSep+SS;
	}

	var DateToDateString = function(date,dateSep="-"){
		var yyyy = date.getFullYear();
		var mm = PadLeft(date.getMonth()+1,2);
		var dd = PadLeft(date.getDate(),2);
		return yyyy+dateSep+mm+dateSep+dd;
	}

	var DateToTimeString = function(date,timeSep=":"){
		var HH = PadLeft(date.getHours(),2);
		var MM = PadLeft(date.getMinutes(),2);
		var SS = PadLeft(date.getSeconds(),2);
		return HH+timeSep+MM+timeSep+SS;
	}
	return {
		PadLeft: PadLeft,
		DateToString: DateToString,
		DateToDateString: DateToDateString,
		DateToTimeString: DateToTimeString
	};
}();
