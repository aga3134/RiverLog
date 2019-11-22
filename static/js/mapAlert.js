
class MapAlert extends MapLayer{
	constructor(option){
		option.divideLatLng = false;
		super(option);
		this.geoDebris = {};
		this.geoCounty = {};
		this.geoTown = {};
		this.geoVillage = {};
	}

	LoadVillage(county){
		$.ajax({
			url:"/static/geo/village/geo-"+county+".json",
			async: false,
			success: function(result){
				var geoJsonObject = topojson.feature(result, result.objects["geo-"+county]);
				this.geoVillage[county] = {};
				for(var i=0;i<geoJsonObject.features.length;i++){
					var village = geoJsonObject.features[i];
					if(!village.geometry) continue;
					this.geoVillage[county][village.properties.VILLCODE] = village;
					village.id = village.properties.VILLCODE;
					//用所有點平均當window位置
					var lat = 0,lng = 0,num = 0;
					for(var j=0;j<village.geometry.coordinates.length;j++){
						var coord = village.geometry.coordinates[j];
						for(var k=0;k<coord.length;k++){
							lat += parseFloat(coord[k][1]);
							lng += parseFloat(coord[k][0]);
							num += 1;
						}
					}
					village.properties.loc = {lat: lat/num, lng: lng/num};
					village.properties.debrisFlow = [];
				}
			}.bind(this)
		});
	};

	GenAlertContent(feature){
		var content = "";

		var floodArr = feature.getProperty("Flood");
		for(var i=0;i<floodArr.length;i++){
			var flood = floodArr[i];
			alert = true;
			content += "<p class='info-title'>淹水警戒 "+flood.headline+"</p>";
			content += "<p>"+flood.description+"</p>";
			content += "<p>★ "+flood.instruction+"</p>";
			var start = flood.effective.format("YYYY-MM-DD HH:mm");
			var end = flood.expires.format("YYYY-MM-DD HH:mm");
			content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
		}

		var reservoirDisArr = feature.getProperty("ReservoirDis");
		for(var i=0;i<reservoirDisArr.length;i++){
			var reservoirDis = reservoirDisArr[i];
			alert = true;
			content += "<p class='info-title'>水庫放流 "+reservoirDis.headline+"</p>";
			content += "<p>"+reservoirDis.description+"</p>";
			content += "<p>★ "+reservoirDis.instruction+"</p>";
			var start = reservoirDis.effective.format("YYYY-MM-DD HH:mm");
			var end = reservoirDis.expires.format("YYYY-MM-DD HH:mm");
			content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
		}

		var rainfallArr = feature.getProperty("rainfall");
		for(var i=0;i<rainfallArr.length;i++){
			var rainFall = rainfallArr[i];
			alert = true;
			content += "<p class='info-title'>"+rainFall.headline+"</p>";
			content += "<p>"+rainFall.description+"</p>";
			var start = rainFall.effective.format("YYYY-MM-DD HH:mm");
			var end = rainFall.expires.format("YYYY-MM-DD HH:mm");
			content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
		}

		var highWaterArr = feature.getProperty("highWater");
		for(var i=0;i<highWaterArr.length;i++){
			var highWater = highWaterArr[i];
			alert = true;
			content += "<p class='info-title'>"+highWater.headline+"</p>";
			content += "<p>"+highWater.description+"</p>";
			content += "<p>★ "+highWater.instruction+"</p>";
			var start = highWater.effective.format("YYYY-MM-DD HH:mm");
			var end = highWater.expires.format("YYYY-MM-DD HH:mm");
			content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
		}

		var waterArr = feature.getProperty("water");
		for(var i=0;i<waterArr.length;i++){
			var water = waterArr[i];
			alert = true;
			content += "<p class='info-title'>"+water.headline+"</p>";
			content += "<p>"+water.description+"</p>";
			content += "<p>★ "+water.instruction+"</p>";
			var start = water.effective.format("YYYY-MM-DD HH:mm");
			var end = water.expires.format("YYYY-MM-DD HH:mm");
			content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
		}

		var debrisFlowArr = feature.getProperty("debrisFlow");
		for(var i=0;i<debrisFlowArr.length;i++){
			var debrisFlow = debrisFlowArr[i];
			alert = true;
			content += "<p class='info-title'>"+debrisFlow.headline+"</p>";
			content += "<p>"+debrisFlow.description+"</p>";
			content += "<p>★ "+debrisFlow.instruction+"</p>";
			var start = debrisFlow.effective.format("YYYY-MM-DD HH:mm");
			var end = debrisFlow.expires.format("YYYY-MM-DD HH:mm");
			content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
		}

		var typhoonArr = feature.getProperty("typhoon");
		for(var i=0;i<typhoonArr.length;i++){
			var typhoon = typhoonArr[i];
			alert = true;
			content += "<p class='info-title'>"+typhoon.headline+" - "+typhoon.description.cwb_typhoon_name+"颱風</p>";
			content += "<p>"+typhoon.description["注意事項"]+"</p>";
			var start = typhoon.effective.format("YYYY-MM-DD HH:mm");
			var end = typhoon.expires.format("YYYY-MM-DD HH:mm");
			content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
		}

		return content;
	};

