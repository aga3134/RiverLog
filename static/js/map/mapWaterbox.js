
class MapWaterbox extends MapLayer{
	constructor(option){
		if(option.dataSiteKey == null) option.dataSiteKey = "device_id";
		if(option.divideLatLng == null) option.divideLatLng = false;
		super(option);
	}

	LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.waterboxOption.show) return;
		param.expendData = true;
		MapLayer.prototype.LoadLayer.call(this,param);
    }

	UpdateInfoWindow(d){
		var str = "<p>"+d.device_id+"</p>";
		str += "<p>水溫 "+d.s_t0+" 度C</p>";
		str += "<p>酸鹼度 "+d.s_ph+"</p>";
		str += "<p>導電度 "+d.s_ec+" uS/cm</p>";
		str += "<p>濁度 "+d.s_Tb+" NTU</p>";
		str += "<p>水位 "+d.s_Lv+" M</p>";
		str += "<p>溶氧 "+d.s_DO+" mg/L</p>";
		str += "<p>氧化還原電位 "+d.s_orp+" mV</p>";
		str += "<p>時間 "+d.time+" </p>";
		str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"waterbox\");'>今日變化</div></div>";
		var loc = new google.maps.LatLng(d.lat, d.lng);
		this.infoWindow.setOptions({content: str, position: loc});
	}

	GetBaseScale(){
		var zoom = this.map.getZoom();
		if(zoom <= 10) return 10*(Math.pow(1.5,zoom-7));
		else return 50;
	}

	DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.waterboxOption.show) return;

		var waterboxData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!waterboxData) return;

		var targetItem = g_APP.waterboxOption.targetItem;
		for(var i=0;i<waterboxData.length;i++){
			var d = waterboxData[i];
			
			//info window有打開，更新資訊
			if(this.infoWindow.getMap() && this.infoTarget == d.device_id){
				this.UpdateInfoWindow(d);
			}
			var size = this.GetBaseScale()*g_APP.waterboxOption.scale;
			var clickFn = this.GenClickFn(waterboxData,i,"device_id");

			if(this.layer[d.device_id]){
				var overlay = this.layer[d.device_id];
				var option = {
					map: this.map,
					size: size,
					value: d[targetItem],
					opacity: g_APP.waterboxOption.opacity
				};
				overlay.Update(option);
				google.maps.event.clearListeners(overlay,"click");
				
				overlay.addListener('click', clickFn);
			}
			else{
				var overlay = new WaterboxOverlay({
					map: this.map,
					lat: d.lat,
					lng: d.lng,
					size: size,
					svgID: "svg_"+d.device_id,
					value: d[targetItem],
					opacity: g_APP.waterboxOption.opacity,
					color: g_APP.color.waterbox[targetItem].color
				});
				overlay.addListener('click', clickFn);
				this.layer[d.device_id] = overlay;
			}
		}
	}

}
