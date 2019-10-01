var g_APP = new Vue({
  el: "#app",
  data: {
    mapType: "waterEvent",
    timeStr: "",
    timebar: [],
    openDateSelect: false,
    openOption: false,
    openAbout: false,
    yearArr: [],
    curYear: 2019,
    curDate: "1-1",
    curTime: "0:0",
    dailySum: [],
    weekLabel: [],
    monthLabel: [],
    rainData: {station:{},dayAvg:{},timeAvg:{},data:{}, daily:{}},
    reservoirData: {station:{},dayAvg:{},timeAvg:{},data:{}, daily:{}},
    waterLevelData: {station:{},dayAvg:{},timeAvg:{},data:{}, daily:{}},
    floodData: {station:{},data:{}, daily:{}},
    alertData: {},
    typhoonTrajectoryData: {},
    color: {},
    playTimer: null,
    playIcon: "/static/Image/icon-play.png",
    mapControl: null,
    rainOption: {opacity:0.8, scale:1, show:true, type:"daily"},
    waterLevelOption: {opacity:0.5, scale:1, show:true, thresh: 10},
    reservoirOption: {opacity:0.5, scale:1, show:true},
    floodOption: {opacity:0.5, scale:1, show:true},
    alertOption: {
      certainty: "All",
      severity: "All",
      opacity:0.5,
      showRainFall: false,
      showFlow:false,
      showReservoirDis:false,
      showHighWater:false,
      showWater:false,
      showDebrisFlow:false,
      showThunderstorm:false,
      showTyphoon:false
    },
    typhoonTrajectoryOption:{opacity:0.3, show:true},
    useSatellite: false,
    playSpeed: 5,
    waterUse: null,
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
      url:"/flood/station",
      async: false,
      success: function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        var stationHash = {};
        for(var i=0;i<result.data.length;i++){
          stationHash[result.data[i]._id] = result.data[i];
        }

        this.floodData.station = stationHash;
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
      this.color.rainDomain = [0,1,2,6,10,15,20,30,40,50,70,90,110,130,150,200,300];
      this.color.rainRange = ["#c1c1c1","#99ffff","#0cf","#09f","#0166ff","#329900",
              "#33ff00","#ff0","#fc0","#ff9900","#ff0000","#cc0000",
              "#990000","#990099","#cc00cc","#ff00ff","#ffccff"];
      this.color.rain = d3.scale.linear()
        .domain(this.color.rainDomain)
        .range(this.color.rainRange);
      
      this.color.reservoirDomain = [0,0.25,0.5,0.75,1];
      this.color.reservoirRange = ["#ff3333","#ff6633","#33ff33","#3366ff","#3333ff"];
      this.color.reservoir = d3.scale.linear()
        .domain(this.color.reservoirDomain)
        .range(this.color.reservoirRange);

      this.color.floodDomain = [0,30,60,90,120,150,180];
      this.color.floodRange = ["#ffff00","#ffff00","#ff6600","#ff6600","#ff3300","#ff3300","#ff0000"];
      this.color.flood = d3.scale.linear()
        .domain(this.color.floodDomain)
        .range(this.color.floodRange);
    },
    InitMap: function(){
      this.mapControl = new MapControl();
      this.mapControl.InitMap();

      this.waterUse = new WaterUseStatistic();
      this.waterUse.InitMap();
    },
    ToggleSatellite: function(){
      this.mapControl.ToggleSatellite(this.useSatellite);
    },
    UpdateMapType: function(){
      switch(this.mapType){
        case "waterEvent":
          Vue.nextTick(function(){
            this.UpdateMap();
          }.bind(this));
          break;
        case "waterUse":
          Vue.nextTick(function(){
            this.waterUse.UpdateGraph();
          }.bind(this));
          break;
      }
    },
    ChangeYear: function(year){
      this.curYear = year;
      $.get("/rain/dailySum?year="+year,function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        this["rainData"].dayAvg = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          this["rainData"].dayAvg[d.time] = d;
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

      var url = "/rain/10minSum?date="+this.curYear+"-"+this.curDate;
      
      $.get(url,function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        this["rainData"].timeAvg = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          this["rainData"].timeAvg[d.time] = d;
        }
        //console.log(this["rainData"].timeAvg);
        this.UpdateTimebar();
        this.ChangeTime("00:00");

        $.get("/rain/rainData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          this.rainData.data = d3.nest()
            .key(function(d){return d.time;})
            .map(result.data);

          this.rainData.daily = d3.nest()
            .key(function(d){return d.stationID})
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

          this.waterLevelData.daily = d3.nest()
            .key(function(d){return d.StationIdentifier})
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

          this.reservoirData.daily = d3.nest()
            .key(function(d){return d.ReservoirIdentifier})
            .map(result.data);

          this.UpdateMapReservoir();
        }.bind(this));

        $.get("/flood/floodData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          var date = this.curYear+"-"+this.curDate;
          this.floodData.data = d3.nest()
            .key(function(d){
              var t = dayjs(date+" "+d.time);
              var m = t.minute();
              m = m - m%10;
              t = t.set('minute', m);
              return t.format("HH:mm:00");
            })
            .map(result.data);

          this.floodData.daily = d3.nest()
            .key(function(d){return d.stationID})
            .map(result.data);
            
          this.UpdateMapFlood();
        }.bind(this));

        $.get("/alert/alertData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          for(var i=0;i<result.data.length;i++){
            var alert = result.data[i];
            alert.effective = dayjs(alert.effective);
            alert.expires = dayjs(alert.expires);
          }
          this.alertData = d3.nest()
            .key(function(d){return d.eventcode;})
            .map(result.data);

          this.UpdateMapAlert();
        }.bind(this));

        $.get("/alert/typhoonData?date="+this.curYear+"-"+this.curDate,function(result){
          if(result.status != "ok"){
            return console.log(result.err);
          }
          for(var i=0;i<result.data.length;i++){
            var typhoon = result.data[i];
            var t = dayjs(typhoon.time);
            typhoon.time = t.format("HH:00:00");
            typhoon.circle_of_15ms = Math.max(0,typhoon.circle_of_15ms);
            typhoon.circle_of_25ms = Math.max(0,typhoon.circle_of_25ms);
          }
          this.typhoonTrajectoryData = d3.nest()
            .key(function(d){return d.time;})
            .map(result.data);

          this.UpdateMapTyphoon();
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
    SwitchPanel: function(type){
      this.openDateSelect = false;
      this.openOption = false;
      this.openAbout = false;
      switch(type){ 
        case "date":
          this.openDateSelect = true;
          break;
        case "option":
          this.openOption = true;
          break;
        case "about":
          this.openAbout = true;
          break;
      }
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
            this.TogglePlay();
          }
        }.bind(this),1000.0/this.playSpeed);
        this.playIcon = "/static/Image/icon-pause.png";
      }
    },
    UpdatePlaySpeed: function(){
      if(this.playTimer){
        clearInterval(this.playTimer);
        this.playTimer = setInterval(function(){
          if(!this.NextTime()){
            this.TogglePlay();
          }
        }.bind(this),1000.0/this.playSpeed);
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
        var color = this.color.rain;

        var bt = {};
        bt.y = (w-1)*cellSize+offsetY;
        bt.x = weekDay*cellSize+offsetX;
        if(avg){
          if(avg.northNum) bt.north = color(avg.northSum/avg.northNum);
          if(avg.centralNum) bt.center = color(avg.centralSum/avg.centralNum);
          if(avg.southNum) bt.south = color(avg.southSum/avg.southNum);
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
        var color = this.color.rain;

        var bt = {};
        bt.x = i*cellW;
        bt.time = t;
        if(avg){
          if(avg.northNum) bt.north = color(avg.northSum/avg.northNum);
          if(avg.centralNum) bt.center = color(avg.centralSum/avg.centralNum);
          if(avg.southNum) bt.south = color(avg.southSum/avg.southNum);
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
      this.UpdateMapFlood();
      this.UpdateMapAlert();
      this.UpdateMapTyphoon();
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
      if(!this.mapControl) return;
      //compute data hash in previous time
      var offset = this.TimeToOffset(this.curTime);
      offset -= 1;
      if(offset < 0) offset = 0;
      var preData = this.GetDataFromTime(this.rainData.data,this.OffsetToTime(offset));

      var rainData = this.GetDataFromTime(this.rainData.data,this.curTime);
      if(!rainData || this.rainOption.show == false) return this.mapControl.ClearMapRain();
      
      var preDataHash = {};
      if(preData){
        for(var i=0;i<preData.length;i++){
          var s = preData[i].stationID;
          preDataHash[s] = preData[i];
        }
      }
      this.mapControl.UpdateMapRain(preDataHash, rainData);
    },
    UpdateMapWaterLevel: function(){
      if(!this.mapControl) return;
      //compute data hash in previous time
      var offset = this.TimeToOffset(this.curTime);
      offset -= 1;
      if(offset < 0) offset = 0;
      var preData = this.GetDataFromTime(this.waterLevelData.data,this.OffsetToTime(offset));

      var waterLevelData = this.GetDataFromTime(this.waterLevelData.data,this.curTime);
      if(!waterLevelData || this.waterLevelOption.show == false) return this.mapControl.ClearMapWaterLevel();

      var preDataHash = {};
      if(preData){
        for(var i=0;i<preData.length;i++){
          var s = preData[i].StationIdentifier;
          preDataHash[s] = preData[i];
        }
      }
      this.mapControl.UpdateMapWaterLevel(preDataHash, waterLevelData);
    },
    UpdateMapReservoir: function(){
      if(!this.mapControl) return;
      var hour = this.curTime.split(":")[0];
      var reservoirData = this.GetDataFromTime(this.reservoirData.data,hour+":00");
      if(!reservoirData || this.reservoirOption.show == false) return this.mapControl.ClearMapReservoir();
      this.mapControl.UpdateMapReservoir(reservoirData);
    },
    UpdateMapFlood: function(){
      if(!this.mapControl) return;
      var floodData = this.GetDataFromTime(this.floodData.data,this.curTime);
      if(!floodData || this.floodOption.show == false) return this.mapControl.ClearMapFlood();
      this.mapControl.UpdateMapFlood(floodData);
    },
    UpdateMapAlert: function(){
      if(!this.mapControl) return;
      this.mapControl.ClearMapAlert();
      //console.log(this.alertData);
      var t = dayjs(this.curYear+"-"+this.curDate+" "+this.curTime);
      this.mapControl.UpdateMapAlert(this.alertData, t);
    },
    UpdateMapTyphoon: function(){
      if(!this.mapControl) return;
      var hour = this.curTime.split(":")[0];
      var typhoonData = this.typhoonTrajectoryData[hour+":00:00"];
      if(!typhoonData || this.typhoonTrajectoryOption.show == false) return this.mapControl.ClearMapTyphoon();
      this.mapControl.UpdateMapTyphoon(typhoonData);
    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  g_APP.UpdateMapType();
});