	InitMapInfo(){
		this.map.data.setStyle(function(feature){
			var alert = false;
			var floodArr = feature.getProperty('Flood');
			if(floodArr && floodArr.length > 0) alert = true;
			var reservoirDisArr = feature.getProperty('ReservoirDis');
			if(reservoirDisArr && reservoirDisArr.length > 0) alert = true;
			var rainfallArr = feature.getProperty('rainfall');
			if(rainfallArr && rainfallArr.length > 0) alert = true;
			var highWaterArr = feature.getProperty('highWater');
			if(highWaterArr && highWaterArr.length > 0) alert = true;
			var waterArr = feature.getProperty('water');
			if(waterArr && waterArr.length > 0) alert = true;
			var debrisFlowArr = feature.getProperty('debrisFlow');
			if(debrisFlowArr && debrisFlowArr.length > 0) alert = true;
			var typhoonArr = feature.getProperty('typhoon');
			if(typhoonArr && typhoonArr.length > 0) alert = true;

			if(alert){
				if(feature.getProperty("Debrisno")){
					var color="#000";
					for(var i=0;i<debrisFlowArr.length;i++){
						var debris = debrisFlowArr[i];
						if(debris.severity_level == "黃色警戒" && color != "#f00"){
						  color = "#ff0";
						}
						else if(debris.severity_level == "紅色警戒"){
						  color = "#f00";
						}
					}
					return {
						strokeWeight: 5,
						strokeOpacity: g_APP.alertOption.opacity,
						strokeColor: color,
						fillColor: '#000',
						fillOpacity: 0
					}
				}
				else return {
					strokeWeight: 1,
					strokeOpacity: g_APP.alertOption.opacity,
					strokeColor: '#000',
					fillColor: '#f00',
					fillOpacity: g_APP.alertOption.opacity
				}
			}
			else{
				return {
				  strokeOpacity: 0,
				  fillOpacity: 0
				}
			}
		}.bind(this));

		this.map.data.addListener('click',function(event){
			var content = this.GenAlertContent(event.feature);
			var loc = event.feature.getProperty("loc");
			if(content != ""){
				this.infoWindow.setOptions({content: content,position: loc});
				this.infoWindow.open(this.map);
				this.infoTarget = event.feature.getId();
			}

		}.bind(this));

		$.getJSON("/static/geo/debris_sim.json", function(data){
			var geoJsonObject = topojson.feature(data, data.objects["Debris"]);
			for(var i=0;i<geoJsonObject.features.length;i++){
				var debris = geoJsonObject.features[i];
				this.geoDebris[debris.properties.Debrisno] = debris;
				debris.id = debris.properties.Debrisno;
				//用第一個點當window位置
				var coord = debris.geometry.coordinates[0][0];
				debris.properties.loc = {lat: coord[1], lng: coord[0]};
				debris.properties.debrisFlow = [];
			}
			//this.map.data.addGeoJson(geoJsonObject);
		}.bind(this));

		$.getJSON("/static/geo/county_sim.json", function(data){
			var geoJsonObject = topojson.feature(data, data.objects["geo"]);

			for(var i=0;i<geoJsonObject.features.length;i++){
				var county = geoJsonObject.features[i];
				this.geoCounty[county.properties.COUNTYCODE] = county;
				county.id = county.properties.COUNTYCODE;
				//用所有點平均當window位置
				var lat = 0,lng = 0,num = 0;
				for(var j=0;j<county.geometry.coordinates.length;j++){
					var coord = county.geometry.coordinates[j];
					for(var k=0;k<coord.length;k++){
						lat += parseFloat(coord[k][1]);
						lng += parseFloat(coord[k][0]);
						num += 1;
					}
				}
				county.properties.loc = {lat: lat/num, lng: lng/num};
				county.properties.Flood = [];
				county.properties.ReservoirDis = [];
				county.properties.rainfall = [];
				county.properties.highWater = [];
				county.properties.water = [];
				county.properties.debrisFlow = [];
				county.properties.typhoon = [];
			}
			//this.map.data.addGeoJson(geoJsonObject); 
		}.bind(this));

		$.getJSON("/static/geo/town_sim.json", function(data){
			var geoJsonObject = topojson.feature(data, data.objects["geo"]);

			for(var i=0;i<geoJsonObject.features.length;i++){
				var town = geoJsonObject.features[i];
				if(town.properties.TOWNCODE[0] == "6"){ //五都編號需特別處理...
					var order = [0,1,4,5,6,7,2,3];
					var str = "";
					for(var j=0;j<order.length;j++){
						str += town.properties.TOWNCODE[order[j]];
					}
					town.properties.TOWNCODE = str;
					//console.log(town.properties.TOWNCODE);
				}
				this.geoTown[town.properties.TOWNCODE] = town;
				town.id = town.properties.TOWNCODE;
				//用所有點平均當window位置
				var lat = 0,lng = 0,num = 0;
				for(var j=0;j<town.geometry.coordinates.length;j++){
					var coord = town.geometry.coordinates[j];
					for(var k=0;k<coord.length;k++){
						lat += parseFloat(coord[k][1]);
						lng += parseFloat(coord[k][0]);
						num += 1;
					}
				}
				town.properties.loc = {lat: lat/num, lng: lng/num};
				town.properties.Flood = [];
				town.properties.ReservoirDis = [];
				town.properties.rainfall = [];
				town.properties.highWater = [];
				town.properties.water = [];
				town.properties.debrisFlow = [];
				town.properties.typhoon = [];
			}
			//this.map.data.addGeoJson(geoJsonObject); 
		}.bind(this));

		/*$.getJSON("/static/geo/village/geo-10007.json", function(data){
		var geoJsonObject = topojson.feature(data, data.objects["geo-10007"]);
		this.map.data.addGeoJson(geoJsonObject); 
		}.bind(this));*/

  }

