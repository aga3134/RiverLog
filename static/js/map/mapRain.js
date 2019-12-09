
class MapRain extends MapLayer{
	constructor(option){
		if(option.siteKey == null) option.siteKey = "stationID";
		if(option.dataSiteKey == null) option.dataSiteKey = "stationID";
		if(option.divideLatLng == null) option.divideLatLng = true;
		super(option);

		this.dataHash = {curData:{},preData:{},curGrid:[],preGrid:[]};
		for(var i=0;i<this.levelNum;i++){
			this.dataHash.curGrid.push({});
			this.dataHash.preGrid.push({});
		}
	}

	LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.rainOption.show) return;
		if(!this.dataUrl || !this.date) return;

		var pos = "";
	    if(this.divideLatLng) pos = param.minLat+"-"+param.minLng;
	    else pos = "0-0";

	    var url = this.dataUrl;
	    url += "?date="+this.date;
	    if(this.divideLatLng){
	      url += "&minLat="+param.minLat+"&minLng="+param.minLng+"&maxLat="+param.maxLat+"&maxLng="+param.maxLng;
	    }

	    var preDayUrl = this.dataUrl;
	  	var preDay = dayjs(this.date,"YYYY-MM-DD").add(-1,"day").format("YYYY-MM-DD");
	  	preDayUrl += "?date="+preDay;
	  	if(this.divideLatLng){
	  		preDayUrl += "&minLat="+param.minLat+"&minLng="+param.minLng+"&maxLat="+param.maxLat+"&maxLng="+param.maxLng;
	  	}

	  	var data = this.data.data;
	  	var daily = this.data.daily;
	  	var preHash = this.dataHash.preData;
	  	var curHash = this.dataHash.curData;

		$.get(url, function(result){
			if(result.status != "ok") return;   
			if(!data[pos]) data[pos] = {};
			for(var i=0;i<result.data.length;i++){
				var d = result.data[i];
				var t = this.SetupTime(d[this.timeKey]);
				d[this.timeKey] = t;

				if(!data[pos][t]) data[pos][t] = [];
				data[pos][t].push(d);
				var s = d[this.dataSiteKey];

				if(!curHash[t]) curHash[t] = {};
				curHash[t][s] = d;

				if(!daily[s]) daily[s] = [];
				daily[s].push(d);
			}

			$.get(preDayUrl, function(result){
				if(result.status != "ok") return;      
				for(var i=0;i<result.data.length;i++){
					var d = result.data[i];
					var t = this.SetupTime(d[this.timeKey]);
					d[this.timeKey] = t;

					if(!preHash[t]) preHash[t] = {};
					var s = d[this.dataSiteKey];
					preHash[t][s] = d;
				}
				this.DrawLayer(data[pos]);
			}.bind(this));

		}.bind(this));
	}

	LoadGrid(param){
		if(!this.gridUrl || !this.date) return;

		var url = this.gridUrl;
		url += "?date="+this.date;
		url += "&level="+param.level;
		if(this.divideLatLng){
			url += "&minLat="+param.minLat+"&minLng="+param.minLng+"&maxLat="+param.maxLat+"&maxLng="+param.maxLng;
		}

		var preDayUrl = this.gridUrl;
		var preDay = dayjs(this.date,"YYYY-MM-DD").add(-1,"day").format("YYYY-MM-DD");
		preDayUrl += "?date="+preDay;
		preDayUrl += "&level="+param.level;
		if(this.divideLatLng){
			preDayUrl += "&minLat="+param.minLat+"&minLng="+param.minLng+"&maxLat="+param.maxLat+"&maxLng="+param.maxLng;
		}

		var pos = "";
		if(this.divideLatLng) pos = param.minLat+"-"+param.minLng;
		else pos = "0-0";

		var level = parseInt(param.level);
		var grid = this.grid[level];
		var preGrid = this.dataHash.preGrid[level];
		var curGrid = this.dataHash.curGrid[level];

		$.get(url, function(result){
			if(result.status != "ok") return;
			var data = result.data.data;
			if(!grid[pos]) grid[pos] = {};
			for(var i=0;i<data.length;i++){
				var d = data[i];
				var t = this.SetupTime(d[this.gridTimeKey]);
				d[this.gridTimeKey] = t;
				var key = d.x+"-"+d.y;

				if(!grid[pos][t]) grid[pos][t] = [];
				grid[pos][t].push(d);

				if(!curGrid[t]) curGrid[t] = {};
				curGrid[t][key] = d;
			}

			$.get(preDayUrl, function(result){
				if(result.status != "ok") return;      
				var data = result.data.data;
				for(var i=0;i<data.length;i++){
					var d = data[i];
					var t = this.SetupTime(d[this.gridTimeKey]);
					d[this.gridTimeKey] = t;
					var key = d.x+"-"+d.y;
					
					if(!preGrid[t]) preGrid[t] = {};
					preGrid[t][key] = d;
				}
				this.DrawGrid(grid[pos]);
			}.bind(this));

		}.bind(this));
	}

	UpdateInfoWindow(d){
		var str = "";
		var loc = null;
		var accHour = g_APP.rainOption.accHour;

		if(d.num){
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			str = "<p>平均雨量</p>";
			str += "<p>測站數 "+d.num+"</p>";
			switch(g_APP.rainOption.type){
				case "daily":
					var now = d.now || (d.nowSum/d.num);
					str += "<p>平均日累積雨量 "+now.toFixed(2)+" mm</p>";
					break;
				case "diff":
					var diff = d.diff || (d.diffSum/d.num);
					str += "<p>平均雨量變化 "+diff.toFixed(2)+" mm</p>";
					break;
				case "custom":
					str += "<p>平均"+accHour+"小時累積雨量 "+d.acc.toFixed(2)+" mm</p>";
					break;
			}
			str += "<p>時間 "+d.t+" </p>";
			loc = new google.maps.LatLng(lat,lng);
		}
		else{
			var s = this.data.site[d.stationID];
			str = "<p>"+s.name+"</p>";
			switch(g_APP.rainOption.type){
				case "daily":
					str += "<p>日累積雨量 "+d.now.toFixed(2)+" mm</p>";
					break;
				case "diff":
					str += "<p>雨量變化 "+d.diff.toFixed(2)+" mm</p>";
					break;
				case "custom":
					str += "<p>"+accHour+"小時累積雨量 "+d.acc.toFixed(2)+" mm</p>";
					break;
			}
			str += "<p>時間 "+d.time+" </p>";
			str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"rain\");'>今日變化</div></div>";
			loc = new google.maps.LatLng(s.lat, s.lon);
		}
		this.infoWindow.setOptions({content: str, position: loc});
	}

	DrawRain(id,data,lat,lng,clickFn){
		//info window有打開，更新資訊
		if(this.infoWindow.getMap() && this.infoTarget == id){
			this.UpdateInfoWindow(data);
		}

		var baseScale = Math.min(4,this.GetBaseScale());
		var value = 0, scaleH = 0, scaleW = 0.01*baseScale;
		var warn = false, warnColor = "#ff0000";
		switch(g_APP.rainOption.type){
			case "daily":
				value = data.now;
				scaleH = 0.0005*baseScale;
			break;
			case "diff":
				value = data.diff;
				scaleH = 0.005*baseScale;
			break;
			case "custom":
				value = data.acc;
				scaleH = 0.0005*baseScale;
				var accHour = g_APP.rainOption.accHour;
				if(accHour == 1){
					if(value >= 40) warn = true;
				}
				else if(accHour == 2){
					if(value >= 80) warn = true;
				}
				else if(accHour == 3){
					if(value >= 120) warn = true;
				}
				else if(accHour == 24){
					if(value >= 200){
						warn = true;
						warnColor = "#ffff00";
					}
					if(value >= 350){
						warn = true;
						warnColor = "#ff9900";
					}
					if(value >= 500){
						warn = true;
						warnColor = "#ff0000";
					}
				}
			break;
		}
		if(!value) return;

		var rectW = scaleW*g_APP.rainOption.scale;
		var rectH = scaleH*g_APP.rainOption.scale;
		if(this.layer[id]){
			var rect = this.layer[id];
			rect.setOptions({
				map: this.map,
				strokeWeight: warn?2:0,
				strokeColor: warnColor,
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
				strokeWeight: warn?2:0,
				strokeColor: warnColor,
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

		var preDayHash = this.dataHash.preData;
  		var curDayHash = this.dataHash.curData;
  		var endT = "23:50:00";
  		var accHour = g_APP.rainOption.accHour;

		var bound = this.map.getBounds();
		for(var i=0;i<rainData.length;i++){
			var d = rainData[i];
			var sID = d.stationID;
			var s = this.data.site[sID];
			if(!s) continue;
			if(!bound.contains({lat:s.lat,lng:s.lon})) continue;

			var value = 0;
			if(preDataHash[sID]){
				if(preDataHash[sID].now && rainData[i].now){
					value = rainData[i].now-preDataHash[sID].now;
				}
			}
			rainData[i].diff = value;

			if(g_APP.rainOption.type == "custom"){
				var t = d[this.timeKey].split(":");
	  			var curHour = parseInt(t[0]);
	  			if(accHour > curHour){	//要加到前一天的值
	  				var accT = g_Util.PadLeft(24-accHour+curHour,2)+":"+t[1]+":"+t[2];
	  				if(!preDayHash[endT] || !preDayHash[endT][sID]) continue;
	  				if(!preDayHash[accT] || !preDayHash[accT][sID]) continue;
		  			var accBegin = preDayHash[endT][sID].now-preDayHash[accT][sID].now;
		  			d.acc = d.now + accBegin;
	  			}
	  			else{
	  				var accT = g_Util.PadLeft(curHour-accHour,2)+":"+t[1]+":"+t[2];
	  				if(!curDayHash[accT] || !curDayHash[accT][sID]) continue;
	  				var accBegin = curDayHash[accT][sID].now;
	  				d.acc = d.now - accBegin;
	  			}
			}

			var clickFn = this.GenClickFn(rainData,i,"stationID");
			this.DrawRain(sID,rainData[i],s.lat,s.lon,clickFn);
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

		var preDayHash = this.dataHash.preGrid[this.level];
  		var curDayHash = this.dataHash.curGrid[this.level];
  		var endT = "23:50:00";
  		var accHour = g_APP.rainOption.accHour;

		var bound = this.map.getBounds();
		for(var i=0;i<rainData.length;i++){
			var d = rainData[i];
			if(d.nowSum <= 0) continue;
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			if(!bound.contains({lat:lat,lng:lng})) continue;

			var key = d.x+"-"+d.y;
			d.now = d.nowSum/d.num;
			d.diff = 0;
			if(preDataHash[key]){
				if(preDataHash[key].nowSum && d.nowSum){
					var now = d.nowSum/d.num;
					var preNow = preDataHash[key].nowSum/preDataHash[key].num;
					d.diff = now-preNow;
				}
			}

			if(g_APP.rainOption.type == "custom"){
				var t = d.t.split(":");
	  			var curHour = parseInt(t[0]);
	  			if(accHour > curHour){	//要加到前一天的值
	  				var accT = g_Util.PadLeft(24-accHour+curHour,2)+":"+t[1]+":"+t[2];
	  				if(!preDayHash[endT] || !preDayHash[endT][key]) continue;
	  				if(!preDayHash[accT] || !preDayHash[accT][key]) continue;
		  			var accBegin = preDayHash[endT][key].nowSum/preDayHash[endT][key].num-
		  				preDayHash[accT][key].nowSum/preDayHash[accT][key].num;
		  			d.acc = d.nowSum/d.num + accBegin;
	  			}
	  			else{
	  				var accT = g_Util.PadLeft(curHour-accHour,2)+":"+t[1]+":"+t[2];
	  				if(!curDayHash[accT] || !curDayHash[accT][key]) continue;
	  				var accBegin = curDayHash[accT][key].nowSum/curDayHash[accT][key].num;
	  				d.acc = d.nowSum/d.num - accBegin;
	  			}
			}
			
			var clickFn = this.GenClickFn(rainData,i,rainData[i].x+"-"+rainData[i].y);
			this.DrawRain(key,rainData[i],lat,lng,clickFn);
		}
  }

}
