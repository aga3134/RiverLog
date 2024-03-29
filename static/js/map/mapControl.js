
function MapControl(){
	this.map = null;

  this.mapRain = new MapRain({"siteUrl":"/rain/station", "dataUrl":"/rain/rainData", "gridUrl":"/rain/gridData"});
  this.mapReservoir = new MapReservoir({"siteUrl":"/reservoir/info", "dataUrl":"/reservoir/reservoirData"});
  this.mapWaterLevel = new MapWaterLevel({"siteUrl":"/waterLevel/station", "dataUrl":"/waterLevel/waterLevelData"});
  this.mapWaterLevelDrain = new MapWaterLevelDrain({"siteUrl":"/waterLevelDrain/station", "dataUrl":"/waterLevelDrain/waterLevelDrainData"});
  this.mapWaterLevelAgri = new MapWaterLevelAgri({"siteUrl":"/waterLevelAgri/station", "dataUrl":"/waterLevelAgri/waterLevelAgriData"});
  this.mapWaterLevelGate = new MapWaterLevelGate({"siteUrl":"/waterLevelGate/station", "dataUrl":"/waterLevelGate/waterLevelGateData"});
  this.mapSewer = new MapSewer({"siteUrl":"/sewer/station", "dataUrl":"/sewer/sewerData"});
  this.mapPump = new MapPump({"siteUrl":"/pump/station", "dataUrl":"/pump/pumpData"});
  this.mapTide = new MapTide({"siteUrl":"/tide/station", "dataUrl":"/tide/tideData"});
  this.mapFlood = new MapFlood({"siteUrl":"/flood/station", "dataUrl":"/flood/floodData"});
  this.mapTyphoon = new MapTyphoon({"dataUrl":"/alert/typhoonData"});
  this.mapAlert = new MapAlert({"dataUrl":"/alert/alertData"});
  this.mapElev = new MapElev({"gridUrl":"/elev/gridData"});
  this.mapBasin = new MapBasin({});
  this.mapWind = new MapWind({"siteUrl":"/wind/station", "dataUrl":"/wind/windData"});
  this.mapWaterbox = new MapWaterbox({"dataUrl":"/waterbox/waterboxData"});
  this.mapCCTV = new MapCCTV({"siteUrl":"/cctv/station"});
  
  this.openDailyChart = false;
  this.dailyChartTitle = "";
  this.lineChartType = "";
  this.mapStyle = "";
  this.marker = null;
};

MapControl.prototype.InitMap = function(param){
	var loc = {lat: 23.682094, lng: 120.7764642, zoom: 7};
  var marker = null;
  if(param.initLoc){
    if(param.initLoc.lat) loc.lat = param.initLoc.lat;
    if(param.initLoc.lng) loc.lng = param.initLoc.lng;
    if(param.initLoc.zoom) loc.zoom = param.initLoc.zoom;
    if(param.initLoc.markerLat && param.initLoc.markerLng){
      marker = {lat:param.initLoc.markerLat,lng:param.initLoc.markerLng};
    }
  }
  var taiwan = new google.maps.LatLng(loc.lat,loc.lng);

  $.get("/static/mapStyle.json",function(style){
    this.mapStyle = style;
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: taiwan,
      zoom: loc.zoom,
      scaleControl: true,
      mapTypeId: param.useSatellite?"hybrid":"terrain",
      styles: style,
      mapTypeControl: false
    });

    if(marker){
      this.marker = new google.maps.Marker({
        position: marker,
        map: this.map,
      });
    }

    google.maps.event.addListener(this.map, 'click', function(event) {
      
    });

    this.map.addListener('dragend', function() {

    });

    this.map.addListener('zoom_changed', function() {
      
    }.bind(this));

    this.map.addListener('bounds_changed',function(){
      g_APP.UpdateMap();
    });

    this.map.data.setStyle(function(feature){
      var type = feature.getProperty('type');
      switch(type){
        case "alert":
          return this.mapAlert.SetFeatureStyle(feature);
        case "basin":
          return this.mapBasin.SetFeatureStyle(feature);
      }
    }.bind(this));

    this.map.data.addListener('click',function(event){
      var type = event.feature.getProperty('type');
      switch(type){
        case "alert":
          return this.mapAlert.FeatureClick(event);
        case "basin":
          return this.mapBasin.FeatureClick(event);
      }
      
    }.bind(this));

    this.map.data.addListener('mouseover',function(event){
      var type = event.feature.getProperty('type');
      switch(type){
        case "basin":
          return this.mapBasin.FeatureMouseOver(event);
      }
    }.bind(this));

    this.map.data.addListener('mouseout',function(event){
      var type = event.feature.getProperty('type');
      switch(type){
        case "basin":
          return this.mapBasin.FeatureMouseOut(event);
      }
    }.bind(this));

    
    this.mapRain.map = this.map;
    this.mapReservoir.map = this.map;
    this.mapWaterLevel.map = this.map;
    this.mapWaterLevelDrain.map = this.map;
    this.mapWaterLevelAgri.map = this.map;
    this.mapWaterLevelGate.map = this.map;
    this.mapSewer.map = this.map;
    this.mapPump.map = this.map;
    this.mapTide.map = this.map;
    this.mapFlood.map = this.map;
    this.mapTyphoon.map = this.map;
    this.mapAlert.map = this.map;
    this.mapAlert.InitMapInfo();
    this.mapBasin.map = this.map;
    this.mapBasin.InitMapInfo();
    this.mapElev.map = this.map;
    this.mapWind.map = this.map;
    this.mapWaterbox.map = this.map;
    this.mapCCTV.map = this.map;
    param.succFunc();

  }.bind(this));
  
};

