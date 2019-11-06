
function MapControl(){
	this.map = null;
	this.infoRain = null;
	this.infoReservoir = null;
	this.infoWaterLevel = null;
	this.infoAlert = null;
	this.infoStorm = null;
	this.infoTyphoon = null;
	this.infoTyphoonTrajectory = null;
  this.infoFlood = null;
	this.layerRain = {};
  this.layerReservoir = {};
  this.layerWaterLevel = {};
  this.layerFlood = {};
  this.layerThunderstorm = {};
  this.layerTyphoonTrajectory = {};
  this.infoRainID = "";
  this.infoReservoirID = "";
  this.infoWaterLevelID = "";
  this.infoAlertID = "";
  this.infoStormID = "";
  this.infoFloodID = "";
  this.infoTyphoonTrajectoryID = "";
  this.geoDebris = {};
  this.geoCounty = {};
  this.geoTown = {};
  this.geoVillage = {};
  this.openDailyChart = false;
  this.dailyChartTitle = "";
  this.lineChartType = "";
};

MapControl.prototype.InitMap = function(param){
	var loc = {lat: 23.682094, lng: 120.7764642, zoom: 7};
  if(param.initLoc){
    if(param.initLoc.lat) loc.lat = param.initLoc.lat;
    if(param.initLoc.lng) loc.lng = param.initLoc.lng;
    if(param.initLoc.zoom) loc.zoom = param.initLoc.zoom;
  }
  var taiwan = new google.maps.LatLng(loc.lat,loc.lng);

  $.get("/static/mapStyle.json",function(style){
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: taiwan,
      zoom: loc.zoom,
      scaleControl: true,
      mapTypeId: param.useSatellite?"hybrid":"terrain",
      styles: style,
      mapTypeControl: false
    });

    google.maps.event.addListener(this.map, 'click', function(event) {
      
    });

    this.map.addListener('dragend', function() {

    });

    this.map.addListener('zoom_changed', function() {
      g_APP.UpdateMap();
    }.bind(this));

    this.map.addListener('bounds_changed',function(){
      g_APP.UpdateUrl();
    });

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
        this.infoAlert.setOptions({content: content,position: loc});
        this.infoAlert.open(this.map);
        this.infoAlertID = event.feature.getId();
      }
      
    }.bind(this));

    $.getJSON("/static/geo/debris_sim.json", function(data){
      geoJsonObject = topojson.feature(data, data.objects["Debris"]);
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
      geoJsonObject = topojson.feature(data, data.objects["geo"]);

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
      geoJsonObject = topojson.feature(data, data.objects["geo"]);

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
      geoJsonObject = topojson.feature(data, data.objects["geo-10007"]);
      this.map.data.addGeoJson(geoJsonObject); 
    }.bind(this));*/

  }.bind(this));
  
  this.infoRain = new google.maps.InfoWindow();
  this.infoReservoir = new google.maps.InfoWindow();
  this.infoWaterLevel = new google.maps.InfoWindow();
  this.infoAlert = new google.maps.InfoWindow();
  this.infoStorm = new google.maps.InfoWindow();
  this.infoTyphoon = new google.maps.InfoWindow();
  this.infoFlood = new google.maps.InfoWindow();
  this.infoTyphoonTrajectory = new google.maps.InfoWindow();
};

