
var g_Util = function(){
	var GetUrlParameter = function(){
		var queryStr = window.location.search.substring(1);
		var paramArr = queryStr.split('&');

		var result = {};
		for (var i=0; i<paramArr.length; i++) {
			var param = paramArr[i].split('=');
			result[param[0]] = param[1];
		}
		return result;
	};

	var GetUrlHash = function(){
		var queryStr = window.location.hash;
		var paramArr = queryStr.split('&');

		var result = {};
		for (var i=0; i<paramArr.length; i++) {
			var param = paramArr[i].split('=');
			result[param[0]] = param[1];
		}
		return result;
	};
	
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

	var RGBToHex = function(r,g,b){
		function componentToHex(c) {
			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		}
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}

	var HexToRGB = function(hex){
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	return {
		GetUrlParameter: GetUrlParameter,
		GetUrlHash: GetUrlHash,
		PadLeft: PadLeft,
		DateToString: DateToString,
		DateToDateString: DateToDateString,
		DateToTimeString: DateToTimeString,
		RGBToHex: RGBToHex,
		HexToRGB: HexToRGB
	};
}();
