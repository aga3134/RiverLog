
class MapWind extends MapLayer{
	constructor(option){
		if(option.siteKey == null) option.siteKey = "stationID";
		if(option.dataSiteKey == null) option.dataSiteKey = "stationID";
		if(option.divideLatLng == null) option.divideLatLng = false;
		super(option);
	}

	LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.mapOption.showWind) return;
		param.expendData = true;
		MapLayer.prototype.LoadLayer.call(this,param);
    }

	DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.mapOption.showWind) return;
		var hour = g_APP.curTime.split(":")[0];
		var windData = g_APP.GetDataFromTime(data,hour+":00");
		if(!windData) return;

		function GenArrow(loc, wDir, wSpeed, scale){
			var arrow = [];
			var theta = wDir*Math.PI/180;
			var mag = wSpeed*scale;
			var a1 = (wDir+150)*Math.PI/180;
			var a2 = (wDir+270)*Math.PI/180;
			var as = 1*scale;
			arrow[0] = loc;
			arrow[1] = {lat: loc.lat-mag*Math.cos(theta), lng: loc.lng-mag*Math.sin(theta)};
			arrow[2] = {lat: arrow[1].lat-as*Math.cos(a1), lng: arrow[1].lng-as*Math.sin(a1)};
			arrow[3] = {lat: arrow[2].lat-as*Math.cos(a2), lng: arrow[2].lng-as*Math.sin(a2)};
			arrow[4] = {lat: arrow[1].lat, lng: arrow[1].lng};
			return arrow;
		}
		var arrowScale = 0.01*this.GetBaseScale();

		for(var i=0;i<windData.length;i++){
			var sID = windData[i].stationID;
			var s = this.data.site[sID];
			var d = windData[i];
			if(!s) continue;
			if(d.WDSD < 0) continue;
			
			var loc = {lat:parseFloat(s.lat),lng:parseFloat(s.lon)};
			if(this.layer[sID]){
				this.layer[sID].setOptions({
					map: this.map,
		    		path: GenArrow(loc, d.WDIR, d.WDSD, arrowScale),
		    	});
			}
			else{
				var arrow = new google.maps.Polyline({
					path: GenArrow(loc, d.WDIR, d.WDSD, arrowScale),
					geodesic: true,
					strokeColor: '#333333',
					strokeWeight: 1,
					map: this.map,
					zIndex: 3
				});
				this.layer[sID] = arrow;
			}
		}
	}

}
