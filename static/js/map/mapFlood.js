
class MapFlood extends MapLayer{
	constructor(option){
		if(option.siteKey == null) option.siteKey = "_id";
		if(option.dataSiteKey == null) option.dataSiteKey = "stationID";
		if(option.divideLatLng == null) option.divideLatLng = false;
		super(option);
	}

	LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.floodOption.show) return;
		param.expendData = true;
		MapLayer.prototype.LoadLayer.call(this,param);
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
		if(zoom <= 10) return 10*(Math.pow(1.5,zoom-7));
		else return 50;
	}

	DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.floodOption.show) return;

		var floodData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!floodData) return;

		for(var i=0;i<floodData.length;i++){
			var sID = floodData[i].stationID;
			var s = this.data.site[sID];
			if(!s) continue;
			var d = floodData[i];
			if(d.value < g_APP.floodOption.thresh) continue;

			//info window有打開，更新資訊
			if(this.infoWindow.getMap() && this.infoTarget == sID){
				this.UpdateInfoWindow(d);
			}
			var size = this.GetBaseScale()*g_APP.floodOption.scale;
			var clickFn = this.GenClickFn(floodData,i,"stationID");

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
				
				overlay.addListener('click', clickFn);
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
				overlay.addListener('click', clickFn);
				this.layer[sID] = overlay;
			}
		}
	}

}
