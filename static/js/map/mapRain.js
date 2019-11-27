
class MapRain extends MapLayer{
	constructor(option){
		if(option.siteKey == null) option.siteKey = "stationID";
		if(option.dataSiteKey == null) option.dataSiteKey = "stationID";
		if(option.divideLatLng == null) option.divideLatLng = true;
		super(option);
	}

	LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.rainOption.show) return;
		MapLayer.prototype.LoadLayer.call(this,param);
    }

	UpdateInfoWindow(d){
		var str = "";
		var loc = null;
		if(d.num){
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			var now = d.nowSum/d.num;
			var diff = d.diff || (d.diffSum/d.num);
			str = "<p>日雨量</p>";
			str += "<p>平均累積雨量 "+now.toFixed(2)+" mm</p>";
			str += "<p>平均雨量變化 "+diff.toFixed(2)+" mm</p>";
			str += "<p>測站數 "+d.num+"</p>";
			str += "<p>時間 "+d.t+" </p>";
			loc = new google.maps.LatLng(lat,lng);
		}
		else{
			var s = this.data.site[d.stationID];
			str = "<p>"+s.name+"</p>";
			str += "<p>累積雨量 "+d.now+" mm</p>";
			str += "<p>雨量變化 "+d.diff+" mm</p>";
			str += "<p>時間 "+d.time+" </p>";
			str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"rain\");'>今日變化</div></div>";
			loc = new google.maps.LatLng(s.lat, s.lon);
		}
		this.infoWindow.setOptions({content: str, position: loc});
	}

	GetDisplayData(data,siteKey,valueKey,timeKey,latKey,lngKey){
		var offset = g_APP.TimeToOffset(g_APP.curTime);
		offset -= 1;
		if(offset < 0) offset = 0;
		var preData = g_APP.GetDataFromTime(data,g_APP.OffsetToTime(offset));
		var rainData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!rainData) return {isCluster:false, data:[]};

		var preDataHash = {};
		if(preData){
			for(var i=0;i<preData.length;i++){
				var s = preData[i][siteKey];
				preDataHash[s] = preData[i];
			}
		}

		for(var i=0;i<rainData.length;i++){
			var sID = rainData[i][siteKey];
			var s = this.data.site[sID];
			if(!s) continue;
			var value = 0;
			if(preDataHash[sID]){
				if(preDataHash[sID][valueKey] && rainData[i][valueKey]){
					value = rainData[i][valueKey]-preDataHash[sID][valueKey];
				}
			}
			rainData[i].diff = value;
		}

		var zoom = this.map.getZoom();
		if(zoom > 10) return {isCluster:false, data:rainData};

		var step = 0.04*Math.min(4,Math.pow(2,10-zoom));
		var clusterHash = {};
		for(var i=0;i<rainData.length;i++){
			var sID = rainData[i][siteKey];
			var s = this.data.site[sID];
			if(!s) continue;

			var x = Math.round(s[latKey]/step);
			var y = Math.round(s[lngKey]/step);
			var key = x+"-"+y;
			if(key in clusterHash){
				var d = clusterHash[key];
				d[valueKey+"Sum"] += rainData[i][valueKey];
				d.diffSum += rainData[i].diff;
				d.num += 1;
				d.latSum += s[latKey];
				d.lngSum += s[lngKey];
			}
			else{
				var d = {};
				d.key = key;
				d.t = rainData[i][timeKey];
				d[valueKey+"Sum"] = rainData[i][valueKey];
				d.diffSum = rainData[i].diff;
				d.num = 1;
				d.latSum = s[latKey];
				d.lngSum = s[lngKey];
				clusterHash[key] = d;
			}
		}
		var cluster = [];
		for(var key in clusterHash){
			cluster.push(clusterHash[key]);
		}
		return {isCluster:true, data:cluster};
	}

	DrawRain(id,data,lat,lng,clickFn){
		var baseScale = Math.min(4,this.GetBaseScale());
		var value = 0, scaleH = 0, scaleW = 0.01*baseScale;
		switch(g_APP.rainOption.type){
			case "daily":
				if(data.num) value = data.nowSum/data.num;
				else value = data.now;
				scaleH = 0.0005*baseScale;
			break;
			case "diff":
				if(data.num) value = data.diffSum/data.num;
				else value = data.diff;
				scaleH = 0.005*baseScale;
			break;
		}

		var rectW = scaleW*g_APP.rainOption.scale;
		var rectH = scaleH*g_APP.rainOption.scale;
		if(this.layer[id]){
			var rect = this.layer[id];
			rect.setOptions({
				map: this.map,
				fillColor: g_APP.color.rain(value),
				fillOpacity: g_APP.rainOption.opacity,
				bounds: {
					north: lat+value*rectH,
					south: lat,
					east: lng+rectW,
					west: lng-rectW
				}
			});
			google.maps.event.clearListeners(rect,"click");
			rect.addListener('click', clickFn);
		}
		else{
			var rect = new google.maps.Rectangle({
				strokeWeight: 0,
				fillColor: g_APP.color.rain(value),
				fillOpacity: g_APP.rainOption.opacity,
				map: this.map,
				zIndex: 2,
				bounds: {
					north: lat+value*rectH,
					south: lat,
					east: lng+rectW,
					west: lng-rectW
				}
			});
			rect.addListener('click', clickFn);
			this.layer[id] = rect;
		}
	}

	DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.rainOption.show) return;

		var cluster = this.GetDisplayData(data,"stationID","now","time","lat","lon");
		
		if(cluster.isCluster){
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.key;

				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}
				var lat = d.latSum/d.num;
				var lng = d.lngSum/d.num;
				cluster.data[i].diff = d.diffSum/d.num;
				var clickFn = this.GenClickFn(cluster.data,i,"key");
				this.DrawRain(sID,cluster.data[i],lat,lng,clickFn);
			}
		}
		else{
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.stationID;
				var s = this.data.site[sID];
				if(!s) continue;
				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}
				var clickFn = this.GenClickFn(cluster.data,i,"stationID");
				this.DrawRain(sID,cluster.data[i],s.lat,s.lon,clickFn);
			}
		}
    }

    DrawGrid(data){
		if(!this.map) return;
		if(!data || !g_APP.rainOption.show) return;

		var offset = g_APP.TimeToOffset(g_APP.curTime);
		offset -= 1;
		if(offset < 0) offset = 0;
		var preData = g_APP.GetDataFromTime(data,g_APP.OffsetToTime(offset));
		var rainData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!rainData) return;


		var preDataHash = {};
		if(preData){
			for(var i=0;i<preData.length;i++){
				var key = preData[i].x+"-"+preData[i].y;
				preDataHash[key] = preData[i];
			}
		}

		for(var i=0;i<rainData.length;i++){
			if(rainData[i].nowSum <= 0) continue;

			var key = rainData[i].x+"-"+rainData[i].y;
			rainData[i].diff = 0;
			if(preDataHash[key]){
				if(preDataHash[key].nowSum && rainData[i].nowSum){
					var now = rainData[i].nowSum/rainData[i].num;
					var preNow = preDataHash[key].nowSum/preDataHash[key].num;
					rainData[i].diff = now-preNow;
				}
			}

			var baseScale = this.GetBaseScale();
			var value = 0, scaleH = 0, scaleW = 0.01*baseScale;
			switch(g_APP.rainOption.type){
				case "daily":
					value = rainData[i].nowSum/rainData[i].num;
					scaleH = 0.0005*baseScale;
				break;
				case "diff":
					value = rainData[i].diff;
					scaleH = 0.005*baseScale;
				break;
			}

			//info window有打開，更新資訊
			if(this.map && this.infoTarget == key){
				this.UpdateInfoWindow(rainData[i]);
			}

			var lat = rainData[i].latSum/rainData[i].num;
			var lng = rainData[i].lngSum/rainData[i].num;
			var rectW = scaleW*g_APP.rainOption.scale;
			var rectH = scaleH*g_APP.rainOption.scale;
			var clickFn = this.GenClickFn(rainData,i,rainData[i].x+"-"+rainData[i].y);
			if(this.layer[key]){
				var rect = this.layer[key];
				rect.setOptions({
					map: this.map,
					fillColor: g_APP.color.rain(value),
					fillOpacity: g_APP.rainOption.opacity,
					bounds: {
						north: lat+value*rectH,
						south: lat,
						east: lng+rectW,
						west: lng-rectW
					}
				});
				google.maps.event.clearListeners(rect,"click");
				rect.addListener('click', clickFn);
			}
			else{
				var rect = new google.maps.Rectangle({
					strokeWeight: 0,
					fillColor: g_APP.color.rain(value),
					fillOpacity: g_APP.rainOption.opacity,
					map: this.map,
					zIndex: 1,
					bounds: {
						north: lat+value*rectH,
						south: lat,
						east: lng+rectW,
						west: lng-rectW
					}
				});
				rect.addListener('click', clickFn);
				this.layer[key] = rect;
			}
		}
    }

}
