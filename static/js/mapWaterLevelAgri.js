
class MapWaterLevelAgri extends MapLayer{
    constructor(option){
		option.siteKey = "_id";
		option.dataSiteKey = "stationID";
		option.divideLatLng = false;
		super(option);
    }

    UpdateInfoWindow(d){
		var s = this.data.site[d.stationID];
	    var str = "<p>"+s.stationName+"</p>";
	    str += "<p>水位 "+d.value.toFixed(2)+" m (";
	    if(d.diff >= 0) str += "+";
	    str += d.diff.toFixed(2)+" m)</p>";
	    str += "<p>時間 "+d.time+" </p>";
	    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"waterLevelDrain\");'>今日變化</div></div>";
	    var loc = new google.maps.LatLng(s.lat, s.lng); 
		this.infoWindow.setOptions({content: str, position: loc});
    }

    GetBaseScale(){
      var zoom = this.map.getZoom();
      if(zoom > 9) return 1*Math.pow(1.7,9-zoom);
      else return 1;
    }

    DrawIcon(lat,lng,value){
    	var baseScale = this.GetBaseScale();
	    var scale = 0.03*baseScale*g_APP.waterLevelOption.scale;
	    var valueScale = 0.3*baseScale*g_APP.waterLevelOption.scale;
	    var thresh = g_APP.waterLevelOption.thresh*0.01;
	    var arr = [];
	    if(Math.abs(value) < thresh){
			arr.push({lat: lat-scale*0.5, lng: lng});
			arr.push({lat: lat, lng: lng-scale*0.5});
			arr.push({lat: lat+scale*0.5, lng: lng});
			arr.push({lat: lat, lng: lng+scale*0.5});
	    }
	    else{
			var base = value>0?scale*0.5:-scale*0.5;
			arr.push({lat: lat, lng: lng-scale*0.5});
			arr.push({lat: lat+base+(value-thresh)*valueScale, lng: lng-scale*0.5});
			arr.push({lat: lat+base+(value-thresh)*valueScale, lng: lng-scale*0.7});
			arr.push({lat: lat+base+(value-thresh)*valueScale*1.5, lng: lng});
			arr.push({lat: lat+base+(value-thresh)*valueScale, lng: lng+scale*0.7});
			arr.push({lat: lat+base+(value-thresh)*valueScale, lng: lng+scale*0.5});
			arr.push({lat: lat, lng: lng+scale*0.5});
	    }
	    return arr;
	}

    DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.waterLevelOption.showAgri) return;

		var offset = g_APP.TimeToOffset(g_APP.curTime);
		offset -= 1;
		if(offset < 0) offset = 0;
		var preData = g_APP.GetDataFromTime(data,g_APP.OffsetToTime(offset));
		var waterLevelData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!waterLevelData) return;

		var preDataHash = {};
		if(preData){
			for(var i=0;i<preData.length;i++){
				var s = preData[i].stationID;
				preDataHash[s] = preData[i];
			}
		}

		var clickFn = function(data,i){ 
			return function() {
				this.UpdateInfoWindow(data[i]);
				this.infoWindow.open(this.map);
				this.infoTarget = data[i].stationID;
			}.bind(this);
		}.bind(this);

		for(var i=0;i<waterLevelData.length;i++){
			var sID = waterLevelData[i].stationID;
			var s = this.data.site[sID];
			if(!s) continue;

			var value = 0;
			if(preDataHash[sID]){
				if(preDataHash[sID].WaterLevel && waterLevelData[i].WaterLevel){
					value = waterLevelData[i].WaterLevel-preDataHash[sID].WaterLevel;
				}
			}
			waterLevelData[i].diff = value;

			//info window有打開，更新資訊
			if(this.infoWindow.getMap() && this.infoTarget == sID){
				this.UpdateInfoWindow(waterLevelData[i]);
			}

			var color = "#0073FF";
			if(this.layer[sID]){
				var icon = this.layer[sID];
				icon.setOptions({
					map: this.map,
					fillColor: color,
					strokeOpacity: g_APP.waterLevelOption.opacity,
					fillOpacity: g_APP.waterLevelOption.opacity,
					paths: this.DrawIcon(s.lat,s.lng,value)
				});
				google.maps.event.clearListeners(icon,"click");
				icon.addListener('click', clickFn(waterLevelData,i));
			}
			else{
				var icon = new google.maps.Polygon({
					strokeWeight: 1,
					strokeColor: '#000000',
					strokeOpacity: g_APP.waterLevelOption.opacity,
					fillColor: color,
					fillOpacity: g_APP.waterLevelOption.opacity,
					map: this.map,
					zIndex: 2,
					paths: this.DrawIcon(s.lat,s.lng,value)
				});
				icon.addListener('click', clickFn(waterLevelData,i));
				this.layer[sID] = icon;
			}
		}
	}

}
