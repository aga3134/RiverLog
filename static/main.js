var g_APP = new Vue({
  el: "#app",
  data: {
    timeStr: "",
    timebar: [],
    openDateSelect: false,
    openOption: false,
    openAbout: false,
    yearArr: [],
    curYear: 2018,
    curDate: "1-1",
    curTime: "0:0",
    curItem: "rain",
    dailySum: [],
    weekLabel: [],
    monthLabel: [],
    rainData: {station:{},dayAvg:{},timeAvg:{},data:{}},
    reservoirData: {station:{},dayAvg:{},timeAvg:{},data:{}},
    waterLevelData: {station:{},dayAvg:{},timeAvg:{},data:{}},
    alertData: {},
    color: {},
    playTimer: null,
    playIcon: "/static/Image/icon-play.png",
    map: null,
    layerRain: {},
    layerReservoir: {},
    layerWaterLevel: {},
    infoRain: null,
    infoReservoir: null,
    infoWaterLevel: null,
    infoAlert: null,
    infoRainID: "",
    infoReservoirID: "",
    infoWaterLevelID: "",
    infoAlertID: "",
    geoDebris: {},
    geoTown: {},
    geoVillage: {}
  },
  created: function () {
    this.InitColor();

    //load init data synchronously
    $.ajax({
      url:"/rain/extremeDate",
      async: false,
      success: function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        var maxT = result.data.maxDate.split("-");
        var minT = result.data.minDate.split("-");
        var minYear = parseInt(minT[0]);
        var maxYear = parseInt(maxT[0]);
        this.yearArr = [];
        for(var i=minYear;i<=maxYear;i++){
          this.yearArr.push(i);
        }
        this.curYear = maxYear;
        this.curDate = maxT[1]+"-"+maxT[2];
        this.curTime = "00:00";
      }.bind(this)
    });

    $.ajax({
      url:"/rain/station",
      async: false,
      success:function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        var stationHash = {};
        for(var i=0;i<result.data.length;i++){
          stationHash[result.data[i].stationID] = result.data[i];
        }
        this.rainData.station = stationHash;

      }.bind(this)
    });

    $.ajax({
      url:"/waterLevel/station",
      async: false,
      success: function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        var stationHash = {};
        for(var i=0;i<result.data.length;i++){
          stationHash[result.data[i].BasinIdentifier] = result.data[i];
        }
        this.waterLevelData.station = stationHash;
      }.bind(this)
    });

    $.ajax({
      url:"/reservoir/info",
      async: false,
      success: function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        var stationHash = {};
        for(var i=0;i<result.data.length;i++){
          stationHash[result.data[i].id] = result.data[i];
        }
        this.reservoirData.station = stationHash;
      }.bind(this)
    });

    this.ChangeYear(this.curYear);
    google.maps.event.addDomListener(window, 'load', this.InitMap);
  },
  methods: {
    InitColor: function(){
      this.color.rain = d3.scale.linear()
        .domain([0,1,2,6,10,15,20,30,40,50,70,90,110,130,150,200,300])
        .range(["#c1c1c1","#99ffff","#0cf","#09f","#0166ff","#329900",
              "#33ff00","#ff0","#fc0","#ff9900","#ff0000","#cc0000",
              "#990000","#990099","#cc00cc","#ff00ff","#ffccff"]);
    },
    InitMap: function(){
      var loc = {lat: 23.682094, lng: 120.7764642, zoom: 7};
      var taiwan = new google.maps.LatLng(loc.lat,loc.lng);

      $.get("/static/mapStyle.json",function(style){
        this.map = new google.maps.Map(document.getElementById('map'), {
          center: taiwan,
          zoom: loc.zoom,
          scaleControl: true,
          mapTypeId: 'terrain',
          styles: style,
          mapTypeControl: false
        });

        google.maps.event.addListener(this.map, 'click', function(event) {
          
        });

        this.map.addListener('dragend', function() {

        });

        this.map.addListener('zoom_changed', function() {
          this.UpdateMap();
        }.bind(this));

        this.map.data.setStyle(function(feature){
          var alert = false;
          var floodArr = feature.getProperty('Flood');
          if(floodArr && floodArr.length > 0) alert = true;
          var reservoirDisArr = feature.getProperty('ReservoirDis');
          if(reservoirDisArr && reservoirDisArr.length > 0) alert = true;
          //var rainfallArr = feature.getProperty('rainfall');
          //if(rainfallArr && rainfallArr.length > 0) alert = true;
          var highWaterArr = feature.getProperty('highWater');
          if(highWaterArr && highWaterArr.length > 0) alert = true;
          var waterArr = feature.getProperty('water');
          if(waterArr && waterArr.length > 0) alert = true;
          var debrisFlowArr = feature.getProperty('debrisFlow');
          if(debrisFlowArr && debrisFlowArr.length > 0) alert = true;

          if(alert){
            return {
              strokeWeight: 1,
              strokeOpacity: .5,
              strokeColor: '#000',
              fillColor: '#f00',
              fillOpacity: .3
            }
          }
          else{
            return {
              strokeOpacity: 0,
              fillOpacity: 0
            }
          }
        });

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
            debris.properties.loc = debris.geometry.coordinates[0][0];
          }
          debris.properties.debrisFlow = [];
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
    },
    GenAlertContent: function(feature){
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

      /*var rainfallArr = feature.getProperty("rainfall");
      for(var i=0;i<rainfallArr.length;i++){
        var rainFall = rainfallArr[i];
        alert = true;
        content += "<p class='info-title'>"+rainFall.headline+"</p>";
        content += "<p>"+rainFall.description+"</p>";
        var start = rainFall.effective.format("YYYY-MM-DD HH:mm");
        var end = rainFall.expires.format("YYYY-MM-DD HH:mm");
        content += "<p>警戒期間 "+start+" ~ "+end+"</p>";
      }*/

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

      return content;
    },
    ChangeYear: function(year){
      this.curYear = year;
      $.get("/rain/dailySum?year="+year,function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        this.rainData.dayAvg = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          this.rainData.dayAvg[d.time] = d;
        }
        this.UpdateDailySum();
        Vue.nextTick(function(){
          this.ChangeDate(this.curDate);
        }.bind(this));
        
      }.bind(this));
    },
    ChangeDate: function(date){
      this.curDate = date;
      var selectDate = $(".select-date");
      var target = $(".date-bt[data-date='"+date+"']");
      var x = target.css("left");
      var y = target.css("top");
      selectDate.css("left",x);
      selectDate.css("top",y);

      $.get("/rain/10minSum?date="+this.curYear+"-"+this.curDate,function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        this.rainData.timeAvg = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          this.rainData.timeAvg[d.time] = d;
        }
        this.UpdateTimebar();
        this.ChangeTime("00:00");

        $.get("/rain/rainData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          this.rainData.data = d3.nest()
            .key(function(d){return d.time;})
            .map(result.data);
          this.UpdateMapRain();
        }.bind(this));

        $.get("/waterLevel/waterLevelData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          this.waterLevelData.data = d3.nest()
            .key(function(d){return d.RecordTime;})
            .map(result.data);
          this.UpdateMapWaterLevel();
        }.bind(this));

        $.get("/reservoir/reservoirData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          this.reservoirData.data = d3.nest()
            .key(function(d){return d.ObservationTime;})
            .map(result.data);
          this.UpdateMapReservoir();
        }.bind(this));

        $.get("/alert/alertData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          for(var i=0;i<result.data.length;i++){
            var alert = result.data[i];
            alert.effective = moment(alert.effective);
            alert.expires = moment(alert.expires);
          }
          this.alertData = d3.nest()
            .key(function(d){return d.eventcode;})
            .map(result.data);
          this.UpdateMapAlert();
        }.bind(this));

      }.bind(this));
    },
    ChangeTime: function(time){
      this.curTime = time;
      this.timeStr = this.curYear+"-"+this.curDate+" "+this.curTime;
      var selectElement = $(".select-element");
      var x = this.TimeToOffset(time)*parseInt(selectElement.css("width"));
      selectElement.css("left",x+"px");
      this.UpdateMap();
    },
    TimeToOffset: function(time){
      var t = time.split(":");
      var h = parseInt(t[0]);
      var m = parseInt(t[1]);
      return h*6+parseInt(m/10);
    },
    OffsetToTime: function(offset){
      var h = parseInt(offset/6);
      var m = offset%6;
      return g_Util.PadLeft(h,2)+":"+g_Util.PadLeft(m*10,2);
    },
    PrevTime: function(){
      var offset = this.TimeToOffset(this.curTime);
      offset -= 1;
      if(offset < 0) offset = 0;
      this.ChangeTime(this.OffsetToTime(offset));
      return offset != 0;
    },
    NextTime: function(){
      var offset = this.TimeToOffset(this.curTime);
      offset += 1;
      var maxT = 23*6+5;
      if(offset > maxT) offset = maxT;
      this.ChangeTime(this.OffsetToTime(offset));
      return offset != maxT;
    },
    TogglePlay: function(){
      if(this.playTimer){
        clearInterval(this.playTimer);
        this.playTimer = null;
        this.playIcon = "/static/Image/icon-play.png";
      }
      else{
        this.playTimer = setInterval(function(){
          if(!this.NextTime()){
            clearInterval(this.playTimer);
            this.playTimer = null;
          }
        }.bind(this),200);
        this.playIcon = "/static/Image/icon-pause.png";
      }
    },
    UpdateDailySum: function(){
      Date.prototype.incDate = function() {
        this.setDate(this.getDate() + 1);
      }

      Date.prototype.getWeek = function() {
        var onejan = new Date(this.getFullYear(), 0, 1);
        return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      }

      function AddDate(date, value){
        var result = new Date(date);
        result.setDate(date.getDate()+value);
        return result;
      }

      var offsetX = 40;
      var offsetY = 20;
      var cellSize = 20;
      var startDate = new Date(this.curYear,0,1);
      var endDate = new Date(this.curYear+1,0,1);
      this.dailySum = [];

      for(var d=startDate;d<endDate;d.incDate()){
        var m = d.getMonth();
        var w = d.getWeek();
        var weekDay = d.getDay();
        var t = g_Util.DateToDateString(d);
        var avg = this.rainData.dayAvg[t];

        var bt = {};
        bt.y = (w-1)*cellSize+offsetY;
        bt.x = weekDay*cellSize+offsetX;
        if(avg){
          if(avg.northNum) bt.north = this.color.rain(avg.northSum/avg.northNum);
          if(avg.centralNum) bt.center = this.color.rain(avg.centralSum/avg.centralNum);
          if(avg.southNum) bt.south = this.color.rain(avg.southSum/avg.southNum);
        }

        //add month border
        var nl = AddDate(d,-1), nr = AddDate(d,1);
        var nt = AddDate(d,-7), nb = AddDate(d,7);

        var borderStyle = "1px solid #333333";
        if(weekDay == 6 || (nr.getMonth() != m)) bt.br=1;
        if(nt.getMonth() != m) bt.bt=1;
        if(weekDay == 0 || (nl.getMonth() != m && m == 0)) bt.bl=1;
        if(nb.getMonth() != m && m == 11) bt.bb=1;

        bt.style = {left:bt.x+"px",top:bt.y+"px"};
        if(bt.br) bt.style["border-right"] = borderStyle;
        if(bt.bt) bt.style["border-top"] = borderStyle;
        if(bt.bl) bt.style["border-left"] = borderStyle;
        if(bt.bb) bt.style["border-bottom"] = borderStyle;
        if(bt.north && bt.center && bt.south){
          bt.style["background"] = "linear-gradient("+bt.north+","+bt.center+","+bt.south+")";
        }
        bt.date = t.substr(5);
        this.dailySum.push(bt);
      }

      this.weekLabel = [];
      var wd = ["日","一","二","三","四","五","六"];
      for(var i=0;i<wd.length;i++){
        var wt = {};
        wt.text = wd[i];
        wt.x = i*cellSize+offsetX;
        wt.y = 54*cellSize;
        this.weekLabel.push(wt);
        var wb = {};
        wb.text = wd[i];
        wb.x = i*cellSize+offsetX;
        wb.y = 0;
        this.weekLabel.push(wb);
      }

      this.monthLabel = [];
      var cm = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
      for(var i=0;i<cm.length;i++){
        var m = {};
        m.text = cm[i];
        m.x = offsetX-30;
        m.y = (i*(53/12)+2)*cellSize+offsetY;
        this.monthLabel.push(m);
      }
    },
    UpdateTimebar: function(){
      var numPerHour = 6;
      var cellW = 8;
      for(var i=0;i<24*numPerHour;i++){
        var h = Math.floor(i/numPerHour);
        var m = 10*(i%numPerHour);
        var t = g_Util.PadLeft(h,2)+":"+g_Util.PadLeft(m,2);
        var avg = this.rainData.timeAvg[t+":00"];
        var bt = {};
        bt.x = i*cellW;
        bt.time = t;
        if(avg){
          if(avg.northNum) bt.north = this.color.rain(avg.northSum/avg.northNum);
          if(avg.centralNum) bt.center = this.color.rain(avg.centralSum/avg.centralNum);
          if(avg.southNum) bt.south = this.color.rain(avg.southSum/avg.southNum);
        }
        bt.style = {left:bt.x+'px'};
        if(m == 0) bt.style["border-left"] = "1px solid #c8c8c8";
        if(bt.north && bt.center && bt.south){
          bt.style["background"] = "linear-gradient("+bt.north+","+bt.center+","+bt.south+")";
        }
        this.timebar.push(bt);
      }
    },
    UpdateMap: function(){
      this.UpdateMapRain();
      this.UpdateMapWaterLevel();
      this.UpdateMapReservoir();
      this.UpdateMapAlert();
    },
    GetDataFromTime: function(data,time){
      var timeOffset = this.TimeToOffset(time);
      for(var i=timeOffset;i>=0;i--){
        var t = this.OffsetToTime(i);
        var key = t+":00";
        if(key in data){
          return data[key];
        }
      }
      return null;
    },
    UpdateMapRain: function(){
      if(!this.map) return;
      var rainData = this.GetDataFromTime(this.rainData.data,this.curTime);
      if(!rainData) return this.ClearMapRain();

      var UpdateInfoRain = function(d){
        var s = this.rainData.station[d.stationID];
        var str = "<p>"+s.name+"</p>";
        str += "<p>累積雨量 "+d.now+" mm</p>";
        str += "<p>時間 "+d.time+" </p>";
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
        var station = this.rainData.station[rainData[i].stationID];
        if(!station) continue;
        if(rainData[i].now < 0) continue;
        //info window有打開，更新資訊
        if(this.infoRain.getMap() && this.infoRainID == station.stationID){
          UpdateInfoRain(rainData[i]);
        }
        var rectW = 0.01;
        var rectH = 0.0005;
        if(this.layerRain[station.stationID]){
          this.layerRain[station.stationID].setOptions({
            fillColor: this.color.rain(rainData[i].now),
            bounds: {
              north: station.lat+rainData[i].now*rectH,
              south: station.lat,
              east: station.lon+rectW,
              west: station.lon-rectW
            }
          });
        }
        else{
          var rect = new google.maps.Rectangle({
            strokeWeight: 0,
            strokeColor: '#ffffff',
            strokeOpacity: 0.8,
            fillColor: this.color.rain(rainData[i].now),
            fillOpacity: 0.8,
            map: this.map,
            zIndex: 1,
            bounds: {
              north: station.lat+rainData[i].now*rectH,
              south: station.lat,
              east: station.lon+rectW,
              west: station.lon-rectW
            }
          });
          rect.addListener('click', clickFn(rainData,i));
          this.layerRain[station.stationID] = rect;
        }
      }
    },
    UpdateMapWaterLevel: function(){
      if(!this.map) return;
      var waterLevelData = this.GetDataFromTime(this.waterLevelData.data,this.curTime);
      if(!waterLevelData) return this.ClearMapWaterLevel();

      var UpdateInfoWaterLevel = function(d){
        var s = this.waterLevelData.station[d.StationIdentifier];
        var str = "<p>"+s.ObservatoryName+"</p>";
        str += "<p>溪流 "+s.RiverName+"</p>";
        str += "<p>水位 "+d.WaterLevel+" m</p>";
        str += "<p>警戒水位(三級/二級/一級):</p>";
        str += "<p>"+(s.AlertLevel3||"無")+" / "+(s.AlertLevel2||"無")+" / "+(s.AlertLevel1||"無")+" m</p>";
        str += "<p>時間 "+d.RecordTime+" </p>";
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

      for(var i=0;i<waterLevelData.length;i++){
        var station = this.waterLevelData.station[waterLevelData[i].StationIdentifier];
        if(!station) continue;
        //info window有打開，更新資訊
        if(this.infoWaterLevel.getMap() && this.infoWaterLevelID == station.BasinIdentifier){
          UpdateInfoWaterLevel(waterLevelData[i]);
        }
        var size = 0.01;
        var base = 1000;
        if(station.AlertLevel3) base = station.AlertLevel3;
        else if(station.AlertLevel2) base = station.AlertLevel2*0.8;
        else if(station.AlertLevel1) base = station.AlertLevel1*0.6;

        var value = waterLevelData[i].WaterLevel/base;
        var color = "#37cc00";
        if(waterLevelData[i].WaterLevel > station.AlertLevel3) color = "#ffcc00";
        if(waterLevelData[i].WaterLevel > station.AlertLevel2) color = "#ff6600";
        if(waterLevelData[i].WaterLevel > station.AlertLevel1) color = "#ff0000";

        if(this.layerWaterLevel[station.BasinIdentifier]){
          this.layerWaterLevel[station.BasinIdentifier].setOptions({
            fillColor: color,
            paths: [
              {lat: station.lat-size*value, lng: station.lon},
              {lat: station.lat, lng: station.lon-size*value},
              {lat: station.lat+size*value, lng: station.lon},
              {lat: station.lat, lng: station.lon+size*value}
            ]
          });
        }
        else{
          var diamond = new google.maps.Polygon({
            strokeWeight: 1,
            strokeColor: '#000000',
            strokeOpacity: 0.5,
            fillColor: color,
            fillOpacity: 0.5,
            map: this.map,
            zIndex: 2,
            paths: [
              {lat: station.lat-size*value, lng: station.lon},
              {lat: station.lat, lng: station.lon-size*value},
              {lat: station.lat+size*value, lng: station.lon},
              {lat: station.lat, lng: station.lon+size*value}
            ]
          });
          diamond.addListener('click', clickFn(waterLevelData,i));
          this.layerWaterLevel[station.BasinIdentifier] = diamond;
        }
      }
    },
    UpdateMapReservoir: function(){
      if(!this.map) return;
      var hour = this.curTime.split(":")[0];
      var reservoirData = this.GetDataFromTime(this.reservoirData.data,hour+":00");
      if(!reservoirData) return this.ClearMapReservoir();

      var UpdateInfoReservoir = function(d){
        var s = this.reservoirData.station[d.ReservoirIdentifier];
        var percent = (100*d.EffectiveWaterStorageCapacity/s.CurruntEffectiveCapacity).toFixed(2);
        var str = "<p>"+s.ReservoirName+"</p>";
        str += "<p>蓄水百分比 "+percent+" %</p>";
        str += "<p>水位/滿水位/死水位: </p>"
        str += d.WaterLevel+" / "+s.FullWaterLevel+" / "+s.DeadStorageLevel+" m</p>";
        str += "<p>有效總容量 "+s.CurruntEffectiveCapacity+" m3</p>";
        str += "<p>時間 "+d.ObservationTime+" </p>";
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
        var station = this.reservoirData.station[reservoirData[i].ReservoirIdentifier];
        if(!station) continue;
        //info window有打開，更新資訊
        if(this.infoReservoir.getMap() && this.infoReservoirID == station.id){
          UpdateInfoReservoir(reservoirData[i]);
        }

        var zoomLevel = this.map.getZoom();
        var baseSize = 0.001*(Math.pow(1.7,zoomLevel-7));
        var d = reservoirData[i];
        var percent = (100*d.EffectiveWaterStorageCapacity/station.CurruntEffectiveCapacity).toFixed(2);

        if(this.layerReservoir[station.id]){
          var option = {
            size: station.CurruntEffectiveCapacity*baseSize,
            percent: percent,
            opacity: 0.5
          };
          this.layerReservoir[station.id].Update(option);
        }
        else{
          var overlay = new SvgOverlay({
            map: this.map,
            lat: station.lat,
            lng: station.lng,
            size: station.CurruntEffectiveCapacity*baseSize,
            svgID: "svg_"+station.id,
            percent: percent,
            opacity: 0.5
          });
          
          overlay.addListener('click', clickFn(reservoirData,i));
          this.layerReservoir[station.id] = overlay;
        }
      }
    },
    UpdateMapAlert: function(){
      AddAlert = function(type, alertData){
        for(var i=0;i<alertData.length;i++){
          var alert = alertData[i];
          if(t >= alert.effective && t < alert.expires){
            for(var j=0;j<alert.geocode.length;j++){
              switch(type){
                case "Flood": //淹水
                case "ReservoirDis": //水庫放流
                //case "rainfall": //降雨
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
                  var arr = feature.getProperty(type);
                  arr.push(alert);
                  feature.setProperty(type,arr);
                  break;
                case "debrisFlow": //土石流
                  break;
                case "thunderstorm": //雷雨
                  break;
              }

              
            }
          }
        }
      }.bind(this);

      if(!this.map) return;
      this.ClearMapAlert();
      var t = moment(this.curYear+"-"+this.curDate+" "+this.curTime);
      for(var key in this.alertData){
        AddAlert(key,this.alertData[key]);
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
    },
    ClearMap: function(){
      this.ClearMapRain();
      this.ClearMapWaterLevel();
      this.ClearMapReservoir();
      this.ClearMapAlert();
    },
    ClearMapRain: function(){
      for(var key in this.layerRain){
        this.layerRain[key].setMap(null);
      }
      this.layerRain = {};
    },
    ClearMapWaterLevel: function(){
      for(var key in this.layerWaterLevel){
        this.layerWaterLevel[key].setMap(null);
      }
      this.layerWaterLevel = {};
    },
    ClearMapReservoir: function(){
      for(var key in this.layerReservoir){
        this.layerReservoir[key].setMap(null);
      }
      this.layerReservoir = {};
    },
    ClearMapAlert: function(){
      this.map.data.forEach(function(feature){
        feature.setProperty("Flood",[]);
      });
    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  
});