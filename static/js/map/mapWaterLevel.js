
class MapWaterLevel extends MapLayer{
    constructor(option){
		if(option.siteKey == null) option.siteKey = "BasinIdentifier";
		if(option.dataSiteKey == null) option.dataSiteKey = "StationIdentifier";
		if(option.timeKey == null) option.timeKey = "RecordTime";
		if(option.divideLatLng == null) option.divideLatLng = true;
		super(option);
    }

    LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.waterLevelOption.showRiver) return;
		param.expendData = true;
		MapLayer.prototype.LoadLayer.call(this,param);
	}

    UpdateInfoWindow(d){
    	var str = "";
		var loc = null;
		if(d.num){	//cluster
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			var value = d.WaterLevelSum/d.num;
			var diff = d.diff || (d.diffSum/d.num);
			str = "<p>平均河川水位</p>";
			str += "<p>測站數 "+d.num+"</p>";
			//str += "<p>最大水位變化 "+d.maxDiff.toFixed(2)+" m</p>";
			//str += "<p>最小水位變化 "+d.minDiff.toFixed(2)+" m</p>";
			str += "<p>平均水位 "+value.toFixed(2)+" m (";
			if(diff >= 0) str += "+";
		    str += diff.toFixed(2)+" m)</p>";
			str += "<p>三級警戒數 "+d.alertL3+"</p>";
			str += "<p>二級警戒數 "+d.alertL2+"</p>";
			str += "<p>一級警戒數 "+d.alertL1+"</p>";
			str += "<p>時間 "+d.t+" </p>";
			loc = new google.maps.LatLng(lat,lng);
		}
		else{
			var s = this.data.site[d.StationIdentifier];
		    str = "<p>"+s.ObservatoryName+" 河川水位</p>";
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
      return Math.min(4,Math.pow(1.7,9-zoom));
    }

    GenIcon(lat,lng,value1,value2){
    	if(!value2) value2 = 0;
    	var minValue = Math.min(value1,value2);
    	var maxValue = Math.max(value1,value2);

    	var baseScale = this.GetBaseScale();
	    var scale = 0.03*baseScale*g_APP.waterLevelOption.scale;
	    var valueScale = 0.03*baseScale*g_APP.waterLevelOption.scale;
	    var thresh = g_APP.waterLevelOption.thresh*0.01;
	    var arr = [];
	    if(Math.abs(minValue) < thresh && Math.abs(maxValue) < thresh){
			arr.push({lat: lat-scale*0.5, lng: lng});
			arr.push({lat: lat, lng: lng-scale*0.5});
			arr.push({lat: lat+scale*0.5, lng: lng});
			arr.push({lat: lat, lng: lng+scale*0.5});
	    }
	    else{
	    	var maxMutiple = 100;
			if(maxValue > thresh){
				if(maxValue > thresh*maxMutiple) maxValue = thresh*maxMutiple;
				var base = scale*0.5;
				arr.push({lat: lat, lng: lng-scale*0.3});
				arr.push({lat: lat+base+(maxValue-thresh)*valueScale, lng: lng-scale*0.3});
				arr.push({lat: lat+base+(maxValue-thresh)*valueScale, lng: lng-scale*0.5});
				arr.push({lat: lat+base+(maxValue-thresh)*valueScale+base, lng: lng});
				arr.push({lat: lat+base+(maxValue-thresh)*valueScale, lng: lng+scale*0.5});
				arr.push({lat: lat+base+(maxValue-thresh)*valueScale, lng: lng+scale*0.3});
				arr.push({lat: lat, lng: lng+scale*0.3});
			}
			if(minValue < -thresh){
				if(minValue < -thresh*maxMutiple) minValue = -thresh*maxMutiple; 
				var base = -scale*0.5;
				arr.push({lat: lat, lng: lng-scale*0.3});
				arr.push({lat: lat+base+(minValue-thresh)*valueScale, lng: lng-scale*0.3});
				arr.push({lat: lat+base+(minValue-thresh)*valueScale, lng: lng-scale*0.5});
				arr.push({lat: lat+base+(minValue-thresh)*valueScale+base, lng: lng});
				arr.push({lat: lat+base+(minValue-thresh)*valueScale, lng: lng+scale*0.5});
				arr.push({lat: lat+base+(minValue-thresh)*valueScale, lng: lng+scale*0.3});
				arr.push({lat: lat, lng: lng+scale*0.3});
			}
			
	    }
	    return arr;
	}

	ComputeDiff(preValue,curValue){
		if(preValue < -99 || curValue < -99) return 0;
		return curValue - preValue;
	}

	AccumulateValue(acc,data,param){
		var key = param.clusterKey;
		var s = param.site;
		var timeKey = param.timeKey;
		var valueKey = param.valueKey;
		var latKey = param.latKey;
		var lngKey = param.lngKey;
		var value = data[valueKey];
		if(value < 0) return acc;
		else if(!acc){
			acc = {};
			acc.key = key;
			acc.t = data[timeKey];
			acc[valueKey+"Sum"] = value;
			acc.diffSum = data.diff;
			acc.minDiff = data.diff;
			acc.maxDiff = data.diff;
			acc.num = 1;
			acc.latSum = s[latKey];
			acc.lngSum = s[lngKey];
			acc.alertL3 = 0;
			acc.alertL2 = 0;
			acc.alertL1 = 0;
			if(s.AlertLevel1 && value > s.AlertLevel1) acc.alertL1++;
			else if(s.AlertLevel2 && value > s.AlertLevel2) acc.alertL2++;
			else if(s.AlertLevel3 && value > s.AlertLevel3) acc.alertL3++;
		}
		else{
			acc[valueKey+"Sum"] += value;
			acc.diffSum += data.diff;
			if(data.diff < acc.minDiff) acc.minDiff = data.diff;
			if(data.diff > acc.maxDiff) acc.maxDiff = data.diff;
			acc.num += 1;
			acc.latSum += s[latKey];
			acc.lngSum += s[lngKey];
			if(s.AlertLevel1 && value > s.AlertLevel1) acc.alertL1++;
			else if(s.AlertLevel2 && value > s.AlertLevel2) acc.alertL2++;
			else if(s.AlertLevel3 && value > s.AlertLevel3) acc.alertL3++;
		}
		return acc;
	}

	GetDisplayData(data,siteKey,valueKey,timeKey,latKey,lngKey,doCluster){
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

		var bound = this.map.getBounds();
		for(var i=0;i<waterLevelData.length;i++){
			var sID = waterLevelData[i][siteKey];
			var s = this.data.site[sID];
			if(!s) continue;
			if(!bound.contains({lat:s[latKey],lng:s[lngKey]})) continue;
			var value = 0;
			if(preDataHash[sID]){
				if(preDataHash[sID][valueKey] && waterLevelData[i][valueKey]){
					value = this.ComputeDiff(preDataHash[sID][valueKey],waterLevelData[i][valueKey]);
				}
			}
			waterLevelData[i].diff = value;
		}

		var zoom = this.map.getZoom();
		if(zoom > 10 || !doCluster) return {isCluster:false, data:waterLevelData};

		var step = 0.04*Math.min(4,Math.pow(2,10-zoom));
		var clusterHash = {};
		for(var i=0;i<waterLevelData.length;i++){
			var sID = waterLevelData[i][siteKey];
			var s = this.data.site[sID];
			if(!s) continue;
			if(!bound.contains({lat:s[latKey],lng:s[lngKey]})) continue;
			var x = Math.round(s[latKey]/step);
			var y = Math.round(s[lngKey]/step);
			var key = x+"-"+y;
			var accParam = {clusterKey:key,"site":s, "timeKey":timeKey,"valueKey":valueKey,"latKey":latKey,"lngKey":lngKey};
			var acc = this.AccumulateValue(clusterHash[key],waterLevelData[i],accParam);
			if(acc) clusterHash[key] = acc;
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
				paths: this.GenIcon(lat,lng,value[0],value[1])
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
				paths: this.GenIcon(lat,lng,value[0],value[1])
			});
			icon.addListener('click', clickFn);
			this.layer[id] = icon;
		}
	}

    DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.waterLevelOption.showRiver) return;

		var cluster = this.GetDisplayData(data,"StationIdentifier","WaterLevel","RecordTime","lat","lon",true);
		
		var bound = this.map.getBounds();
		if(cluster.isCluster){
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.key;
				var lat = d.latSum/d.num;
				var lng = d.lngSum/d.num;
				if(!bound.contains({lat:lat,lng:lng})) continue;

				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}

				var color = "#37cc00";
				if(d.alertL3 > 0) color = "#ffcc00";
				if(d.alertL2 > 0) color = "#ff6600";
				if(d.alertL1 > 0) color = "#ff0000";
				
				var diff = d.diffSum/d.num;

				var clickFn = this.GenClickFn(cluster.data,i,"key");
				this.DrawWaterLevel(sID,[diff],color,lat,lng,clickFn);
			}
		}
		else{
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.StationIdentifier;
				var s = this.data.site[sID];
				if(!s) continue;
				if(!bound.contains({lat:s.lat,lng:s.lon})) continue;
				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}

				var color = "#37cc00";
				if(s.AlertLevel3 && d.WaterLevel > s.AlertLevel3) color = "#ffcc00";
				if(s.AlertLevel2 && d.WaterLevel > s.AlertLevel2) color = "#ff6600";
				if(s.AlertLevel1 && d.WaterLevel > s.AlertLevel1) color = "#ff0000";
				
				var clickFn = this.GenClickFn(cluster.data,i,"StationIdentifier");
				this.DrawWaterLevel(sID,[d.diff],color,s.lat,s.lon,clickFn);
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

		var bound = this.map.getBounds();
		for(var i=0;i<waterLevelData.length;i++){
			var d = waterLevelData[i];
			if(d.WaterLevelSum <= 0) continue;
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			if(!bound.contains({lat:lat,lng:lng})) continue;

			var key = d.x+"-"+d.y;
			d.key = key;
			d.diff = 0;
			if(preDataHash[key]){
				if(preDataHash[key].WaterLevelSum && d.WaterLevelSum){
					var now = d.WaterLevelSum/d.num;
					var preNow = preDataHash[key].WaterLevelSum/preDataHash[key].num;
					d.diff = now-preNow;
				}
			}

			//info window有打開，更新資訊
			if(this.map && this.infoTarget == key){
				this.UpdateInfoWindow(d);
			}

			var clickFn = this.GenClickFn(waterLevelData,i,"key");
			var color = "#37cc00";
			if(d.alertL3 > 0) color = "#ffcc00";
			if(d.alertL2 > 0) color = "#ff6600";
			if(d.alertL1 > 0) color = "#ff0000";
			this.DrawWaterLevel(key,[d.diff],color,lat,lng,clickFn);

		}
    }
}