MapControl.prototype.ChangeDate = function(){
  var date = g_APP.curYear+"-"+g_APP.curDate;
  this.mapRain.ChangeDate(date);
  this.mapReservoir.ChangeDate(date);
  this.mapWaterLevel.ChangeDate(date);
  this.mapWaterLevelDrain.ChangeDate(date);
  this.mapWaterLevelAgri.ChangeDate(date);
  this.mapWaterLevelGate.ChangeDate(date);
  this.mapSewer.ChangeDate(date);
  this.mapPump.ChangeDate(date);
  this.mapTide.ChangeDate(date);
  this.mapFlood.ChangeDate(date);
  this.mapTyphoon.ChangeDate(date);
  this.mapAlert.ChangeDate(date);
  this.mapElev.ChangeDate(date);
  this.mapWind.ChangeDate(date);
  this.mapWaterbox.ChangeDate(date);
}

MapControl.prototype.ToggleSatellite = function(useSatellite){
  if(useSatellite){
    this.map.setMapTypeId('hybrid');
  }
  else{
    this.map.setMapTypeId('terrain');
  }
};

MapControl.prototype.ToggleWaterHighlight = function(highlight){
  if(highlight){
    this.map.setOptions({styles: [{
      featureType: "water",
      elementType: "geometry.fill",
      stylers: [
        {"color": "#0000ff"}
      ]
    }]});
  }
  else{
    this.map.setOptions({styles: this.mapStyle});
  }
  
};

MapControl.prototype.UpdateMapRain = function(){
  if(!this.mapRain) return;
  this.mapRain.Update();
};

MapControl.prototype.UpdateMapWaterLevel = function(){
  if(this.mapWaterLevel) this.mapWaterLevel.Update();
  if(this.mapWaterLevelDrain) this.mapWaterLevelDrain.Update();
  if(this.mapWaterLevelAgri) this.mapWaterLevelAgri.Update();
  if(this.mapWaterLevelGate) this.mapWaterLevelGate.Update();
  if(this.mapSewer) this.mapSewer.Update();
  if(this.mapPump) this.mapPump.Update();
  if(this.mapTide) this.mapTide.Update();
};

MapControl.prototype.UpdateMapReservoir = function(){
  if(!this.mapReservoir) return;
  this.mapReservoir.Update();
};

MapControl.prototype.UpdateMapFlood = function(){
  if(!this.mapFlood) return;
  this.mapFlood.Update();
};

MapControl.prototype.UpdateMapAlert = function(alertData, t){
  if(!this.mapAlert) return;
  this.mapAlert.Update();
};

MapControl.prototype.UpdateMapTyphoon = function(typhoonData){
  if(!this.mapTyphoon) return;
  this.mapTyphoon.Update();
};

MapControl.prototype.UpdateMapElev = function(typhoonData){
  if(!this.mapElev) return;
  this.mapElev.Update();
};

MapControl.prototype.UpdateMapBasin = function(){
  if(!this.mapBasin) return;
  this.mapBasin.Update();
};

MapControl.prototype.UpdateMapWind = function(){
  if(!this.mapWind) return;
  this.mapWind.Update();
};

MapControl.prototype.UpdateMapWaterbox = function(){
  if(!this.mapWaterbox) return;
  this.mapWaterbox.Update();
  this.UpdateLineChart();
};

MapControl.prototype.UpdateMapCCTV = function(){
  if(!this.mapCCTV) return;
  this.mapCCTV.Update();
};

