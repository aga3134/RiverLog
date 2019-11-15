
class MapRain extends MapLayer{
	constructor(option){
		if(!option.siteKey) option.siteKey = "stationID";
		if(!option.dataSiteKey) option.dataSiteKey = "stationID";
		if(!option.divideLatLng) option.divideLatLng = true;
		super(option);
	}

	UpdateInfoWindow(d){
		var str = "";
		var loc = null;
		this.level = this.GetLevel();
		switch(this.level){
			case -1:
				var s = this.data.site[d.stationID];
				str = "<p>"+s.name+"</p>";
				str += "<p>累積雨量 "+d.now+" mm</p>";
				str += "<p>雨量變化 "+d.diff+" mm</p>";
				str += "<p>時間 "+d.time+" </p>";
				str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"rain\");'>今日變化</div></div>";
				loc = new google.maps.LatLng(s.lat, s.lon);
			break;
			default:
				var lat = d.latSum/d.num;
				var lng = d.lngSum/d.num;
				var now = d.nowSum/d.num;
				str = "<p>位置"+lng.toFixed(5)+" "+lat.toFixed(5)+"</p>";
				str += "<p>平均累積雨量 "+now+" mm</p>";
				str += "<p>平均雨量變化 "+d.diff+" mm</p>";
				str += "<p>時間 "+d.t+" </p>";
				loc = new google.maps.LatLng(lat,lng);
			break;
		}
		this.infoWindow.setOptions({content: str, position: loc});
	}

	DrawLayer(data){
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
				var s = preData[i].stationID;
				preDataHash[s] = preData[i];
			}
		}

		for(var i=0;i<rainData.length;i++){
			var sID = rainData[i].stationID;
			var s = this.data.site[sID];
			if(!s) continue;
			if(rainData[i].now <= 0) continue;

			rainData[i].diff = 0;
			if(preDataHash[sID]){
				if(preDataHash[sID].now && rainData[i].now){
					rainData[i].diff = rainData[i].now-preDataHash[sID].now;
				}
			}
			
			var clickFn = this.GenClickFn(rainData,i,"stationID");
			var baseScale = this.GetBaseScale();
			var value = 0, scaleH = 0, scaleW = 0.01*baseScale;
			switch(g_APP.rainOption.type){
				case "daily":
					value = rainData[i].now;
					scaleH = 0.0005*baseScale;
				break;
				case "diff":
					value = rainData[i].diff;
					scaleH = 0.005*baseScale;
				break;
			}

			//info window有打開，更新資訊
			if(this.infoWindow.getMap() && this.infoTarget == sID){
				this.UpdateInfoWindow(rainData[i]);
			}

			var rectW = scaleW*g_APP.rainOption.scale;
			var rectH = scaleH*g_APP.rainOption.scale;
			if(this.layer[sID]){
				var rect = this.layer[sID];
				rect.setOptions({
					map: this.map,
					fillColor: g_APP.color.rain(value),
					fillOpacity: g_APP.rainOption.opacity,
					bounds: {
						north: s.lat+value*rectH,
						south: s.lat,
						east: s.lon+rectW,
						west: s.lon-rectW
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
						north: s.lat+value*rectH,
						south: s.lat,
						east: s.lon+rectW,
						west: s.lon-rectW
					}
				});
				rect.addListener('click', clickFn);
				this.layer[sID] = rect;
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
