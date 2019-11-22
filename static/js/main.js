var g_APP = new Vue({
  el: "#app",
  data: {
    timeStr: "",
    timebar: [],
    openDateSelect: false,
    openOption: false,
    openAbout: false,
    openLocation: false,
    yearArr: [],
    curYear: 2019,
    curDate: "1-1",
    curTime: "0:0",
    initLoc: {},
    dailySum: [],
    weekLabel: [],
    monthLabel: [],
    avgData: {dayAvg:{},timeAvg:{}},
    alertStatistic: {},
    color: {},
    playTimer: null,
    playIcon: "/static/Image/icon-play.png",
    mapControl: null,
    rainOption: {collapse:false,opacity:0.8, scale:1, show:true, type:"daily"},
    waterLevelOption: {
      collapse:false,
      opacity:0.5,
      scale:1,
      showRiver:true,
      showDrain:true,
      showAgri:true,
      showSewer:true,
      thresh: 10
    },
    reservoirOption: {collapse:false,opacity:0.5, scale:1, show:true},
    floodOption: {collapse:false,opacity:0.5, scale:1, show:true, thresh:10},
    typhoonTrajectoryOption:{collapse:false,opacity:0.3, show:true},
    alertOption: {
      collapse:false,
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
    elevOption:{collapse:false,opacity:0.6, show:false, minElev:0, maxElev:100},
    mapOption: {
      collapse:false,
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
    ],
    searchBox: null
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

    this.mapControl = new MapControl();
    this.waterUse = new WaterUseStatistic();

    this.ParseParameter();

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

      this.color.elevDomain = [0,1];
      this.color.elevRange = ["#8FD2FF","#00426E"];
      this.color.elev = d3.scale.linear()
        .domain(this.color.elevDomain)
        .range(this.color.elevRange);
    },
    InitMap: function(){
      if(this.mapControl){
        var param = {
          useSatellite: this.mapOption.useSatellite,
          initLoc: this.initLoc,
          succFunc: function(){
            this.ChangeYear(this.curYear);
            this.searchBox = new google.maps.places.SearchBox(document.getElementById("placeSearch"));
            google.maps.event.addListener(this.searchBox, 'places_changed', this.SearchPlace);
          }.bind(this)
        };
        this.mapControl.InitMap(param);
      }
      if(this.waterUse){
        this.waterUse.InitMap();
      }
    },
    SearchPlace: function() {
      var places = this.searchBox.getPlaces();
      if(places.length) {
        var loc = places[0].geometry.location;
        this.mapControl.map.setZoom(12);
        this.mapControl.map.panTo({lat: loc.lat(), lng:loc.lng()});
        this.UpdateMap();
      }
    },
    GoToMyLocation: function(){
      //取得gps權限
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
          var coord = position.coords;
          this.mapControl.map.setZoom(12);
          this.mapControl.map.panTo({lat: coord.latitude, lng:coord.longitude});
          this.UpdateMap();
        }.bind(this), function(err){
          alert("讀取GPS失敗");
        }.bind(this));
      }
      else {
        alert("瀏覽器不支援GPS");
      }
    },
    ToggleSatellite: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.ToggleSatellite(this.mapOption.useSatellite);
    },
    ToggleCollapse: function(type){
      switch(type){
        case "rain":
          this.rainOption.collapse = !this.rainOption.collapse;
          break;
        case "waterLevel":
          this.waterLevelOption.collapse = !this.waterLevelOption.collapse;
          break;
        case "reservoir":
          this.reservoirOption.collapse = !this.reservoirOption.collapse;
          break;
        case "flood":
          this.floodOption.collapse = !this.floodOption.collapse;
          break;
        case "typhoon":
          this.typhoonTrajectoryOption.collapse = !this.typhoonTrajectoryOption.collapse;
          break;
        case "alert":
          this.alertOption.collapse = !this.alertOption.collapse;
          break;
        case "elev":
          this.elevOption.collapse = !this.elevOption.collapse;
          break;
        case "map":
          this.mapOption.collapse = !this.mapOption.collapse;
          break;
      }
      this.UpdateUrl();
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
        this.avgData.dayAvg = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          var t = dayjs(d.time,{timeZone:"Asia/Taipei"});
          this.avgData.dayAvg[t.format("YYYY-MM-DD")] = d;
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
        this.avgData.timeAvg = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          var t = dayjs(d.time,{timeZone:"Asia/Taipei"});
          this.avgData.timeAvg[t.format("HH:mm:ss")] = d;
        }
        //console.log(this["rainData"].timeAvg);
        this.UpdateTimebar();
        this.ChangeTime(this.curTime);
        this.mapControl.ChangeDate();


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
      this.openLocation = false;
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
        case "location":
          this.openLocation = true;
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

        var avg = this.avgData.dayAvg[t];
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

        var avg = this.avgData.timeAvg[t+":00"];
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
      this.UpdateMapWaterLevel();
      this.UpdateMapReservoir();
      this.UpdateMapFlood();
      this.UpdateMapAlert();
      this.UpdateMapTyphoon();
      this.UpdateMapElev();
      this.UpdateMapRain();
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
      this.mapControl.UpdateMapRain();
    },
    UpdateMapWaterLevel: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.UpdateMapWaterLevel();
    },
    UpdateMapReservoir: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.UpdateMapReservoir();
    },
    UpdateMapFlood: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.UpdateMapFlood();
    },
    UpdateMapAlert: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.UpdateMapAlert();
    },
    UpdateMapTyphoon: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.UpdateMapTyphoon();
    },
    UpdateMapElev: function(){
      this.UpdateUrl();
      if(!this.mapControl) return;
      this.mapControl.UpdateMapElev();
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
    OpValueToIndex: function(opArr, value){
      for(var i=0;i<opArr.length;i++){
        var op = opArr[i];
        if(value == op.value){
          return i;
        }
      }
      return 0;
    },
    EncodeOptionString: function(){

      function NumberToChar(number){  //5bit number only
        var chArr = [];
        for(var i=0;i<10;i++){  //0~10
          var ch = String.fromCharCode(48+i);
          chArr.push(ch);
        }
        for(var i=10;i<32;i++){  //a~z
          var ch = String.fromCharCode(97+i-10);
          chArr.push(ch);
        }
        if(number < 0 || number >= chArr.length) return "";
        else return chArr[number];
      }

      function ValueArrToString(arr){
        var str = "";
        var encodeBit = 5;
        var bitValue = 0, bitPos = 0;
        //console.log("======================");
        for(var i=0;i<arr.length;i++){
          var value = arr[i].value;
          var bitNum = arr[i].bitNum;
          //console.log("value:"+value+" bitNum:"+bitNum);
          var bitMask = (1<<bitNum)-1;
          value = value & bitMask;
          while(bitNum > 0){
            //console.log("init bit:"+bitNum);
            if(bitPos + bitNum >= encodeBit){ //bit數已滿，輸出新字元後buffer歸零
              var useBit = encodeBit-bitPos;
              //console.log("use bit: "+useBit);
              var useMask = (1<<useBit)-1;
              var useValue = (value & useMask)<<bitPos;
              var encodeValue = bitValue + useValue;
              str = NumberToChar(encodeValue)+str;
              value = value >> useBit;
              bitNum -= useBit;
              //console.log("str: "+str);
              //console.log("remain bit:"+bitNum);
              //console.log("remain value:"+value);
              bitValue = 0;
              bitPos = 0;
            }
            else{ //bit數未滿，更新buffer
              //console.log("residual bit:"+bitNum);
              var useMask = (1<<bitNum)-1;
              var useValue = (value & useMask)<<bitPos;
              bitValue += useValue;
              bitPos += bitNum;
              bitNum = 0;
              //console.log("residual value:"+bitValue);
              //console.log("residual pos:"+bitPos);
            }
            
          }
        }
        if(bitPos > 0){
          str = NumberToChar(bitValue)+str;
        }
        return str;
      }

      /*
      //test: should be 1og
      var arr = [
        {value: 16, bitNum:8},
        {value: 1, bitNum:1},
        {value: 3, bitNum:4},
      ];
      console.log(ValueArrToString(arr));*/

      var arr = [];
      //rain option
      arr.push({value: (this.rainOption.collapse?1:0),bitNum: 1});
      arr.push({value: Math.round(this.rainOption.opacity*10),bitNum: 8});
      arr.push({value: Math.round(this.rainOption.scale*10),bitNum: 8});
      arr.push({value: (this.rainOption.show?1:0),bitNum: 1});
      arr.push({value: this.OpValueToIndex(this.opRainType,this.rainOption.type),bitNum: 4});
      
      //water level option
      arr.push({value: (this.waterLevelOption.collapse?1:0),bitNum: 1});
      arr.push({value: Math.round(this.waterLevelOption.opacity*10),bitNum: 8});
      arr.push({value: Math.round(this.waterLevelOption.scale*10),bitNum: 8});
      arr.push({value: (this.waterLevelOption.showRiver?1:0),bitNum: 1});
      arr.push({value: (this.waterLevelOption.showDrain?1:0),bitNum: 1});
      arr.push({value: (this.waterLevelOption.showAgri?1:0),bitNum: 1});
      arr.push({value: (this.waterLevelOption.showSewer?1:0),bitNum: 1});
      arr.push({value: this.waterLevelOption.thresh,bitNum: 8});

      //reservoir option
      arr.push({value: (this.reservoirOption.collapse?1:0),bitNum: 1});
      arr.push({value: Math.round(this.reservoirOption.opacity*10),bitNum: 8});
      arr.push({value: Math.round(this.reservoirOption.scale*10),bitNum: 8});
      arr.push({value: (this.reservoirOption.show?1:0),bitNum: 1});

      //flood option
      arr.push({value: (this.floodOption.collapse?1:0),bitNum: 1});
      arr.push({value: Math.round(this.floodOption.opacity*10),bitNum: 8});
      arr.push({value: Math.round(this.floodOption.scale*10),bitNum: 8});
      arr.push({value: (this.floodOption.show?1:0),bitNum: 1});
      arr.push({value: this.floodOption.thresh,bitNum: 8});

      //typhoon option
      arr.push({value: (this.typhoonTrajectoryOption.collapse?1:0),bitNum: 1});
      arr.push({value: Math.round(this.typhoonTrajectoryOption.opacity*10),bitNum: 8});
      arr.push({value: (this.typhoonTrajectoryOption.show?1:0),bitNum: 1});

      //alert option
      arr.push({value: (this.alertOption.collapse?1:0),bitNum: 1});
      arr.push({value: this.OpValueToIndex(this.opAlertCertainty,this.alertOption.certainty),bitNum: 4});
      arr.push({value: this.OpValueToIndex(this.opAlertSeverity,this.alertOption.severity),bitNum: 4});
      arr.push({value: Math.round(this.alertOption.opacity*10),bitNum: 8});
      arr.push({value: (this.alertOption.showRainFall?1:0),bitNum: 1});
      arr.push({value: (this.alertOption.showFlow?1:0),bitNum: 1});
      arr.push({value: (this.alertOption.showReservoirDis?1:0),bitNum: 1});
      arr.push({value: (this.alertOption.showHighWater?1:0),bitNum: 1});
      arr.push({value: (this.alertOption.showWater?1:0),bitNum: 1});
      arr.push({value: (this.alertOption.showDebrisFlow?1:0),bitNum: 1});
      arr.push({value: (this.alertOption.showThunderstorm?1:0),bitNum: 1});
      arr.push({value: (this.alertOption.showTyphoon?1:0),bitNum: 1});

      //elevation option
      arr.push({value: (this.elevOption.collapse?1:0),bitNum: 1});
      arr.push({value: (this.elevOption.show?1:0),bitNum: 1});
      arr.push({value: Math.round(this.elevOption.opacity*10),bitNum: 8});
      arr.push({value: this.elevOption.minElev,bitNum: 12});
      arr.push({value: this.elevOption.maxElev,bitNum: 12});

      //map option
      arr.push({value: (this.mapOption.collapse?1:0),bitNum: 1});
      arr.push({value: this.OpValueToIndex(this.opMapType,this.mapOption.mapType),bitNum: 4});
      arr.push({value: this.mapOption.playSpeed,bitNum: 8});
      arr.push({value: (this.mapOption.useSatellite?1:0),bitNum: 1});
      
      var waterUseArr = this.waterUse.GetEncodeOptionArr();

      arr = arr.concat(waterUseArr);
      return ValueArrToString(arr);
    },
    DecodeOptionString: function(option){
      function CharToBit(ch,encodeBit){
        var code = ch.charCodeAt(0);
        var value = 0;
        if(code >= 48 && code < 58) value = code-48;
        else if(code >= 97 && code < 97+26) value = code+10-97;
        return g_Util.PadLeft(value.toString(2),encodeBit);
      }

      function StringToValueArr(str,bitNumArr){
        var encodeBit = 5;
        //console.log("str: "+str);
        var valueHash = {};
        var bitArr = "";
        for(var i=str.length-1;i>=0;i--){
          var ch = str[i];
          bitArr = CharToBit(ch,encodeBit)+bitArr;
        }
        //console.log("bitArr: "+bitArr);
        var index = bitArr.length-1;
        for(var i=0;i<bitNumArr.length;i++){
          var bitNum = bitNumArr[i].bitNum;
          var valueName = bitNumArr[i].name;
          var binaryValue = bitArr.substr(index-bitNum+1,index);
          //console.log("binary value:"+binaryValue);
          var value = 0;
          for(var j=0;j<bitNum;j++){
            value = (value<<1)+parseInt(binaryValue[j]);
          }
          valueHash[valueName] = value;
          index-=bitNum;
        }
        return valueHash;
      }
      /*//test, should be {test1:16,test2:1,test3:3}
      var str = "1og";
      var bitNumArr = [
        {name:"test1",bitNum:8},
        {name:"test2",bitNum:1},
        {name:"test3",bitNum:4}
      ];
      console.log(StringToValueArr(str,bitNumArr));*/

      var bitNumArr = [];
      //rain option
      bitNumArr.push({name:"rainCollapse",bitNum:1});
      bitNumArr.push({name:"rainOpacity",bitNum:8});
      bitNumArr.push({name:"rainScale",bitNum:8});
      bitNumArr.push({name:"rainShow",bitNum:1});
      bitNumArr.push({"name":"rainType",bitNum:4});

      //water level option
      bitNumArr.push({name:"waterLevelCollapse",bitNum:1});
      bitNumArr.push({name:"waterLevelOpacity",bitNum:8});
      bitNumArr.push({name:"waterLevelScale",bitNum:8});
      bitNumArr.push({name:"waterLevelShowRiver",bitNum:1});
      bitNumArr.push({name:"waterLevelShowDrain",bitNum:1});
      bitNumArr.push({name:"waterLevelShowAgri",bitNum:1});
      bitNumArr.push({name:"waterLevelShowSewer",bitNum:1});
      bitNumArr.push({name:"waterLevelThresh",bitNum:8});

      //reservoir option
      bitNumArr.push({name:"reservoirCollapse",bitNum:1});
      bitNumArr.push({name:"reservoirOpacity",bitNum:8});
      bitNumArr.push({name:"reservoirScale",bitNum:8});
      bitNumArr.push({name:"reservoirShow",bitNum:1});

      //flood option
      bitNumArr.push({name:"floodCollapse",bitNum:1});
      bitNumArr.push({name:"floodOpacity",bitNum:8});
      bitNumArr.push({name:"floodScale",bitNum:8});
      bitNumArr.push({name:"floodShow",bitNum:1});
      bitNumArr.push({name:"floodThresh",bitNum:8});

      //typhoon option
      bitNumArr.push({name:"typhoonCollapse",bitNum:1});
      bitNumArr.push({name:"typhoonOpacity",bitNum:8});
      bitNumArr.push({name:"typhoonShow",bitNum:1});

      //alert option
      bitNumArr.push({name:"alertCollapse",bitNum:1});
      bitNumArr.push({name:"alertCertainty",bitNum:4});
      bitNumArr.push({name:"alertSeverity",bitNum:4});
      bitNumArr.push({name:"alertOpacity",bitNum:8});
      bitNumArr.push({name:"alertShowRainFall",bitNum:1});
      bitNumArr.push({name:"alertShowFlow",bitNum:1});
      bitNumArr.push({name:"alertShowReservoirDis",bitNum:1});
      bitNumArr.push({name:"alertShowHighWater",bitNum:1});
      bitNumArr.push({name:"alertShowWater",bitNum:1});
      bitNumArr.push({name:"alertShowDebrisFlow",bitNum:1});
      bitNumArr.push({name:"alertShowThunderstorm",bitNum:1});
      bitNumArr.push({name:"alertShowTyphoon",bitNum:1});

      //elevation option
      bitNumArr.push({name:"elevCollapse",bitNum:1});
      bitNumArr.push({name:"elevShow",bitNum:1});
      bitNumArr.push({name:"elevOpacity",bitNum:8});
      bitNumArr.push({name:"elevMin",bitNum:12});
      bitNumArr.push({name:"elevMax",bitNum:12});

      //map option
      bitNumArr.push({name:"mapCollapse",bitNum:1});
      bitNumArr.push({name:"mapType",bitNum:4});
      bitNumArr.push({name:"mapPlaySpeed",bitNum:8});
      bitNumArr.push({name:"mapUseSatellite",bitNum:1});

      var waterUseArr = this.waterUse.GetBitNumArr();
      bitNumArr = bitNumArr.concat(waterUseArr);

      var valueArr = StringToValueArr(option,bitNumArr);
      //console.log(valueArr);

      this.rainOption.collapse = valueArr["rainCollapse"]==1?true:false;
      this.rainOption.opacity = valueArr["rainOpacity"]*0.1;
      this.rainOption.scale = valueArr["rainScale"]*0.1;
      this.rainOption.show = valueArr["rainShow"]==1?true:false;
      this.rainOption.type = this.opRainType[valueArr["rainType"]].value;

      this.waterLevelOption.collapse = valueArr["waterLevelCollapse"]==1?true:false;
      this.waterLevelOption.opacity = valueArr["waterLevelOpacity"]*0.1;
      this.waterLevelOption.scale = valueArr["waterLevelScale"]*0.1;
      this.waterLevelOption.showRiver = valueArr["waterLevelShowRiver"]==1?true:false;
      this.waterLevelOption.showDrain = valueArr["waterLevelShowDrain"]==1?true:false;
      this.waterLevelOption.showAgri = valueArr["waterLevelShowAgri"]==1?true:false;
      this.waterLevelOption.showSewer = valueArr["waterLevelShowSewer"]==1?true:false;
      this.waterLevelOption.thresh = valueArr["waterLevelThresh"];

      this.reservoirOption.collapse = valueArr["reservoirCollapse"]==1?true:false;
      this.reservoirOption.opacity = valueArr["reservoirOpacity"]*0.1;
      this.reservoirOption.scale = valueArr["reservoirScale"]*0.1;
      this.reservoirOption.show = valueArr["reservoirShow"]==1?true:false;

      this.floodOption.collapse = valueArr["floodCollapse"]==1?true:false;
      this.floodOption.opacity = valueArr["floodOpacity"]*0.1;
      this.floodOption.scale = valueArr["floodScale"]*0.1;
      this.floodOption.show = valueArr["floodShow"]==1?true:false;
      this.floodOption.thresh = valueArr["floodThresh"];

      this.typhoonTrajectoryOption.collapse = valueArr["typhoonCollapse"]==1?true:false;
      this.typhoonTrajectoryOption.opacity = valueArr["typhoonOpacity"]*0.1;
      this.typhoonTrajectoryOption.show = valueArr["floodShow"]==1?true:false;

      this.alertOption.collapse = valueArr["alertCollapse"]==1?true:false;
      this.alertOption.certainty = this.opAlertCertainty[valueArr["alertCertainty"]].value;
      this.alertOption.severity = this.opAlertSeverity[valueArr["alertSeverity"]].value;
      this.alertOption.opacity = valueArr["alertOpacity"]*0.1;
      this.alertOption.showRainFall = valueArr["alertShowRainFall"]==1?true:false;
      this.alertOption.showFlow = valueArr["alertShowFlow"]==1?true:false;
      this.alertOption.showReservoirDis = valueArr["alertShowReservoirDis"]==1?true:false;
      this.alertOption.showHighWater = valueArr["alertShowHighWater"]==1?true:false;
      this.alertOption.showWater = valueArr["alertShowWater"]==1?true:false;
      this.alertOption.showDebrisFlow = valueArr["alertShowDebrisFlow"]==1?true:false;
      this.alertOption.showThunderstorm = valueArr["alertShowThunderstorm"]==1?true:false;
      this.alertOption.showTyphoon = valueArr["alertShowTyphoon"]==1?true:false;

      this.elevOption.collapse = valueArr["elevCollapse"]==1?true:false;
      this.elevOption.show = valueArr["elevShow"]==1?true:false;
      this.elevOption.opacity = valueArr["elevOpacity"]*0.1;
      this.elevOption.minElev = valueArr["elevMin"];
      this.elevOption.maxElev = valueArr["elevMax"];

      this.mapOption.collapse = valueArr["mapCollapse"]==1?true:false;
      this.mapOption.mapType = this.opMapType[valueArr["mapType"]].value;
      this.mapOption.playSpeed = valueArr["mapPlaySpeed"];
      this.mapOption.useSatellite = valueArr["mapUseSatellite"]==1?true:false;

      this.waterUse.RestoreOption(valueArr);
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