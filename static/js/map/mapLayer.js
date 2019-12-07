
class MapLayer{
    constructor(option){
      this.siteUrl = option.siteUrl;
      this.dataUrl = option.dataUrl;
      this.gridUrl = option.gridUrl;
      this.divideLatLng = option.divideLatLng;
      this.divideStep = option.divideStep || 5;

      this.map = option.map;
      this.layer = {};
      this.infoWindow = new google.maps.InfoWindow();
      this.infoTarget = {};
      this.date = "";
      this.data = {site:{},data:{},daily:{}};

      if(this.gridUrl){
        this.levelNum = option.levelNum || 3;
        this.gridPerUnit = option.gridPerUnit || 10;
        this.level = this.GetLevel();
        this.grid = [];
        for(var i=0;i<this.levelNum;i++){
            this.grid.push({});
        }
      }

      this.siteKey = option.siteKey || "siteID";
      this.dataSiteKey = option.dataSiteKey || "siteID";
      this.timeKey = option.timeKey || "time";
      this.gridTimeKey = option.gridTimeKey || "t";
      this.LoadSite();
    }

    ChangeDate(date){
      this.ClearData();
      this.date = date;
      this.Update();
    }

    GetLevel(){
      if(!this.gridUrl) return -1;
      if(!this.map) return this.levelNum-1;
      var zoom = this.map.getZoom();
      var level = 7+this.levelNum-zoom;
      if(level >= this.levelNum) level = this.levelNum-1;
      if(level < 0) level = -1;
      return level;
    }

    GetBaseScale(){
      var zoom = this.map.getZoom();
      return 1*Math.pow(1.7,10-zoom);
    }

    Update(){
      if(!this.map) return;
      this.ClearMap();
      this.level = this.GetLevel();

      if(this.divideLatLng){
        var bound = this.map.getBounds();
        if(!bound) return;
        var minLat = bound.getSouthWest().lat();
        var minLng = bound.getSouthWest().lng();
        var maxLat = bound.getNorthEast().lat();
        var maxLng = bound.getNorthEast().lng(); 
        
        var step = this.level==-1?1:this.divideStep*Math.pow(2,this.level);
        minLat = Math.floor(minLat/step)*step;
        minLng = Math.floor(minLng/step)*step;
        maxLat = Math.ceil(maxLat/step)*step;
        maxLng = Math.ceil(maxLng/step)*step;

        for(var lat=minLat; lat<=maxLat; lat+=step){
          for(var lng=minLng; lng<=maxLng; lng+=step){
            if(this.level == -1){
              this.UpdateLayer(lat,lng,lat+step,lng+step);
            }
            else{
              this.UpdateGrid(lat,lng,lat+step,lng+step);
            }
          }
        }
      }
      else{
        if(this.level == -1){
          this.UpdateLayer();
        }
        else{
          this.UpdateGrid();
        }
      }
    }

    UpdateLayer(minLat,minLng,maxLat,maxLng){
      var param = {};
      param.date = this.date;
      param.level = this.level;
      var data = this.data.data;
      if(this.divideLatLng){
        param.minLat = minLat.toFixed(2);
        param.maxLat = maxLat.toFixed(2);
        param.minLng = minLng.toFixed(2);
        param.maxLng = maxLng.toFixed(2);

        var pos = param.minLat+"-"+param.minLng;
        if(pos in data){
          this.DrawLayer(data[pos]);
        }
        else this.LoadLayer(param);
      }
      else{
        var pos = "0-0";
        
        if(pos in data){
          this.DrawLayer(data[pos]);
        }
        else{
          this.LoadLayer(param);
        }
      }
      
    }

    UpdateGrid(minLat,minLng,maxLat,maxLng){
      if(!this.gridUrl) return;

      var param = {};
      param.date = this.date;
      param.level = this.level;
      var grid = this.grid[param.level];
      if(!grid) return;

      if(this.divideLatLng){
        param.minLat = minLat.toFixed(2);
        param.maxLat = maxLat.toFixed(2);
        param.minLng = minLng.toFixed(2);
        param.maxLng = maxLng.toFixed(2);

        var pos = param.minLat+"-"+param.minLng;
        if(pos in grid){
          this.DrawGrid(grid[pos]);
        }
        else this.LoadGrid(param);
      }
      else{
        var pos = "0-0";
        if(pos in grid){
          this.DrawGrid(grid[pos]);
        }
        else this.LoadGrid(param);
      }
      
    }