MapControl.prototype.LoadVillage = function(county){
  $.ajax({
    url:"/static/geo/village/geo-"+county+".json",
    async: false,
    success: function(result){
      geoJsonObject = topojson.feature(result, result.objects["geo-"+county]);
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

MapControl.prototype.GenAlertContent = function(feature){
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
    console.log(typhoon);
    alert = true;
    content += "<p class='info-title'>"+typhoon.headline+" - "+typhoon.description.cwb_typhoon_name+"颱風</p>";
    content += "<p>"+typhoon.description["注意事項"]+"</p>";
    var start = typhoon.effective.format("YYYY-MM-DD HH:mm");
    var end = typhoon.expires.format("YYYY-MM-DD HH:mm");
    content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
  }

  return content;
};

MapControl.prototype.ToggleSatellite = function(useSatellite){
  if(useSatellite){
    this.map.setMapTypeId('hybrid');
  }
  else{
    this.map.setMapTypeId('terrain');
  }
};

MapControl.prototype.UpdateMapRain = function(preDataHash,rainData){
  this.ClearMapRain(true);

	var UpdateInfoRain = function(d){
    var s = g_APP.rainData.station[d.stationID];
    var str = "<p>"+s.name+"</p>";
    str += "<p>累積雨量 "+d.now+" mm</p>";
    str += "<p>雨量變化 "+d.diff+" mm</p>";
    str += "<p>時間 "+d.time+" </p>";
    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"rain\");'>今日變化</div></div>";
    var loc = new google.maps.LatLng(s.lat, s.lon);
    this.infoRain.setOptions({content: str, position: loc});
  }.bind(this);

  var clickFn = function(data,i){ 
    return function() {
      UpdateInfoRain(data[i]);
      this.infoRain.open(this.map);
      this.infoRainID = data[i].stationID;
    }.bind(this);
  }.bind(this);

  for(var i=0;i<rainData.length;i++){
    var sID = rainData[i].stationID
    var station = g_APP.rainData.station[rainData[i].stationID];
    if(!station) continue;
    if(rainData[i].now <= 0) continue;

    rainData[i].diff = 0;
    if(preDataHash[sID]){
      if(preDataHash[sID].now && rainData[i].now){
        rainData[i].diff = rainData[i].now-preDataHash[sID].now;
      }
    }
    var value = 0, scale = 0;
    switch(g_APP.rainOption.type){
      case "daily":
        value = rainData[i].now;
        scale = 0.0005;
        break;
      case "diff":
        value = rainData[i].diff;
        scale =0.005;
        break;
    }

    //info window有打開，更新資訊
    if(this.infoRain.getMap() && this.infoRainID == station.stationID){
      UpdateInfoRain(rainData[i]);
    }

    var rectW = 0.01*g_APP.rainOption.scale;
    var rectH = scale*g_APP.rainOption.scale;
    if(this.layerRain[station.stationID]){
      var rect = this.layerRain[station.stationID];
      rect.setOptions({
        map: this.map,
        fillColor: g_APP.color.rain(value),
        fillOpacity: g_APP.rainOption.opacity,
        bounds: {
          north: station.lat+value*rectH,
          south: station.lat,
          east: station.lon+rectW,
          west: station.lon-rectW
        }
      });
      google.maps.event.clearListeners(rect,"click");
      rect.addListener('click', clickFn(rainData,i));
    }
    else{
      var rect = new google.maps.Rectangle({
        strokeWeight: 0,
        fillColor: g_APP.color.rain(value),
        fillOpacity: g_APP.rainOption.opacity,
        map: this.map,
        zIndex: 1,
        bounds: {
          north: station.lat+value*rectH,
          south: station.lat,
          east: station.lon+rectW,
          west: station.lon-rectW
        }
      });
      rect.addListener('click', clickFn(rainData,i));
      this.layerRain[station.stationID] = rect;
    }
  }
};

MapControl.prototype.UpdateMapWaterLevel = function(preDataHash, waterLevelData){
  this.ClearMapWaterLevel(true);

	var UpdateInfoWaterLevel = function(d){
    var s = g_APP.waterLevelData.station[d.StationIdentifier];
    var str = "<p>"+s.ObservatoryName+"</p>";
    str += "<p>溪流 "+s.RiverName+"</p>";
    str += "<p>水位 "+d.WaterLevel+" m (";
    if(d.levelDiff >= 0) str += "+";
    str += d.levelDiff.toFixed(2)+" m)</p>";
    str += "<p>警戒水位(三級/二級/一級):</p>";
    str += "<p>"+(s.AlertLevel3||"無")+" / "+(s.AlertLevel2||"無")+" / "+(s.AlertLevel1||"無")+" m</p>";
    str += "<p>時間 "+d.RecordTime+" </p>";
    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"waterLevel\");'>今日變化</div></div>";
    var loc = new google.maps.LatLng(s.lat, s.lon);
    this.infoWaterLevel.setOptions({content: str, position: loc});
  }.bind(this);

  var clickFn = function(data,i){ 
    return function() {
      UpdateInfoWaterLevel(data[i]);
      this.infoWaterLevel.open(this.map);
      this.infoWaterLevelID = data[i].StationIdentifier;
    }.bind(this);
  }.bind(this);

  var DrawArrow = function(lat,lng,value){
    var scale = 0.01*g_APP.waterLevelOption.scale;
    var valueScale = 0.1*g_APP.waterLevelOption.scale;
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
  }.bind(this);

  for(var i=0;i<waterLevelData.length;i++){
    var sID = waterLevelData[i].StationIdentifier
    var station = g_APP.waterLevelData.station[sID];
    if(!station) continue;

    //compute water level difference
    var value = 0;
    if(preDataHash[sID]){
      if(preDataHash[sID].WaterLevel && waterLevelData[i].WaterLevel){
        value = waterLevelData[i].WaterLevel-preDataHash[sID].WaterLevel;
      }
    }
    waterLevelData[i].levelDiff = value;

    //info window有打開，更新資訊
    if(this.infoWaterLevel.getMap() && this.infoWaterLevelID == station.BasinIdentifier){
      UpdateInfoWaterLevel(waterLevelData[i]);
    }

    var color = "#37cc00";
    if(waterLevelData[i].WaterLevel > station.AlertLevel3) color = "#ffcc00";
    if(waterLevelData[i].WaterLevel > station.AlertLevel2) color = "#ff6600";
    if(waterLevelData[i].WaterLevel > station.AlertLevel1) color = "#ff0000";

    if(this.layerWaterLevel[station.BasinIdentifier]){
      var arrow = this.layerWaterLevel[station.BasinIdentifier];
      arrow.setOptions({
        map: this.map,
        fillColor: color,
        strokeOpacity: g_APP.waterLevelOption.opacity,
        fillOpacity: g_APP.waterLevelOption.opacity,
        paths: DrawArrow(station.lat,station.lon,value)
      });
      google.maps.event.clearListeners(arrow,"click");
      arrow.addListener('click', clickFn(waterLevelData,i));
    }
    else{
      var arrow = new google.maps.Polygon({
        strokeWeight: 1,
        strokeColor: '#000000',
        strokeOpacity: g_APP.waterLevelOption.opacity,
        fillColor: color,
        fillOpacity: g_APP.waterLevelOption.opacity,
        map: this.map,
        zIndex: 2,
        paths: DrawArrow(station.lat,station.lon,value)
      });
      arrow.addListener('click', clickFn(waterLevelData,i));
      this.layerWaterLevel[station.BasinIdentifier] = arrow;
    }
  }
};

MapControl.prototype.UpdateMapReservoir = function(reservoirData){
  this.ClearMapReservoir(true);

	var UpdateInfoReservoir = function(d){
    var s = g_APP.reservoirData.station[d.ReservoirIdentifier];
    var percent = (100*d.EffectiveWaterStorageCapacity/s.EffectiveCapacity).toFixed(2);
    var str = "<p>"+s.ReservoirName+"</p>";
    str += "<p>蓄水百分比 "+percent+" %</p>";
    str += "<p>水位/滿水位/死水位: </p>"
    str += d.WaterLevel+" / "+s.FullWaterLevel+" / "+s.DeadStorageLevel+" m</p>";
    str += "<p>有效總容量 "+s.EffectiveCapacity+" m3</p>";
    str += "<p>時間 "+d.ObservationTime+" </p>";
    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"reservoir\");'>今日變化</div></div>";
    var loc = new google.maps.LatLng(s.lat, s.lng);
    this.infoReservoir.setOptions({content: str, position: loc});
  }.bind(this);

  var clickFn = function(data,i){ 
    return function() {
      UpdateInfoReservoir(data[i]);
      this.infoReservoir.open(this.map);
      this.infoReservoirID = data[i].ReservoirIdentifier;
    }.bind(this);
  }.bind(this);

  for(var i=0;i<reservoirData.length;i++){
    var station = g_APP.reservoirData.station[reservoirData[i].ReservoirIdentifier];
    if(!station || !this.map) continue;
    //info window有打開，更新資訊
    if(this.infoReservoir.getMap() && this.infoReservoirID == station.id){
      UpdateInfoReservoir(reservoirData[i]);
    }

    var zoomLevel = this.map.getZoom();
    var baseSize = 0.001*(Math.pow(1.7,zoomLevel-7))*g_APP.reservoirOption.scale;
    var d = reservoirData[i];
    var percent = (100*d.EffectiveWaterStorageCapacity/station.EffectiveCapacity).toFixed(2);
    if(isNaN(percent)) continue;

    if(this.layerReservoir[station.id]){
      var overlay = this.layerReservoir[station.id];
      var option = {
        map: this.map,
        size: station.EffectiveCapacity*baseSize,
        percent: percent,
        opacity: g_APP.reservoirOption.opacity,
        color: g_APP.color.reservoir(percent*0.01)
      };
      overlay.Update(option);
      google.maps.event.clearListeners(overlay,"click");
      overlay.addListener('click', clickFn(reservoirData,i));
    }
    else{
      var overlay = new ReservoirOverlay({
        map: this.map,
        lat: station.lat,
        lng: station.lng,
        size: station.EffectiveCapacity*baseSize,
        svgID: "svg_"+station.id,
        percent: percent,
        opacity: g_APP.reservoirOption.opacity,
        color: g_APP.color.reservoir(percent*0.01)
      });
      
      overlay.addListener('click', clickFn(reservoirData,i));
      this.layerReservoir[station.id] = overlay;
    }
  }
};

MapControl.prototype.UpdateMapFlood = function(floodData){
  this.ClearMapFlood(true);

  var UpdateInfoFlood = function(d){
    var s = g_APP.floodData.station[d.stationID];
    var str = "<p>"+s.stationName+"</p>";
    str += "<p>淹水 "+d.value+" 公分</p>";
    str += "<p>時間 "+d.time+" </p>";
    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"flood\");'>今日變化</div></div>";
    var loc = new google.maps.LatLng(s.lat, s.lng);
    this.infoFlood.setOptions({content: str, position: loc});
  }.bind(this);

  var clickFn = function(data,i){ 
    return function() {
      UpdateInfoFlood(data[i]);
      this.infoFlood.open(this.map);
      this.infoFloodID = data[i].stationID;
    }.bind(this);
  }.bind(this);

  for(var i=0;i<floodData.length;i++){
    var station = g_APP.floodData.station[floodData[i].stationID];

    if(!station || !this.map) continue;
    //info window有打開，更新資訊
    if(this.infoFlood.getMap() && this.infoFloodID == station._id){
      UpdateInfoFlood(floodData[i]);
    }

    var zoomLevel = this.map.getZoom();
    var size = 10*(Math.pow(1.5,zoomLevel-7))*g_APP.floodOption.scale;
    var d = floodData[i];
    
    if(this.layerFlood[station._id]){
      var overlay = this.layerFlood[station._id];
      var option = {
        map: this.map,
        size: size,
        value: d.value,
        opacity: g_APP.floodOption.opacity
      };
      overlay.Update(option);
      google.maps.event.clearListeners(overlay,"click");
      overlay.addListener('click', clickFn(floodData,i));
    }
    else{
      var overlay = new FloodOverlay({
        map: this.map,
        lat: station.lat,
        lng: station.lng,
        size: size,
        svgID: "svg_"+station._id,
        value: d.value,
        opacity: g_APP.floodOption.opacity,
        color: g_APP.color.flood
      });
      
      overlay.addListener('click', clickFn(floodData,i));
      this.layerFlood[station._id] = overlay;
    }
  }
};

MapControl.prototype.UpdateMapAlert = function(alertData, t){
  this.ClearMapAlert(true);

	AddAlert = function(type, alertData){
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
            /*case "debrisFlow": //土石流
              var county = alert.geocode[j].substr(0,5);
              var code = alert.geocode[j].substr(5).replace("-","0");
              if(county[0] == '6'){ //五都編號需特別處理...
                code = county.substr(3,5)+code.substr(2);
                county = county.substr(0,3)+"00";
              }
              if(!(county in this.geoVillage)){
                this.LoadVillage(county);
              }
              var id = county+code
              var feature = this.map.data.getFeatureById(id);
              if(!feature){
                if(!(id in this.geoVillage[county])){
                  console.log(type+": "+id+" not found");
                  continue;
                }
                this.map.data.addGeoJson(this.geoVillage[county][id]);
                feature = this.map.data.getFeatureById(id);
              }
              var arr = feature.getProperty(type);
              arr.push(alert);
              feature.setProperty(type,arr);
              break;
            case "thunderstorm": //雷雨
              break;*/
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
            this.infoStorm.setOptions({content: str, position: d.loc});
          }.bind(this);

          //info window有打開，更新資訊
          if(this.infoStorm.getMap() && this.infoStormID == alert._id){
            UpdateInfoStorm(alert);
          }

          var clickFn = function(data){ 
            return function() {
              UpdateInfoStorm(data);
              this.infoStorm.open(this.map);
              this.infoStormID = data._id;
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

            if(this.layerThunderstorm[alert._id]){
              this.layerThunderstorm[alert._id].setOptions({
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
              this.layerThunderstorm[alert._id] = poly;
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

  for(var key in alertData){
    AddAlert(key,alertData[key]);
  }
  if(this.infoAlert.getMap()){
    var feature = this.map.data.getFeatureById(this.infoAlertID);
    var content = this.GenAlertContent(feature);
    var loc = feature.getProperty("loc");
    if(content != ""){
      this.infoAlert.setOptions({content: content,position: loc});
    }
    else{
      this.infoAlert.close();
    }
  }
};

MapControl.prototype.UpdateMapTyphoon = function(typhoonData){
  this.ClearMapTyphoon(true);

	var UpdateInfoTyphoon = function(d){
    var str = "<p class='info-title'>"+d.cwb_typhoon_name+"颱風</p>";
    str += "<p>近中心最大風速: "+d.max_wind_speed+" m/s</p>";
    str += "<p>近中心最大陣風: "+d.max_gust_speed+" m/s</p>";
    str += "<p>中心氣壓: "+d.pressure+" 百帕</p>";
    str += "<p>七級風暴風半徑: "+d.circle_of_15ms+" km</p>";
    str += "<p>十級風暴風半徑: "+d.circle_of_25ms+" km</p>";
    str += "<p>時間 "+d.time+" </p>";
    var loc = new google.maps.LatLng(d.lat, d.lng);
    this.infoTyphoonTrajectory.setOptions({content: str, position: loc});
  }.bind(this);

  var clickFn = function(data,i){ 
    return function() {
      UpdateInfoTyphoon(data[i]);
      this.infoTyphoonTrajectory.open(this.map);
      this.infoTyphoonTrajectoryID = data[i].typhoon_name;
    }.bind(this);
  }.bind(this);

  for(var i=0;i<typhoonData.length;i++){
    var typhoon = typhoonData[i];

    //info window有打開，更新資訊
    if(this.infoTyphoonTrajectory.getMap() && this.infoTyphoonTrajectoryID == typhoon.typhoon_name){
      UpdateInfoTyphoon(typhoon);
    }

    var scale = 1000; //google map circle unit is m

    if(this.layerTyphoonTrajectory[typhoon.typhoon_name]){
      var graph = this.layerTyphoonTrajectory[typhoon.typhoon_name];

      graph.level7.setOptions({
        map: this.map,
        fillOpacity: g_APP.typhoonTrajectoryOption.opacity,
        center: {lat:typhoon.lat, lng:typhoon.lng},
        radius: typhoon.circle_of_15ms*scale
      });

      graph.level10.setOptions({
        map: this.map,
        fillOpacity: g_APP.typhoonTrajectoryOption.opacity,
        center: {lat:typhoon.lat, lng:typhoon.lng},
        radius: typhoon.circle_of_25ms*scale
      });

      graph.center.setOptions({
        map: this.map,
        fillOpacity: g_APP.typhoonTrajectoryOption.opacity,
        center: {lat:typhoon.lat, lng:typhoon.lng},
        radius: 1*scale
      });

      google.maps.event.clearListeners(graph.level7,"click");
      graph.level7.addListener('click', clickFn(typhoonData,i));
      google.maps.event.clearListeners(graph.level10,"click");
      graph.level10.addListener('click', clickFn(typhoonData,i));
      google.maps.event.clearListeners(graph.center,"click");
      graph.center.addListener('click', clickFn(typhoonData,i));
    }
    else{
      var graph = {level7: null, level10: null, center: null};

      graph.level7 = new google.maps.Circle({
        strokeColor: '#FFFFFF',
        strokeOpacity: 1,
        strokeWeight: 1,
        fillColor: '#FFFF00',
        fillOpacity: g_APP.typhoonTrajectoryOption.opacity,
        map: this.map,
        center: {lat:typhoon.lat, lng:typhoon.lng},
        radius: typhoon.circle_of_15ms*scale
      });
      
      graph.level10 = new google.maps.Circle({
        strokeColor: '#FFFFFF',
        strokeOpacity: 1,
        strokeWeight: 1,
        fillColor: '#FF0000',
        fillOpacity: g_APP.typhoonTrajectoryOption.opacity,
        map: this.map,
        center: {lat:typhoon.lat, lng:typhoon.lng},
        radius: typhoon.circle_of_25ms*scale
      });

      graph.center = new google.maps.Circle({
        strokeColor: '#FFFFFF',
        strokeOpacity: 1,
        strokeWeight: 1,
        fillColor: '#FFFFFF',
        fillOpacity: 0,
        map: this.map,
        center: {lat:typhoon.lat, lng:typhoon.lng},
        radius: 1*scale
      });
      
      graph.level7.addListener('click', clickFn(typhoonData,i));
      graph.center.addListener('click', clickFn(typhoonData,i));
      graph.level10.addListener('click', clickFn(typhoonData,i));

      this.layerTyphoonTrajectory[typhoon.typhoon_name] = graph;
    }
  }
};

MapControl.prototype.ClearMap = function(){
  this.ClearMapRain();
  this.ClearMapWaterLevel();
  this.ClearMapReservoir();
  this.ClearMapAlert();
  this.ClearMapTyphoon();
  this.ClearMapFlood();
};

MapControl.prototype.ClearMapRain = function(keepLayer){
	for(var key in this.layerRain){
    this.layerRain[key].setMap(null);
  }
  if(!keepLayer) this.layerRain = {};
};

MapControl.prototype.ClearMapWaterLevel = function(keepLayer){
	for(var key in this.layerWaterLevel){
    this.layerWaterLevel[key].setMap(null);
  }
  if(!keepLayer) this.layerWaterLevel = {};
};

MapControl.prototype.ClearMapReservoir = function(keepLayer){
	for(var key in this.layerReservoir){
    this.layerReservoir[key].setMap(null);
  }
  if(!keepLayer) this.layerReservoir = {};
};

MapControl.prototype.ClearMapFlood = function(keepLayer){
  for(var key in this.layerFlood){
    this.layerFlood[key].setMap(null);
  }
  if(!keepLayer) this.layerFlood = {};
};

MapControl.prototype.ClearMapAlert = function(keepLayer){
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
  for(var key in this.layerThunderstorm){
    this.layerThunderstorm[key].setMap(null);
  }
  if(!keepLayer) this.layerThunderstorm = {};

  for(var key in this.layerTyphoon){
    this.layerTyphoon[key].setMap(null);
  }
  if(!keepLayer) this.layerTyphoon = {};
};

MapControl.prototype.ClearMapTyphoon = function(keepLayer){
	for(var key in this.layerTyphoonTrajectory){
    var graph = this.layerTyphoonTrajectory[key];
    graph.level7.setMap(null);
    graph.level10.setMap(null);
    graph.center.setMap(null);
  }
  if(!keepLayer) this.layerTyphoonTrajectory = {};
};

MapControl.prototype.OpenLineChart = function(type){
  this.openDailyChart = true;
  this.lineChartType = type;
  this.UpdateLineChart();
}

MapControl.prototype.UpdateLineChart = function(){
  if(!this.openDailyChart) return;

  var unitX = "", unitY = "", title="";
  var data = [];
  var minY = Number.MAX_VALUE, maxY = Number.MIN_VALUE;
  var day = g_APP.curYear+"-"+g_APP.curDate;
  switch(this.lineChartType){
    case "rain":
      title = "雨量";
      unitY = "mm";
      minY = 0;
      var s = g_APP.rainData.station[this.infoRainID];
      this.dailyChartTitle = s.name+" 雨量站 今日變化";
      var arr = g_APP.rainData.daily[this.infoRainID];
      for(var i=0;i<arr.length;i++){
        if(arr[i].now > maxY) maxY = arr[i].now;
        data.push({
          x: new Date(day+" "+arr[i].time),
          y: arr[i].now
        });
      }
      break;
    case "waterLevel":
      title = "水位";
      unitY = "m";
      var s = g_APP.waterLevelData.station[this.infoWaterLevelID];
      this.dailyChartTitle = s.ObservatoryName+" 河川水位站 今日變化";
      var arr = g_APP.waterLevelData.daily[this.infoWaterLevelID];
      for(var i=0;i<arr.length;i++){
        if(arr[i].WaterLevel < minY) minY = arr[i].WaterLevel;
        if(arr[i].WaterLevel > maxY) maxY = arr[i].WaterLevel;
        data.push({
          x: new Date(day+" "+arr[i].RecordTime),
          y: arr[i].WaterLevel
        });
      }
      break;
    case "reservoir":
      title = "蓄水百分比";
      unitY = "%";
      //minY = 0;
      //maxY = 100;
      var s = g_APP.reservoirData.station[this.infoReservoirID];
      this.dailyChartTitle = s.ReservoirName+" 蓄水百分比 今日變化";
      var arr = g_APP.reservoirData.daily[this.infoReservoirID];
      for(var i=0;i<arr.length;i++){
        var percent = (100*arr[i].EffectiveWaterStorageCapacity/s.EffectiveCapacity);
        if(percent < minY) minY = percent;
        if(percent > maxY) maxY = percent;
        data.push({
          x: new Date(day+" "+arr[i].ObservationTime),
          y: percent
        });
      }
      break;
    case "flood":
      title = "淹水深度";
      unitY = "cm";
      minY = 0;
      var s = g_APP.floodData.station[this.infoFloodID];
      this.dailyChartTitle = s.stationName+" 淹水測站 今日變化";
      var arr = g_APP.floodData.daily[this.infoFloodID];
      for(var i=0;i<arr.length;i++){
        if(arr[i].value > maxY) maxY = arr[i].value;
        data.push({
          x: new Date(day+" "+arr[i].time),
          y: Math.max(0,arr[i].value)
        });
      }
      break;
  }

  data.sort(function(a,b){
    return a.x - b.x;
  });

  var param = {};
  param.selector = "#dailyChart";
  param.textInfo = "#dailyChartText";
  param.padding = {
    left: 50,
    right: 20,
    top: 20,
    bottom: 20
  };
  param.axis = {
    minX: new Date(day+" 00:00:00"),
    maxX: new Date(day+" 23:59:59"),
    minY: minY,
    maxY: maxY,
    curX: new Date(day+" "+g_APP.curTime),
    draw: true,
    typeX: "time",
    format: "%H:%M"
  };
  var lineData = {
    "type": "line",
    "unitX": unitX,
    "unitY": unitY,
    "data": [
      {
        "name": title,
        "color": "#ff3333",
        "value": data
      }
    ]
  };
  param.graph = [lineData];
  var graph = new SvgGraph(param);
  graph.DrawGraph();
};

MapControl.prototype.GetLocation = function(keepLayer){
  if(!this.map) return;
  var center = this.map.getCenter();
  return {lat: center.lat(), lng: center.lng(), zoom: this.map.getZoom()};
};