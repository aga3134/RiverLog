
class MapWaterLevel extends MapLayer{
    constructor(option){
		option.siteKey = "BasinIdentifier";
		option.dataSiteKey = "StationIdentifier";
		option.timeKey = "RecordTime";
		option.divideLatLng = false;
		super(option);
    }

    UpdateInfoWindow(d){
    	var str = "";
		var loc = null;
		this.level = this.GetLevel();
		switch(this.level){
			case -1:
				var s = this.data.site[d.StationIdentifier];
			    var str = "<p>"+s.ObservatoryName+"</p>";
			    str += "<p>溪流 "+s.RiverName+"</p>";
			    str += "<p>水位 "+d.WaterLevel.toFixed(2)+" m (";
			    if(d.diff >= 0) str += "+";
			    str += d.diff.toFixed(2)+" m)</p>";
			    str += "<p>警戒水位(三級/二級/一級):</p>";
			    str += "<p>"+(s.AlertLevel3||"無")+" / "+(s.AlertLevel2||"無")+" / "+(s.AlertLevel1||"無")+" m</p>";
			    str += "<p>時間 "+d.RecordTime+" </p>";
			    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"waterLevel\");'>今日變化</div></div>";
			    var loc = new google.maps.LatLng(s.lat, s.lon);
		    break;
			default:
				var lat = d.latSum/d.num;
				var lng = d.lngSum/d.num;
				var value = d.WaterLevelSum/d.num;
				var str = "<p>位置"+lng.toFixed(5)+" "+lat.toFixed(5)+"</p>";
				str += "<p>平均水位 "+value+" m</p>";
				str += "<p>平均水位變化 "+d.diff+" m</p>";
				str += "<p>時間 "+d.t+" </p>";
				loc = new google.maps.LatLng(lat,lng);
			break;
		}
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
		if(!data || !g_APP.waterLevelOption.showRiver) return;

		var offset = g_APP.TimeToOffset(g_APP.curTime);
		offset -= 1;
		if(offset < 0) offset = 0;
		var preData = g_APP.GetDataFromTime(data,g_APP.OffsetToTime(offset));
		var waterLevelData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!waterLevelData) return;

		var preDataHash = {};
		if(preData){
			for(var i=0;i<preData.length;i++){
				var s = preData[i].StationIdentifier;
				preDataHash[s] = preData[i];
			}
		}

		var clickFn = function(data,i){ 
			return function() {
				this.UpdateInfoWindow(data[i]);
				this.infoWindow.open(this.map);
				this.infoTarget = data[i].StationIdentifier;
			}.bind(this);
		}.bind(this);

		for(var i=0;i<waterLevelData.length;i++){
			var sID = waterLevelData[i].StationIdentifier;
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

			var color = "#37cc00";
			if(waterLevelData[i].WaterLevel > s.AlertLevel3) color = "#ffcc00";
			if(waterLevelData[i].WaterLevel > s.AlertLevel2) color = "#ff6600";
			if(waterLevelData[i].WaterLevel > s.AlertLevel1) color = "#ff0000";

			if(this.layer[sID]){
				var icon = this.layer[sID];
				icon.setOptions({
					map: this.map,
					fillColor: color,
					strokeOpacity: g_APP.waterLevelOption.opacity,
					fillOpacity: g_APP.waterLevelOption.opacity,
					paths: this.DrawIcon(s.lat,s.lon,value)
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
					paths: this.DrawIcon(s.lat,s.lon,value)
				});
				icon.addListener('click', clickFn(waterLevelData,i));
				this.layer[sID] = icon;
			}
		}
	}

	DrawGrid(data){
		if(!this.map) return;
		if(!data) return;

		var offset = g_APP.TimeToOffset(g_APP.curTime);
		offset -= 1;
		if(offset < 0) offset = 0;
		var preData = g_APP.GetDataFromTime(data,g_APP.OffsetToTime(offset));
		var waterLevelData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!waterLevelData) return;


		var preDataHash = {};
		if(preData){
			for(var i=0;i<preData.length;i++){
				var key = preData[i].x+"-"+preData[i].y;
				preDataHash[key] = preData[i];
			}
		}

		var clickFn = function(data,i){ 
			return function() {
				this.UpdateInfoWindow(data[i]);
				this.infoWindow.open(this.map);
				var key = data[i].x+"-"+data[i].y;
				this.infoTarget = key;
			}.bind(this);
		}.bind(this);

		for(var i=0;i<waterLevelData.length;i++){
			if(waterLevelData[i].WaterLevelSum <= 0) continue;
			var key = waterLevelData[i].x+"-"+waterLevelData[i].y;
			
			var value = 0;
			if(preDataHash[key]){
				if(preDataHash[key].WaterLevelSum && waterLevelData[i].WaterLevelSum){
					var now = waterLevelData[i].WaterLevelSum/waterLevelData[i].num;
					var preNow = preDataHash[key].WaterLevelSum/preDataHash[key].num;
					value = now-preNow;
				}
			}
			waterLevelData[i].diff = value;

			//info window有打開，更新資訊
			if(this.map && this.infoTarget == key){
				this.UpdateInfoWindow(waterLevelData[i]);
			}

			var color = "#37cc00";
			var lat = waterLevelData[i].latSum/waterLevelData[i].num;
			var lng = waterLevelData[i].lngSum/waterLevelData[i].num;
			if(this.layer[key]){
				var icon = this.layer[key];
				icon.setOptions({
					map: this.map,
					fillColor: color,
					strokeOpacity: g_APP.waterLevelOption.opacity,
					fillOpacity: g_APP.waterLevelOption.opacity,
					paths: this.DrawIcon(lat,lng,value)
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
					paths: this.DrawIcon(lat,lng,value)
				});
				icon.addListener('click', clickFn(waterLevelData,i));
				this.layer[key] = icon;
			}
		}
    }

}