    GenClickFn(data,i,key){
      return function() {
        this.UpdateInfoWindow(data[i]);
        this.infoWindow.open(this.map);
        this.infoTarget = data[i][key];
      }.bind(this);
    }

    UpdateInfoWindow(d){
      
    }

    DrawLayer(data){
      
    }

    DrawGrid(data){

    }

    SetupTime(time){
      if(!time){
        time = "2019-1-1 00:00:00";
      }
      //var t = dayjs(time);
      //var m = t.minute()-t.minute()%10;
      //t = t.minute(m).second(0).format("HH:mm:ss");
      var t = new Date(time);
      var m = t.getMinutes();
      m = m-m%10;
      t = g_Util.PadLeft(t.getHours(),2)+":"+g_Util.PadLeft(m,2)+":00";
      return t;
    }

    LoadSite(){
      if(!this.siteUrl) return;
      $.get(this.siteUrl, function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        var siteHash = {};
        for(var i=0;i<result.data.length;i++){
          var key = result.data[i][this.siteKey];
          siteHash[key] = result.data[i];
        }
        this.data.site = siteHash;
      }.bind(this));
    }

    LoadLayer(param){
      if(!this.dataUrl || !this.date) return;
      var url = this.dataUrl;
      url += "?date="+this.date;
      if(this.divideLatLng){
        url += "&minLat="+param.minLat;
        url += "&minLng="+param.minLng;
        url += "&maxLat="+param.maxLat;
        url += "&maxLng="+param.maxLng;
      }
      //console.log(url);

      var data = this.data.data;
      var daily = this.data.daily;
      
      $.get(url, function(result){
        if(result.status != "ok") return;
        var pos = "";
        if(this.divideLatLng) pos = param.minLat+"-"+param.minLng;
        else pos = "0-0";
        if(!data[pos]) data[pos] = {};
        for(var i=0;i<result.data.length;i++){
          var d = result.data[i];
          var t = this.SetupTime(d[this.timeKey]);
          d[this.timeKey] = t;
          
          if(!data[pos][t]) data[pos][t] = [];
          data[pos][t].push(d);
          var s = d[this.dataSiteKey];
          if(!daily[s]) daily[s] = [];
          daily[s].push(d);
        }

        //expend data to later 10min
        if(param.expendData){
          var prev = {};
          for(var i=0;i<24*6;i++){
            var t = g_APP.OffsetToTime(i)+":00";
            if(!data[pos][t]) continue;
            var hasData = {};
            for(var j=0;j<data[pos][t].length;j++){
              var d = data[pos][t][j];
              if(d){
                prev[d[this.dataSiteKey]] = d;
                hasData[d[this.dataSiteKey]] = true;
              }
            }
            for(var key in prev){
              if(!hasData[key]){
                data[pos][t].push(prev[key]);
              }
            }
          }
        }
        
        this.DrawLayer(data[pos]);
      }.bind(this));
    }

    LoadGrid(param){
      if(!this.gridUrl || !this.date) return;

      var url = this.gridUrl;
      url += "?date="+this.date;
      url += "&level="+param.level;
      if(this.divideLatLng){
        url += "&minLat="+param.minLat;
        url += "&minLng="+param.minLng;
        url += "&maxLat="+param.maxLat;
        url += "&maxLng="+param.maxLng;
      }

      var grid = this.grid[parseInt(param.level)];
      if(!grid) return;
      
      $.get(url, function(result){
        if(result.status != "ok") return;
        var data = result.data.data;
        var pos = "";
        if(this.divideLatLng) pos = param.minLat+"-"+param.minLng;
        else pos = "0-0";
        if(!grid[pos]) grid[pos] = {};
        for(var i=0;i<data.length;i++){
          var d = data[i];
          var t = this.SetupTime(d[this.gridTimeKey]);
          d[this.gridTimeKey] = t;
          
          if(!grid[pos][t]) grid[pos][t] = [];
          grid[pos][t].push(d);
        }
        this.DrawGrid(grid[pos]);

      }.bind(this));
    }

    ClearMap(){
      for(var key in this.layer){
        this.layer[key].setMap(null);
      }
    }

    ClearData(){
      this.infoWindow.close();
      this.infoTarget = {};
      this.data.data = {};
      this.data.daily = {};
      if(this.gridUrl){
        for(var i=0;i<this.levelNum;i++){
          this.grid[i] = {};
        }
      }
    }

}
