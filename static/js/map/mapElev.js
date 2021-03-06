
class MapElev extends MapLayer{
	constructor(option){
		if(option.divideLatLng == null) option.divideLatLng = true;
		if(option.gridPerUnit == null) option.gridPerUnit = 1000;
		if(option.levelNum == null) option.levelNum = 8;
		if(option.divideStep == null) option.divideStep = 0.01;
		super(option);
	}

	LoadGrid(param){
		if(!this.map) return;
		if(!g_APP.elevOption.show) return;
		MapLayer.prototype.LoadGrid.call(this,param);
	}

    GetLevel(){
      if(!this.map) return this.levelNum-1;
      var zoom = this.map.getZoom();
      var level = 6+this.levelNum-zoom;
      if(level >= this.levelNum) level = this.levelNum-1;
      if(level < 0) level = 0;
      return level;
    }

	UpdateInfoWindow(d){
		var str = "";
		var loc = null;
        var scale = Math.pow(2,this.level)/this.gridPerUnit;
        var lat = d.y*scale;
        var lng = d.x*scale;
		var elev = d.elevSum/d.num;
		str = "<p>高程資料</p>";
		str += "<p>平均高程 "+elev.toFixed(2)+" m</p>";
		loc = new google.maps.LatLng(lat,lng);
		this.infoWindow.setOptions({content: str, position: loc});
	}
	
	DrawGrid(data){
		if(!this.map) return;
		if(!data || !g_APP.elevOption.show) return;

		var elevData = data["00:00:00"];
		if(!elevData) return;
		var bound = this.map.getBounds();
		for(var i=0;i<elevData.length;i++){
			var d = elevData[i];
			var map = this.map;
			if(!d.num) continue;

			var scale = Math.pow(2,this.level)/this.gridPerUnit;
	        var lat = d.y*scale;
	        var lng = d.x*scale;
	        if(!bound.contains({lat:lat,lng:lng})) continue;

			var value = d.elevSum/d.num;
	        value = (value-g_APP.elevOption.minElev)/(g_APP.elevOption.maxElev-g_APP.elevOption.minElev);
	        if(value <= 0 || value > 1) map = null;

			var key = d.x+"-"+d.y;
			//info window有打開，更新資訊
			if(this.map && this.infoTarget == key){
				this.UpdateInfoWindow(d);
			}
			
	        
			var clickFn = this.GenClickFn(elevData,i,key);
			if(this.layer[key]){
				var rect = this.layer[key];
				rect.setOptions({
					map: map,
					fillColor: g_APP.color.elev(value),
					fillOpacity: g_APP.elevOption.opacity,
				});
			}
			else{
				var rect = new google.maps.Rectangle({
					strokeWeight: 0,
					fillColor: g_APP.color.elev(value),
					fillOpacity: g_APP.elevOption.opacity,
					map: map,
					zIndex: 1,
					bounds: {
						north: lat+scale,
						south: lat,
						east: lng+scale,
						west: lng
					}
				});
				rect.addListener('click', clickFn);
				this.layer[key] = rect;
			}
		}
    }

}