	UpdateInfoWindow(d){
		var str = "<p class='info-title'>"+d.cwb_typhoon_name+"颱風</p>";
		str += "<p>近中心最大風速: "+d.max_wind_speed+" m/s</p>";
		str += "<p>近中心最大陣風: "+d.max_gust_speed+" m/s</p>";
		str += "<p>中心氣壓: "+d.pressure+" 百帕</p>";
		str += "<p>七級風暴風半徑: "+d.circle_of_15ms+" km</p>";
		str += "<p>十級風暴風半徑: "+d.circle_of_25ms+" km</p>";
		str += "<p>時間 "+d.time+" </p>";
		var loc = new google.maps.LatLng(d.lat, d.lng);
		this.infoWindow.setOptions({content: str, position: loc});
	}

	DrawLayer(data){
		if(!this.map) return;
		if(!data) return;
		var t = dayjs(g_APP.curYear+"-"+g_APP.curDate+" "+g_APP.curTime);

		var AddAlert = function(type, alertData){
			for(var i=0;i<alertData.length;i++){
				var alert = alertData[i];
				if(g_APP.alertOption.certainty != "All" && alert.certainty != g_APP.alertOption.certainty) continue;
				if(g_APP.alertOption.severity != "All" && alert.severity != g_APP.alertOption.severity) continue;

				if(t >= alert.effective && t < alert.expires){
					for(var j=0;j<alert.geocode.length;j++){
						switch(type){
							case "Flood": //淹水
							case "ReservoirDis": //水庫放流
							case "rainfall": //降雨
							case "highWater": //河川高水位
							case "water": //停水
								var id = alert.geocode[j]+"0";
								var feature = this.map.data.getFeatureById(id);
								if(!feature){
									if(!(id in this.geoTown)){
										console.log(type+": "+id+" not found");
										continue;
									}
									this.map.data.addGeoJson(this.geoTown[id]);
									feature = this.map.data.getFeatureById(id);
								}
								if(type == "rainfall" && (!g_APP.alertOption.showRainFall)) continue;
								if(type == "Flood" && (!g_APP.alertOption.showFlow)) continue;
								if(type == "ReservoirDis" && (!g_APP.alertOption.showReservoirDis)) continue;
								if(type == "highWater" && (!g_APP.alertOption.showHighWater)) continue;
								if(type == "water" && (!g_APP.alertOption.showWater)) continue;

								var arr = feature.getProperty(type);
								arr.push(alert);
								feature.setProperty(type,arr);
								break;
						}
					}
					if(type == "debrisFlow"){
						if(!g_APP.alertOption.showDebrisFlow) continue;

						for(var j=0;j<alert.debrisID.length;j++){
							var id = alert.debrisID[j];
							var feature = this.map.data.getFeatureById(id);
							if(!feature){
								if(!(id in this.geoDebris)){
									console.log(type+": "+id+" not found");
									continue;
								}
								this.map.data.addGeoJson(this.geoDebris[id]);
								feature = this.map.data.getFeatureById(id);
							}
							var arr = feature.getProperty(type);
							arr.push(alert);
							feature.setProperty(type,arr);
						}
					}
					if(type == "thunderstorm"){
						if(!g_APP.alertOption.showThunderstorm) continue;

						var UpdateInfoStorm = function(d){
							var str = "<p>"+d.headline+"</p>";
							str += "<p>"+d.description+"</p>";
							this.infoWindow.setOptions({content: str, position: d.loc});
						}.bind(this);

						//info window有打開，更新資訊
						if(this.infoWindow.getMap() && this.infoTarget == alert._id){
							UpdateInfoStorm(alert);
						}

						var clickFn = function(data){ 
							return function() {
								UpdateInfoStorm(data);
								this.infoWindow.open(this.map);
								this.infoTarget = data._id;
							}.bind(this);
						}.bind(this);

						for(var j=0;j<alert.polygon.length;j++){
							var polygon = alert.polygon[j].split(" ");
							var coord = [];
							var center = {lat:0,lng:0};
							for(var k=0;k<polygon.length;k++){
								var pt = polygon[k].split(",");
								var lat = parseFloat(pt[0]);
								var lng = parseFloat(pt[1]);
								coord.push({lat: lat, lng: lng});
								center.lat += lat;
								center.lng += lng;
							}
							center.lat /= polygon.length;
							center.lng /= polygon.length;
							alert.loc = center;

							if(this.layer[alert._id]){
								this.layer[alert._id].setOptions({
									map: this.map,
									fillOpacity: g_APP.alertOption.opacity,
									paths: coord
								});
							}
							else{
								var poly = new google.maps.Polygon({
									strokeWeight: 0,
									strokeColor: '#000000',
									strokeOpacity: 0,
									fillColor: "#000000",
									fillOpacity: g_APP.alertOption.opacity,
									map: this.map,
									paths: coord
								});
								poly.addListener('click', clickFn(alert));
								this.layer[alert._id] = poly;
							}
						}
					}
					if(type == "typhoon"){
						if(!g_APP.alertOption.showTyphoon) continue;
						//county
						for(var j=0;j<alert.geocode.length;j++){
							var id = alert.geocode[j];
							if(id[0] == "6"){ //五都編號需特別處理...
								id += "000";
							}
							var feature = this.map.data.getFeatureById(id);
							if(!feature){
								if(!(id in this.geoCounty)){
									console.log(type+": "+id+" not found");
									continue;
								}
								this.map.data.addGeoJson(this.geoCounty[id]);
								feature = this.map.data.getFeatureById(id);
							}
							var arr = feature.getProperty(type);
							arr.push(alert);
							feature.setProperty(type,arr);
						}
					}
				}
			}
		}.bind(this);

		for(var key in data){
			AddAlert(key,data[key]);
		}
		if(this.infoWindow.getMap()){
			var feature = this.map.data.getFeatureById(this.infoTarget);
			var content = this.GenAlertContent(feature);
			var loc = feature.getProperty("loc");
			if(content != ""){
				this.infoWindow.setOptions({content: content,position: loc});
			}
			else{
				this.infoWindow.close();
			}
		}
	}

