
class MapFlood extends MapLayer{
	constructor(option){
		option.siteKey = "_id";
		option.dataSiteKey = "stationID";
		option.divideLatLng = false;
		super(option);
	}

	UpdateInfoWindow(d){
		var s = this.data.site[d.stationID];
		var str = "<p>"+s.stationName+"</p>";
		str += "<p>淹水 "+d.value+" 公分</p>";
		str += "<p>時間 "+d.time+" </p>";
		str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"flood\");'>今日變化</div></div>";
		var loc = new google.maps.LatLng(s.lat, s.lng);
		this.infoWindow.setOptions({content: str, position: loc});
	}

	GetBaseScale(){
		var zoom = this.map.getZoom();
		if(zoom <= 10) return 10*(Math.pow(1.7,zoom-7));
		else return 100;
	}

	DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.floodOption.show) return;

		var floodData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!floodData) return;

		var clickFn = function(data,i){ 
			return function() {
				this.UpdateInfoWindow(data[i]);
				this.infoWindow.open(this.map);
				this.infoTarget = data[i].stationID;
			}.bind(this);
		}.bind(this);

		for(var i=0;i<floodData.length;i++){
			var sID = floodData[i].stationID;
			var s = this.data.site[sID];
			if(!s) continue;

			//info window有打開，更新資訊
			if(this.infoWindow.getMap() && this.infoTarget == sID){
				this.UpdateInfoWindow(floodData[i]);
			}

			var size = this.GetBaseScale()*g_APP.floodOption.scale;
			var d = floodData[i];

			if(this.layer[sID]){
				var overlay = this.layer[sID];
				var option = {
					map: this.map,
					size: size,
					value: d.value,
					opacity: g_APP.floodOption.opacity
				};
				overlay.Update(option);
				google.maps.event.clearListeners(overlay,"click");
				overlay.addListener('click', clickFn(floodData,i));
			}
			else{
				var overlay = new FloodOverlay({
					map: this.map,
					lat: s.lat,
					lng: s.lng,
					size: size,
					svgID: "svg_"+sID,
					value: d.value,
					opacity: g_APP.floodOption.opacity,
					color: g_APP.color.flood
				});

				overlay.addListener('click', clickFn(floodData,i));
				this.layer[sID] = overlay;
			}
		}
	}

}
