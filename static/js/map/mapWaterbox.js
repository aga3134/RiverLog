
class MapWaterbox extends MapLayer{
	constructor(option){
		if(option.dataSiteKey == null) option.dataSiteKey = "device_id";
		if(option.divideLatLng == null) option.divideLatLng = false;
		super(option);

		this.itemArr = [
			//sy
			{"name": "溶氧", "value": "s_do2", "unit":"mg/L"},
			{"name": "導電度", "value": "s_ec2", "unit":"uS/cm"},
			{"name": "酸鹼度", "value": "s_ph3", "unit":""},
			{"name": "溫度(水體)", "value": "s_t8.1", "unit":"度C"},
			{"name": "溫度(設備機內)", "value": "s_t8.2", "unit":"度C"},
			{"name": "濕度(設備機內)", "value": "s_h6", "unit":"%"},
			{"name": "電壓", "value": "s_v1", "unit":"V"},
			{"name": "電流", "value": "s_v1", "unit":"mA"},
			{"name": "訊號強度", "value": "s_rssi1", "unit":""},
			//lass
			/*{"name": "水質-pH", "value": "s_ph1", "unit":""},
			{"name": "水質-EC", "value": "s_ec1", "unit":"uS/cm"},
			{"name": "水質-濁度", "value": "s_Tb", "unit":"NTU"},
			{"name": "水溫", "value": "s_t6", "unit":"度C"},
			{"name": "Atlas-pH", "value": "s_ph2", "unit":""},
			{"name": "Atlas-EC", "value": "s_ec2", "unit":"uS/cm"},
			{"name": "Atlas-水溫", "value": "s_t7", "unit":"度C"},
			{"name": "Atlas-DO", "value": "s_do2", "unit":"mg/L"},
			{"name": "Atlas-ORP", "value": "s_orp2", "unit":"mV"},
			{"name": "ISE電極-氨離子", "value": "s_ise1", "unit":"mV"},
			{"name": "ISE電極-硝酸鹽離子", "value": "s_ise2", "unit":"mV"},
			{"name": "電壓", "value": "s_v1", "unit":"V"},
			{"name": "電流", "value": "s_v1", "unit":"mA"},*/
		];
	}

	LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.waterboxOption.show) return;
		param.expendData = true;
		MapLayer.prototype.LoadLayer.call(this,param);
    }

	UpdateInfoWindow(d){
		var str = "<p>"+d.device_id+"</p>";
		for(var i=0;i<this.itemArr.length;i++){
			var item = this.itemArr[i];
			if(d[item.value]){
				str += "<p>"+item.name+" "+d[item.value]+" "+item.unit+"</p>";
			}
		}
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
				var itemColor = g_APP.color.waterbox[targetItem];
				if(!itemColor){
					itemColor = {};
					itemColor.domain = [0,100];
					itemColor.range = ["#0000ff","#ff0000"];
					itemColor.color = d3.scale.linear()
						.domain(itemColor.domain)
						.range(itemColor.range);
				}
				var overlay = new WaterboxOverlay({
					map: this.map,
					lat: d.lat,
					lng: d.lng,
					size: size,
					svgID: "svg_"+d.device_id,
					value: d[targetItem],
					opacity: g_APP.waterboxOption.opacity,
					color: itemColor.color
				});
				overlay.addListener('click', clickFn);
				this.layer[d.device_id] = overlay;
			}
		}
	}

}