MapControl.prototype.ClearMap = function(){
  this.mapRain.ClearMap();
  this.mapReservoir.ClearMap();
  this.mapWaterLevel.ClearMap();
  this.mapWaterLevelDrain.ClearMap();
  this.mapWaterLevelAgri.ClearMap();
  this.mapWaterLevelGate.ClearMap();
  this.mapSewer.ClearMap();
  this.mapPump.ClearMap();
  this.mapTide.ClearMap();
  this.mapFlood.ClearMap();
  this.mapTyphoon.ClearMap();
  this.mapAlert.ClearMap();
  this.mapElev.ClearMap();
  this.mapBasin.ClearMap();
  this.mapWind.ClearMap();
  this.mapWaterbox.ClearMap();
  this.mapCCTV.ClearMap();
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
      var s = this.mapRain.data.site[this.mapRain.infoTarget];
      this.dailyChartTitle = s.name+" 雨量站 今日變化";
      var arr = this.mapRain.data.daily[this.mapRain.infoTarget];
      for(var i=0;i<arr.length;i++){
        if(arr[i].now > maxY) maxY = arr[i].now;
        data.push({
          x: new Date(day+" "+arr[i].time),
          y: arr[i].now
        });
      }
      break;
    case "waterLevel":
      title = "河川水位";
      unitY = "m";
      var s = this.mapWaterLevel.data.site[this.mapWaterLevel.infoTarget];
      this.dailyChartTitle = s.ObservatoryName+" 河川水位 今日變化";
      var arr = this.mapWaterLevel.data.daily[this.mapWaterLevel.infoTarget];
      for(var i=0;i<arr.length;i++){
        if(arr[i].WaterLevel < minY) minY = arr[i].WaterLevel;
        if(arr[i].WaterLevel > maxY) maxY = arr[i].WaterLevel;
        data.push({
          x: new Date(day+" "+arr[i].RecordTime),
          y: arr[i].WaterLevel
        });
      }
      break;
    case "waterLevelDrain":
      title = "區域排水水位";
      unitY = "m";
      var s = this.mapWaterLevelDrain.data.site[this.mapWaterLevelDrain.infoTarget];
      this.dailyChartTitle = s.stationName+" 區域排水水位 今日變化";
      var arr = this.mapWaterLevelDrain.data.daily[this.mapWaterLevelDrain.infoTarget];
      for(var i=0;i<arr.length;i++){
        if(arr[i].value < minY) minY = arr[i].value;
        if(arr[i].value > maxY) maxY = arr[i].value;
        data.push({
          x: new Date(day+" "+arr[i].time),
          y: arr[i].value
        });
      }
      break;
    /*case "waterLevelAgri":
      title = "水利會水位";
      unitY = "m";
      var s = this.mapWaterLevelAgri.data.site[this.mapWaterLevelAgri.infoTarget];
      this.dailyChartTitle = s.stationName+" 水利會水位 今日變化";
      var arr = this.mapWaterLevelAgri.data.daily[this.mapWaterLevelAgri.infoTarget];
      for(var i=0;i<arr.length;i++){
        if(arr[i].value < minY) minY = arr[i].value;
        if(arr[i].value > maxY) maxY = arr[i].value;
        data.push({
          x: new Date(day+" "+arr[i].time),
          y: arr[i].value
        });
      }
      break;*/
    case "sewer":
      title = "下水道水位";
      unitY = "m";
      var s = this.mapSewer.data.site[this.mapSewer.infoTarget];
      this.dailyChartTitle = s.name+" 下水道水位 今日變化";
      var arr = this.mapSewer.data.daily[this.mapSewer.infoTarget];
      for(var i=0;i<arr.length;i++){
        if(arr[i].value < minY) minY = arr[i].value;
        if(arr[i].value > maxY) maxY = arr[i].value;
        data.push({
          x: new Date(day+" "+arr[i].time),
          y: arr[i].value
        });
      }
      break;
    case "reservoir":
      title = "蓄水百分比";
      unitY = "%";
      //minY = 0;
      //maxY = 100;
      var s = this.mapReservoir.data.site[this.mapReservoir.infoTarget];
      this.dailyChartTitle = s.ReservoirName+" 蓄水百分比 今日變化";
      var arr = this.mapReservoir.data.daily[this.mapReservoir.infoTarget];
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
      var s = this.mapFlood.data.site[this.mapFlood.infoTarget];
      this.dailyChartTitle = s.stationName+" 淹水測站 今日變化";
      var arr = this.mapFlood.data.daily[this.mapFlood.infoTarget];
      for(var i=0;i<arr.length;i++){
        if(arr[i].value > maxY) maxY = arr[i].value;
        data.push({
          x: new Date(day+" "+arr[i].time),
          y: Math.max(0,arr[i].value)
        });
      }
      break;
    case "waterbox":
      var targetItem = {};
      for(var i=0;i<g_APP.opWaterboxItem.length;i++){
        var item = g_APP.opWaterboxItem[i];
        if(item.value == g_APP.waterboxOption.targetItem){
          targetItem = item;
          break;
        }
      }
      title = targetItem.name;
      unitY = targetItem.unit;
      this.dailyChartTitle = this.mapWaterbox.infoTarget+" "+targetItem.name+" 今日變化";
      var arr = this.mapWaterbox.data.daily[this.mapWaterbox.infoTarget];
      for(var i=0;i<arr.length;i++){
        var value = arr[i][targetItem.value];
        if(value > maxY) maxY = value;
        if(value < minY) minY = value;
        data.push({
          x: new Date(day+" "+arr[i].time),
          y: value
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