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
    infoRainIndex: -1,
    infoReservoirIndex: -1,
    infoWaterLevelIndex: -1
  },
  created: function () {
    this.InitColor();
    $.get("/rain/extremeDate",function(result){
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
      this.curTime = "0:0";

      $.get("/rain/station",function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        var stationHash = {};
        for(var i=0;i<result.data.length;i++){
          stationHash[result.data[i].stationID] = result.data[i];
        }
        this.rainData.station = stationHash;
        this.ChangeYear(this.curYear);
      }.bind(this));

    }.bind(this));
    
    google.maps.event.addDomListener(window, 'load', this.InitMap);
  },
  methods: {
    InitColor: function(){
      this.color.rain = d3.scale.linear()
        .domain([0,1,2,6,10,15,20,30,40,50,70,90,110,130,150,200,300])
        .range(["#c1c1c1","#99ffff","#0cf","#09f","#0166ff","#329900",
              "#33ff00","#ff0","#fc0","#fe9900","#fe0000","#cc0000",
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

        google.maps.event.addListener(map, 'click', function(event) {

        });

        this.map.addListener('dragend', function() {

        });

        this.map.addListener('zoom_changed', function() {

        });
      }.bind(this));
      
      this.infoRain = new google.maps.InfoWindow();
      this.infoReservoir = new google.maps.InfoWindow();
      this.infoWaterLevel = new google.maps.InfoWindow();
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
        this.ChangeDate(this.curDate);
      }.bind(this));
    },
    ChangeDate: function(date){
      this.curDate = date;
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
        $.get("/rain/rainData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          this.rainData.data = d3.nest()
            .key(function(d){return d.time;})
            .map(result.data);
          this.ChangeTime("00:00");
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
        }.bind(this),300);
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
    },
    UpdateMapRain: function(){
      var rainData = this.rainData.data[this.curTime+":00"];
      if(!rainData) return;

      var UpdateInfoRain = function(d){
        var s = this.rainData.station[d.stationID];
        var str = "<p>"+s.name+"</p>";
        str += "<p>累積雨量 "+d.now+" mm</p>";
        var loc = new google.maps.LatLng(s.lat+0.01, s.lon);
        this.infoRain.setOptions({content: str, position: loc});
      }.bind(this);

      var clickFn = function(data,i){ 
        return function() {
          UpdateInfoRain(data[i]);
          this.infoRain.open(this.map);
          this.infoRainIndex = i;
        }.bind(this);
      }.bind(this);

      //info window有打開，更新資訊
      if(this.infoRain.getMap()){
        UpdateInfoRain(rainData[this.infoRainIndex]);
      }

      for(var i=0;i<rainData.length;i++){
        var station = this.rainData.station[rainData[i].stationID];
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
    ClearMap: function(){
      this.ClearMapRain();
    },
    ClearMapRain: function(){
      for(var key in this.layerRain){
        this.layerRain[key].setMap(null);
      }
      this.layerRain = {};
    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  
});