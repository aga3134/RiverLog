
class MapWaterLevel extends MapLayer{
    constructor(option){
		if(!option.siteKey) option.siteKey = "BasinIdentifier";
		if(!option.dataSiteKey) option.dataSiteKey = "StationIdentifier";
		if(!option.timeKey) option.timeKey = "RecordTime";
		if(!option.divideLatLng) option.divideLatLng = false;
		super(option);
    }

    UpdateInfoWindow(d){
    	var str = "";
		var loc = null;
		if(d.num){	//cluster
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			var value = d.valueSum/d.num;
			var diff = d.diffSum/d.num;
			str = "<p>河川水位</p>";
			str += "<p>平均水位 "+value.toFixed(2)+" m</p>";
			str += "<p>平均水位變化 "+diff.toFixed(2)+" m</p>";
			str += "<p>三級警戒數 "+d.alertL3+"</p>";
			str += "<p>二級警戒數 "+d.alertL2+"</p>";
			str += "<p>一級警戒數 "+d.alertL1+"</p>";
			str += "<p>測站數 "+d.num+"</p>";
			str += "<p>時間 "+d.t+" </p>";
			loc = new google.maps.LatLng(lat,lng);
		}
		else{
			var s = this.data.site[d.StationIdentifier];
		    str = "<p>"+s.ObservatoryName+"</p>";
		    str += "<p>溪流 "+s.RiverName+"</p>";
		    str += "<p>水位 "+d.WaterLevel.toFixed(2)+" m (";
		    if(d.diff >= 0) str += "+";
		    str += d.diff.toFixed(2)+" m)</p>";
		    str += "<p>警戒水位(三級/二級/一級):</p>";
		    str += "<p>"+(s.AlertLevel3||"無")+" / "+(s.AlertLevel2||"無")+" / "+(s.AlertLevel1||"無")+" m</p>";
		    str += "<p>時間 "+d.RecordTime+" </p>";
		    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"waterLevel\");'>今日變化</div></div>";
		    loc = new google.maps.LatLng(s.lat, s.lon);
		}
		this.infoWindow.setOptions({content: str, position: loc});
    }

    GetBaseScale(){
      var zoom = this.map.getZoom();
      return 1*Math.pow(2,9-zoom);
    }

    GenIcon(lat,lng,value){
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

	GetDisplayData(data,siteKey,valueKey,timeKey,latKey,lngKey){
		var offset = g_APP.TimeToOffset(g_APP.curTime);
		offset -= 1;
		if(offset < 0) offset = 0;
		var preData = g_APP.GetDataFromTime(data,g_APP.OffsetToTime(offset));
		var waterLevelData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!waterLevelData) return {isCluster:false, data:[]};

		var preDataHash = {};
		if(preData){
			for(var i=0;i<preData.length;i++){
				var s = preData[i][siteKey];
				preDataHash[s] = preData[i];
			}
		}

		for(var i=0;i<waterLevelData.length;i++){
			var sID = waterLevelData[i][siteKey];
			var s = this.data.site[sID];
			if(!s) continue;
			var value = 0;
			if(preDataHash[sID]){
				if(preDataHash[sID][valueKey] && waterLevelData[i][valueKey]){
					value = waterLevelData[i][valueKey]-preDataHash[sID][valueKey];
				}
			}
			waterLevelData[i].diff = value;
		}

		var zoom = this.map.getZoom();
		if(zoom >= 10) return {isCluster:false, data:waterLevelData};

		var step = 0.1*Math.pow(2,10-zoom);
		var clusterHash = {};
		for(var i=0;i<waterLevelData.length;i++){
			var sID = waterLevelData[i][siteKey];
			var s = this.data.site[sID];
			if(!s) continue;

			var x = Math.round(s[latKey]/step);
			var y = Math.round(s[lngKey]/step);
			var key = x+"-"+y;
			if(key in clusterHash){
				var d = clusterHash[key];
				d.valueSum += waterLevelData[i][valueKey];
				d.diffSum += waterLevelData[i].diff;
				d.num += 1;
				d.latSum += s[latKey];
				d.lngSum += s[lngKey];
				if(waterLevelData[i][valueKey] > s.AlertLevel1) d.alertL1++;
				else if(waterLevelData[i][valueKey] > s.AlertLevel2) d.alertL2++;
				else if(waterLevelData[i][valueKey] > s.AlertLevel3) d.alertL3++;
			}
			else{
				var d = {};
				d.key = key;
				d.t = waterLevelData[i][timeKey];
				d.valueSum = waterLevelData[i][valueKey];
				d.diffSum = waterLevelData[i].diff;
				d.num = 1;
				d.latSum = s[latKey];
				d.lngSum = s[lngKey];
				d.alertL3 = 0;
				d.alertL2 = 0;
				d.alertL1 = 0;
				if(waterLevelData[i][valueKey] > s.AlertLevel1) d.alertL1++;
				else if(waterLevelData[i][valueKey] > s.AlertLevel2) d.alertL2++;
				else if(waterLevelData[i][valueKey] > s.AlertLevel3) d.alertL3++;
				clusterHash[key] = d;
			}
		}
		var cluster = [];
		for(var key in clusterHash){
			cluster.push(clusterHash[key]);
		}
		return {isCluster:true, data:cluster};
	}

	DrawWaterLevel(id,value,color,lat,lng,clickFn){
		if(this.layer[id]){
			var icon = this.layer[id];
			icon.setOptions({
				map: this.map,
				fillColor: color,
				strokeOpacity: g_APP.waterLevelOption.opacity,
				fillOpacity: g_APP.waterLevelOption.opacity,
				paths: this.GenIcon(lat,lng,value)
			});
			google.maps.event.clearListeners(icon,"click");
			icon.addListener('click', clickFn);
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
				paths: this.GenIcon(lat,lng,value)
			});
			icon.addListener('click', clickFn);
			this.layer[id] = icon;
		}
	}

    DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.waterLevelOption.showRiver) return;

		var cluster = this.GetDisplayData(data,"StationIdentifier","WaterLevel","RecordTime","lat","lon");
		
		if(cluster.isCluster){
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.key;

				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}

				var color = "#37cc00";
				if(d.alertL3 > 0) color = "#ffcc00";
				if(d.alertL2 > 0) color = "#ff6600";
				if(d.alertL1 > 0) color = "#ff0000";
				var lat = d.latSum/d.num;
				var lng = d.lngSum/d.num;
				var diff = d.diffSum/d.num;

				var clickFn = this.GenClickFn(cluster.data,i,"key");
				this.DrawWaterLevel(sID,diff,color,lat,lng,clickFn);
			}
		}
		else{
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.StationIdentifier;
				var s = this.data.site[sID];
				if(!s) continue;
				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}

				var color = "#37cc00";
				if(d.WaterLevel > s.AlertLevel3) color = "#ffcc00";
				if(d.WaterLevel > s.AlertLevel2) color = "#ff6600";
				if(d.WaterLevel > s.AlertLevel1) color = "#ff0000";

				var clickFn = this.GenClickFn(cluster.data,i,"StationIdentifier");
				this.DrawWaterLevel(sID,d.diff,color,s.lat,s.lon,clickFn);
			}
		}
		
	}

}
