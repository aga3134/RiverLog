var g_Env = new Vue({
  el: "#env",
  data: {
    timeStr: "",
    timebar: [],
    openDateSelect: false,
    openOption: false,
    openAbout: false,
    openLocation: false,
    openSponsor: false,
    yearArr: [],
    curYear: 2019,
    curDate: "1-1",
    curTime: "0:0",
    initLoc: {},
    dailySum: [],
    avgData: {dayAvg:{},timeAvg:{}},
    color: {},
    playTimer: null,
    playIcon: "/static/Image/icon-play.png",
    mapControl: null,
    waterboxOption:{collapse:false,opacity:0.8,scale:1},
    mapOption: {
      collapse:false,
      useSatellite: false,
      showBasin: true,
      playSpeed: 5,
    },
    url: "/env",
    opUrl: [
      {name: "水事件地圖", url:"/"},
      {name: "水環境地圖", url:"/env"},
      {name: "用水統計", url:"/waterUse"},
    ],
    searchBox: null,
    loading: true
  },
  created: function () {
    this.InitColor();
    this.mapControl = new MapControl();
    google.maps.event.addDomListener(window, 'load', this.InitMap);
    this.loading = false;
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
      
    },
    ChangeUrl: function(){
      window.location.href = this.url;
    },
    InitMap: function(){
      var param = {
        useSatellite: this.mapOption.useSatellite,
        initLoc: this.initLoc,
        succFunc: function(){
          this.searchBox = new google.maps.places.SearchBox(document.getElementById("placeSearch"));
          google.maps.event.addListener(this.searchBox, 'places_changed', this.SearchPlace);
          //this.ChangeYear(this.curYear);
          
        }.bind(this)
      };
      this.mapControl.InitMap(param);
    },
    SearchPlace: function() {
      var places = this.searchBox.getPlaces();
      if(places.length) {
        var loc = places[0].geometry.location;
        this.mapControl.map.setZoom(14);
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
        case "waterbox":
          this.waterboxOption.collapse = !this.waterboxOption.collapse;
          break;
      }
      this.UpdateUrl();
    },
    ChangeYear: function(year){
      this.curYear = year;
      $.get("/waterbox/dailySum?year="+year,function(result){
        if(result.status != "ok") return;
        this.avgData.dayAvg = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          var t = dayjs(d.time,{timeZone:"Asia/Taipei"});
          this.avgData.dayAvg[t.format("YYYY-MM-DD")] = d;
        }

        this.UpdateDailySum();
        Vue.nextTick(function(){
          this.ChangeDate(this.curDate);
        }.bind(this));
        
      }.bind(this));
    },
    PrevDay: function(){
      var t = dayjs(this.curYear+"-"+this.curDate);
      t = t.add(-1,"day");
      this.curDate = t.format("MM-DD");
      this.curTime = "00:00";
      var year = parseInt(t.format("YYYY"));
      if(year != this.curYear){
        this.ChangeYear(year);
      }
      else this.ChangeDate(this.curDate);
    },
    NextDay: function(){
      var t = dayjs(this.curYear+"-"+this.curDate);
      t = t.add(1,"day");
      this.curDate = t.format("MM-DD");
      this.curTime = "00:00";
      var year = parseInt(t.format("YYYY"));
      if(year != this.curYear){
        this.ChangeYear(year);
      }
      else this.ChangeDate(this.curDate);
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

      var url = "/waterbox/10minSum?date="+this.curYear+"-"+this.curDate;
      
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
      this.openSponsor = false;
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
        case "sponsor":
          this.openSponsor = true;
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
      this.UpdateMapWaterbox();
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
    UpdateMapWaterbox: function(){
      this.UpdateUrl();
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
      if(param.option && param.v){
        this.DecodeOptionString(param.option,param.v);
      }
    },
    UpdateUrl: function(){
      if(!this.mapControl) return;
      var loc = this.mapControl.GetLocation();
      if(!loc) return;
      var version = 2;
      var hash = "#year="+this.curYear;
      hash += "&date="+this.curDate;
      hash += "&time="+this.curTime;
      hash += "&lat="+loc.lat.toFixed(6);
      hash += "&lng="+loc.lng.toFixed(6);
      hash += "&zoom="+loc.zoom;
      hash += "&v="+version;
      hash += "&option="+this.EncodeOptionString();
      //location.hash = hash;
      history.replaceState(undefined, undefined, hash);
    },
    EncodeOptionString: function(){
      var arr = [];
      //waterbox option
      arr.push({value: (this.waterboxOption.collapse?1:0),bitNum: 1});
      arr.push({value: (this.waterboxOption.show?1:0),bitNum: 1});
      arr.push({value: Math.round(this.waterboxOption.opacity*10),bitNum: 8});
      arr.push({value: Math.round(this.waterboxOption.scale*10),bitNum: 8});

      return g_OptionCodec.Encode(arr);
    },
    DecodeOptionString: function(option,version){
      switch(version){
        case "1":
          var bitNumArr = this.GetBitNumV1();
          var valueArr = g_OptionCodec.Decode(option,bitNumArr);
          this.ApplyOptionV1(valueArr);
          break;
      }
    },
    GetBitNumV1: function(){
      var bitNumArr = [];
      //rain option
      bitNumArr.push({name:"waterboxCollapse",bitNum:1});
      bitNumArr.push({name:"waterboxShow",bitNum:1});
      bitNumArr.push({name:"waterboxOpacity",bitNum:8});
      bitNumArr.push({name:"waterboxScale",bitNum:8});

      return bitNumArr;
    },
    ApplyOptionV1: function(valueArr){
      this.waterboxOption.collapse = valueArr["waterboxCollapse"]==1?true:false;
      this.waterboxOption.show = valueArr["waterboxShow"]==1?true:false;
      this.waterboxOption.opacity = valueArr["waterboxOpacity"]*0.1;
      this.waterboxOption.scale = valueArr["waterboxScale"]*0.1;
    },
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  g_Env.UpdateMap();
});