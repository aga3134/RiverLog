var g_APP = new Vue({
  el: "#app",
  data: {
    timeStr: "",
    timebar: [],
    openDateSelect: false,
    openOption: false,
    openAbout: false,
    yearArr: [],
    curYear: 2019,
    curDate: "1-1",
    curTime: "0:0",
    initLoc: {},
    dailySum: [],
    weekLabel: [],
    monthLabel: [],
    rainData: {station:{},dayAvg:{},timeAvg:{},data:{}, daily:{}},
    reservoirData: {station:{},dayAvg:{},timeAvg:{},data:{}, daily:{}},
    waterLevelData: {station:{},dayAvg:{},timeAvg:{},data:{}, daily:{}},
    floodData: {station:{},data:{}, daily:{}},
    alertData: {},
    alertStatistic: {},
    typhoonTrajectoryData: {},
    color: {},
    playTimer: null,
    playIcon: "/static/Image/icon-play.png",
    mapControl: null,
    rainOption: {opacity:0.8, scale:1, show:true, type:"daily"},
    waterLevelOption: {opacity:0.5, scale:1, show:true, thresh: 10},
    reservoirOption: {opacity:0.5, scale:1, show:true},
    floodOption: {opacity:0.5, scale:1, show:true},
    typhoonTrajectoryOption:{opacity:0.3, show:true},
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
    mapOption: {
      mapType: "waterEvent",
      useSatellite: false,
      playSpeed: 5,
    },
    waterUse: null,
    dateInfo: {date: "", alert: ""},
    opMapType: [
      {name: "水事件地圖", value:"waterEvent"},
      {name: "用水統計", value:"waterUse"},
    ],
    opRainType: [
      {name: "日累積雨量", value:"daily"},
      {name: "雨量變化", value:"diff"},
    ],
    opAlertCertainty: [
      {name: "全部", value:"All"},
      {name: "已發生", value:"Observed"},
      {name: "很可能發生", value:"Likely"},
      {name: "可能發生", value:"Possible"},
      {name: "不太會發生", value:"Unlikely"},
      {name: "未知", value:"Unknown"},
    ],
    opAlertSeverity: [
      {name: "全部", value:"All"},
      {name: "嚴重威脅", value:"Extreme"},
      {name: "有威脅", value:"Severe"},
      {name: "可能有威脅", value:"Moderate"},
      {name: "不太有威脅", value:"Minor"},
      {name: "未知", value:"Unknown"},
    ]
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

    this.mapControl = new MapControl();
    this.waterUse = new WaterUseStatistic();

    this.ParseParameter();
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
      this.color.reservoirRange = ["#FF3333","#FF6666","#FFFF00","#178BCA","#178BCA"];
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
      if(this.mapControl){
        var param = {
          useSatellite: this.mapOption.useSatellite,
          initLoc: this.initLoc
        };
        this.mapControl.InitMap(param);
      }
      if(this.waterUse){
        this.waterUse.InitMap();
      }
    },
    ToggleSatellite: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.ToggleSatellite(this.mapOption.useSatellite);
    },
    UpdateMapType: function(){
      this.UpdateUrl();
      switch(this.mapOption.mapType){
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
        if(result.status != "ok") return;
        this["rainData"].dayAvg = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          this["rainData"].dayAvg[d.time] = d;
        }

        $.get("/alert/alertStatistic?year="+year, function(result){
          if(result.status != "ok") return;

          this.alertStatistic = {};
          for(var i=0;i<result.data.length;i++){
            var d = result.data[i];
            var t = dayjs(d.time,{timeZone:"Asia/Taipei"});
            this.alertStatistic[t.format("YYYY-MM-DD")] = d;
          }

          this.UpdateDailySum();
          Vue.nextTick(function(){
            this.ChangeDate(this.curDate);
          }.bind(this));
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

      var scrollY = parseInt(y) - $("body").height()*0.5;
      $(".date-selection").parent(".side-panel").animate({scrollTop: scrollY}, 500);

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
        this.ChangeTime(this.curTime);

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

          //expend data to later hours
          var prev = {};
          for(var i=0;i<24;i++){
            var t = g_Util.PadLeft(i,2)+":00:00";
            if(!this.reservoirData.data[t]) continue;
            var hasData = {};
            for(var j=0;j<this.reservoirData.data[t].length;j++){
              var r = this.reservoirData.data[t][j];
              if(r){
                prev[r.ReservoirIdentifier] = r;
                hasData[r.ReservoirIdentifier] = true;
              }
            }
            for(var key in prev){
              if(!hasData[key]){
                this.reservoirData.data[t].push(prev[key]);
              }
            }
          }

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
            var alertInfo = result.data[i];
            alertInfo.effective = dayjs(alertInfo.effective);
            alertInfo.expires = dayjs(alertInfo.expires);
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

      var scrollX = parseInt(x) - $("body").width()*0.5;
      var speed = 1000 / this.mapOption.playSpeed;
      if(this.playTimer == null) speed = 500;
      $(".timebar").parent(".h-scroll").animate({scrollLeft: scrollX}, speed);

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
        }.bind(this),1000.0/this.mapOption.playSpeed);
        this.playIcon = "/static/Image/icon-pause.png";
      }
    },
    UpdatePlaySpeed: function(){
      this.UpdateUrl();
      if(this.playTimer){
        clearInterval(this.playTimer);
        this.playTimer = setInterval(function(){
          if(!this.NextTime()){
            this.TogglePlay();
          }
        }.bind(this),1000.0/this.mapOption.playSpeed);
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
        if(this.alertStatistic[t]){
          bt.alert = this.alertStatistic[t];
        }
        bt.y = (w-1)*cellSize+offsetY;
        bt.x = weekDay*cellSize+offsetX;
        if(avg){
          if(avg.northNum){
            bt.northValue = parseInt(avg.northSum/avg.northNum);
            bt.northColor = color(bt.northValue);
          }
          if(avg.centralNum){
            bt.centralValue = parseInt(avg.centralSum/avg.centralNum);
            bt.centralColor = color(bt.centralValue);
          }
          if(avg.southNum){
            bt.southValue = parseInt(avg.southSum/avg.southNum);
            bt.southColor = color(bt.southValue);
          }
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
        if(bt.northColor && bt.centralColor && bt.southColor){
          bt.style["background"] = "linear-gradient("+bt.northColor+","+bt.centralColor+","+bt.southColor+")";
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
          if(avg.northNum){
            bt.northValue = parseInt(avg.northSum/avg.northNum);
            bt.northColor = color(bt.northValue);
          }
          if(avg.centralNum){
            bt.centralValue = parseInt(avg.centralSum/avg.centralNum);
            bt.centralColor = color(bt.centralValue);
          }
          if(avg.southNum){
            bt.southValue = parseInt(avg.southSum/avg.southNum);
            bt.southColor = color(bt.southValue);
          }
        }
        bt.style = {left:bt.x+'px'};
        if(m == 0) bt.style["border-left"] = "1px solid #c8c8c8";
        if(bt.northColor && bt.centralColor && bt.southColor){
          bt.style["background"] = "linear-gradient("+bt.northColor+","+bt.centralColor+","+bt.southColor+")";
        }
        this.timebar.push(bt);
      }
    },
    UpdateMap: function(){
      this.UpdateUrl();
      this.UpdateMapRain();
      this.UpdateMapWaterLevel();
      this.UpdateMapReservoir();
      this.UpdateMapFlood();
      this.UpdateMapAlert();
      this.UpdateMapTyphoon();
      this.mapControl.UpdateLineChart();
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
    GetDataAfterTime: function(data,time){
      var timeOffset = this.TimeToOffset(time);
      for(var i=timeOffset;i<24*6;i++){
        var t = this.OffsetToTime(i);
        var key = t+":00";
        if(key in data){
          return data[key];
        }
      }
      return null;
    },
    UpdateMapRain: function(){
      this.UpdateUrl();
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
      this.UpdateUrl();
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
      this.UpdateUrl();
      if(!this.mapControl) return;
      var hour = this.curTime.split(":")[0];
      var reservoirData = this.GetDataFromTime(this.reservoirData.data,hour+":00");
      if(!reservoirData || this.reservoirOption.show == false) return this.mapControl.ClearMapReservoir();
      this.mapControl.UpdateMapReservoir(reservoirData);
    },
    UpdateMapFlood: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      var floodData = this.GetDataFromTime(this.floodData.data,this.curTime);
      if(!floodData || this.floodOption.show == false) return this.mapControl.ClearMapFlood();
      this.mapControl.UpdateMapFlood(floodData);
    },
    UpdateMapAlert: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.ClearMapAlert();
      //console.log(this.alertData);
      var t = dayjs(this.curYear+"-"+this.curDate+" "+this.curTime);
      this.mapControl.UpdateMapAlert(this.alertData, t);
    },
    UpdateMapTyphoon: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      var hour = this.curTime.split(":")[0];
      var typhoonData = this.typhoonTrajectoryData[hour+":00:00"];
      if(!typhoonData){
        //颱風未靠近台灣時是6小時更新一次，這邊確認若颱風資料有持續更新，就拿前幾個小時的資料來顯示，避免颱風圖示一下消失一下出現
        var futureData = this.GetDataAfterTime(this.typhoonTrajectoryData,this.curTime);
        if(futureData) typhoonData = this.GetDataFromTime(this.typhoonTrajectoryData,this.curTime);
      }
      if(!typhoonData || this.typhoonTrajectoryOption.show == false) return this.mapControl.ClearMapTyphoon();
      this.mapControl.UpdateMapTyphoon(typhoonData);
    },
    ShowDateInfo: function(d){
      this.dateInfo.date = d.date;
      this.dateInfo.northValue = d.northValue;
      this.dateInfo.centerValue = d.centerValue;
      this.dateInfo.southValue = d.southValue;
      this.dateInfo.alert = d.alert || {};
      var container = $(".date-selection");
      var w = container.width();
      var h = container.height();
      var scroll = container.scrollTop();
      var css = {display:"block", top:"auto", bottom:"auto", left:"auto", right:"auto"};
      if(d.x < 0.5*w) css.left = d.x+20;
      else css.right = w-d.x;
      if(d.y-scroll < 0.5*h) css.top = d.y;
      else css.bottom = h-d.y-20;

      var floatWindow = $(".float-window");
      floatWindow.css(css);
    },
    HideDateInfo: function(){
      var floatWindow = $(".float-window");
      floatWindow.css({
        display: "none",
      });
    },
    ParseParameter: function(){
      var param = g_Util.GetUrlHash();
      if(param.year){
        this.curYear = parseInt(param.year);
      }
      if(param.date){
        this.curDate = param.date;
      }
      if(param.time){
        this.curTime = param.time;
      }
      if(param.lat){
        this.initLoc.lat = parseFloat(param.lat);
      }
      if(param.lng){
        this.initLoc.lng = parseFloat(param.lng);
      }
      if(param.zoom){
        this.initLoc.zoom = parseInt(param.zoom);
      }
      if(param.option){
        this.DecodeOptionString(param.option);
      }
    },
    UpdateUrl: function(){
      if(!this.mapControl) return;
      var loc = this.mapControl.GetLocation();
      if(!loc) return;
      var hash = "year="+this.curYear;
      hash += "&date="+this.curDate;
      hash += "&time="+this.curTime;
      hash += "&lat="+loc.lat.toFixed(6);
      hash += "&lng="+loc.lng.toFixed(6);
      hash += "&zoom="+loc.zoom;
      hash += "&option="+this.EncodeOptionString();
      location.hash = hash;
    },
    EncodeOptionString: function(){
      function OpValueToIndex(opArr, value){
        var index = 0;
        for(var i=0;i<opArr.length;i++){
          var op = opArr[i];
          if(value == op.value){
            index = i&15;
          }
        }
        return index;
      }
      var rainOpacity = Math.round(this.rainOption.opacity/0.1) & 255;
      var rainScale = Math.round(this.rainOption.scale/0.1) & 255;
      var rainShow = (this.rainOption.show?1:0) & 1;
      var rainType = OpValueToIndex(this.opRainType,this.rainOption.type);
      var rainEncode = rainType + (rainShow<<4) + (rainScale<<5) + (rainOpacity<<13);
      rainEncode = g_Util.PadLeft(rainEncode.toString(16),8);

      var waterLevelOpacity = Math.round(this.waterLevelOption.opacity/0.1) & 255;
      var waterLevelScale = Math.round(this.waterLevelOption.scale/0.1) & 255;
      var waterLevelShow = (this.waterLevelOption.show?1:0) & 1;
      var waterLevelThresh = this.waterLevelOption.thresh & 255;
      var waterLevelEncode = waterLevelThresh + (waterLevelShow<<8) + (waterLevelScale<<9) + (waterLevelOpacity<<17);
      waterLevelEncode = g_Util.PadLeft(waterLevelEncode.toString(16),8);

      var reservoirOpacity = Math.round(this.reservoirOption.opacity/0.1) & 255;
      var reservoirScale = Math.round(this.reservoirOption.scale/0.1) & 255;
      var reservoirShow = (this.reservoirOption.show?1:0) & 1;
      var reservoirEncode = reservoirShow + (reservoirScale<<1) + (reservoirOpacity<<9);
      reservoirEncode = g_Util.PadLeft(reservoirEncode.toString(16),8);

      var floodOpacity = Math.round(this.floodOption.opacity/0.1) & 255;
      var floodScale = Math.round(this.floodOption.scale/0.1) & 255;
      var floodShow = (this.floodOption.show?1:0) & 1;
      var floodEncode = floodShow + (floodScale<<1) + (floodOpacity<<9);
      floodEncode = g_Util.PadLeft(floodEncode.toString(16),8);

      var typhoonOpacity = Math.round(this.typhoonTrajectoryOption.opacity/0.1) & 255;
      var typhoonShow = (this.typhoonTrajectoryOption.show?1:0) & 1;
      var typhoonEncode = typhoonShow + (typhoonOpacity<<1);
      typhoonEncode = g_Util.PadLeft(typhoonEncode.toString(16),8);

      var alertCertainty = OpValueToIndex(this.opAlertCertainty,this.alertOption.certainty);
      var alertSeverity = OpValueToIndex(this.opAlertSeverity,this.alertOption.severity);
      var alertOpacity = Math.round(this.alertOption.opacity/0.1) & 255;
      var alertShowRainFall = (this.alertOption.showRainFall?1:0) & 1;
      var alertShowFlow = (this.alertOption.showFlow?1:0) & 1;
      var alertShowReservoirDis = (this.alertOption.showReservoirDis?1:0) & 1;
      var alertShowHighWater = (this.alertOption.showHighWater?1:0) & 1;
      var alertShowWater = (this.alertOption.showWater?1:0) & 1;
      var alertShowDebrisFlow = (this.alertOption.showDebrisFlow?1:0) & 1;
      var alertShowThunderstorm = (this.alertOption.showThunderstorm?1:0) & 1;
      var alertShowTyphoon = (this.alertOption.showTyphoon?1:0) & 1;
      var alertEncode = alertShowTyphoon+(alertShowThunderstorm<<1)+(alertShowDebrisFlow<<2)
          +(alertShowWater<<3)+(alertShowHighWater<<4)+(alertShowReservoirDis<<5)
          +(alertShowFlow<<6)+(alertShowRainFall<<7)+(alertOpacity<<8)
          +(alertSeverity<<16)+(alertCertainty<<20);
      alertEncode = g_Util.PadLeft(alertEncode.toString(16),8);

      var mapType = OpValueToIndex(this.opMapType,this.mapOption.mapType);
      var mapPlaySpeed = this.mapOption.playSpeed & 255;
      var mapUseSatellite = (this.mapOption.useSatellite?1:0) & 1;
      var mapEncode = mapUseSatellite+(mapPlaySpeed<<1)+(mapType<<9);
      mapEncode = g_Util.PadLeft(mapEncode.toString(16),8);

      var waterUseEncode = this.waterUse.EncodeOptionString();

      return rainEncode+waterLevelEncode+reservoirEncode+floodEncode
          +typhoonEncode+alertEncode+mapEncode+waterUseEncode;
      
    },
    DecodeOptionString: function(option){
      var rainEncode = option.substr(0,8);
      rainEncode = parseInt(rainEncode,16);
      var rainType = rainEncode & 15;
      var rainShow = (rainEncode>>4) & 1;
      var rainScale = (rainEncode>>5) & 255;
      var rainOpacity = (rainEncode>>13) & 255;
      this.rainOption.type = this.opRainType[rainType].value;
      this.rainOption.show = rainShow==1?true:false;
      this.rainOption.scale = rainScale*0.1;
      this.rainOption.opacity = rainOpacity*0.1;

      var waterLevelEncode = option.substr(8,8);
      waterLevelEncode = parseInt(waterLevelEncode,16);
      var waterLevelThresh = waterLevelEncode & 255;
      var waterLevelShow = (waterLevelEncode>>8) & 1;
      var waterLevelScale = (waterLevelEncode>>9) & 255;
      var waterLevelOpacity = (waterLevelEncode>>17) & 255;
      this.waterLevelOption.thresh = waterLevelThresh;
      this.waterLevelOption.show = waterLevelShow==1?true:false;
      this.waterLevelOption.scale = waterLevelScale*0.1;
      this.waterLevelOption.opacity = waterLevelOpacity*0.1;

      var reservoirEncode = option.substr(16,8);
      reservoirEncode = parseInt(reservoirEncode,16);
      var reservoirShow = reservoirEncode & 1;
      var reservoirScale = (reservoirEncode>>1) & 255;
      var reservoirOpacity = (reservoirEncode>>9) & 255;
      this.reservoirOption.show = reservoirShow==1?true:false;
      this.reservoirOption.scale = reservoirScale*0.1;
      this.reservoirOption.opacity = reservoirOpacity*0.1;

      var floodEncode = option.substr(24,8);
      floodEncode = parseInt(floodEncode,16);
      var floodShow = floodEncode & 1;
      var floodScale = (floodEncode>>1) & 255;
      var floodOpacity = (floodEncode>>9) & 255;
      this.floodOption.show = floodShow==1?true:false;
      this.floodOption.scale = floodScale*0.1;
      this.floodOption.opacity = floodOpacity*0.1;

      var typhoonEncode = option.substr(32,8);
      typhoonEncode = parseInt(typhoonEncode,16);
      var typhoonShow = typhoonEncode & 1;
      var typhoonOpacity = (typhoonEncode>>1) & 255;
      this.typhoonTrajectoryOption.show = typhoonShow==1?true:false;
      this.typhoonTrajectoryOption.opacity = typhoonOpacity*0.1;

      var alertEncode = option.substr(40,8);
      alertEncode = parseInt(alertEncode,16);
      var alertShowTyphoon = alertEncode & 1;
      var alertShowThunderstorm = (alertEncode>>1) & 1;
      var alertShowDebrisFlow = (alertEncode>>2) & 1;
      var alertShowWater = (alertEncode>>3) & 1;
      var alertShowHighWater = (alertEncode>>4) & 1;
      var alertShowReservoirDis = (alertEncode>>5) & 1;
      var alertShowFlow = (alertEncode>>6) & 1;
      var alertShowRainFall = (alertEncode>>7) & 1;
      var alertOpacity = (alertEncode>>8) & 255;
      var alertSeverity = (alertEncode>>16) & 15;
      var alertCertainty = (alertEncode>>20) & 15;
      this.alertOption.showTyphoon = alertShowTyphoon;
      this.alertOption.showThunderstorm = alertShowThunderstorm;
      this.alertOption.showDebrisFlow = alertShowDebrisFlow;
      this.alertOption.showWater = alertShowWater;
      this.alertOption.showHighWater = alertShowHighWater;
      this.alertOption.showReservoirDis = alertShowReservoirDis;
      this.alertOption.showFlow = alertShowFlow;
      this.alertOption.showRainFall = alertShowRainFall;
      this.alertOption.opacity = alertOpacity*0.1;
      this.alertOption.severity = this.opAlertSeverity[alertSeverity].value;
      this.alertOption.certainty = this.opAlertCertainty[alertCertainty].value;

      var mapEncode = option.substr(48,8);
      mapEncode = parseInt(mapEncode,16);
      var mapUseSatellite = mapEncode & 1;
      var mapPlaySpeed = (mapEncode>>1) & 255;
      var mapType = (mapEncode>>9) & 15;
      this.mapOption.useSatellite = mapUseSatellite==1?true:false;
      this.mapOption.playSpeed = mapPlaySpeed;
      this.mapOption.mapType = this.opMapType[mapType].value;

      var waterUseEncode = option.substr(56,11);
      this.waterUse.DecodeOptionString(waterUseEncode);
    },
    CopySpaceTimeUrl: function(){
      var url = $("link[rel='canonical']").attr("href");
      url += "#year="+this.curYear;
      url += "&date="+this.curDate;
      url += "&time="+this.curTime;

      var loc = this.mapControl.GetLocation();
      url += "&lat="+loc.lat;
      url += "&lng="+loc.lng;
      url += "&zoom="+loc.zoom;

      var aux = document.createElement("input");
      aux.setAttribute("value", url);
      document.body.appendChild(aux);
      aux.select();
      document.execCommand("copy");

      document.body.removeChild(aux);
      alert("已複製目前時間地點的網址至剪貼簿");
    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  g_APP.UpdateMapType();
});