	LoadLayer(param){
		var url = this.dataUrl;
		url += "?date="+this.date;
		var data = this.data.data;

		$.get(url, function(result){
			if(result.status != "ok") return;
			if(result.data.length == 0) return;
			var pos = "0-0";

			for(var i=0;i<result.data.length;i++){
				var alertInfo = result.data[i];
				alertInfo.effective = dayjs(alertInfo.effective);
				alertInfo.expires = dayjs(alertInfo.expires);
				var e = alertInfo.eventcode;
				if(!data[pos]) data[pos] = {};
				if(!data[pos][e]) data[pos][e] = [];
				data[pos][e].push(alertInfo);
			}

			this.DrawLayer(data[pos]);
		}.bind(this));
	}

	ClearMap(){
		if(!this.map) return;
			this.map.data.forEach(function(feature){
			feature.setProperty("Flood",[]);
			feature.setProperty("ReservoirDis",[]);
			feature.setProperty("rainfall",[]);
			feature.setProperty("highWater",[]);
			feature.setProperty("water",[]);
			feature.setProperty("debrisFlow",[]);
			feature.setProperty("thunderstorm",[]);
			feature.setProperty("typhoon",[]);
		});
		for(var key in this.layer){
			this.layer[key].setMap(null);
		}
	}

}
