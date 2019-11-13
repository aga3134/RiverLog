
class MapTyphoon extends MapLayer{
  constructor(option){
		option.divideLatLng = false;
		super(option);
  }

  UpdateInfoWindow(d){
		var str = "<p class='info-title'>"+d.cwb_typhoon_name+"颱風</p>";
    str += "<p>近中心最大風速: "+d.max_wind_speed+" m/s</p>";
    str += "<p>近中心最大陣風: "+d.max_gust_speed+" m/s</p>";
    str += "<p>中心氣壓: "+d.pressure+" 百帕</p>";
    str += "<p>七級風暴風半徑: "+d.circle_of_15ms+" km</p>";
    str += "<p>十級風暴風半徑: "+d.circle_of_25ms+" km</p>";
    str += "<p>時間 "+d.time+" </p>";
    var loc = new google.maps.LatLng(d.lat, d.lng);
    this.infoWindow.setOptions({content: str, position: loc});
  }

  DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.typhoonTrajectoryOption.show) return;

		var hour = g_APP.curTime.split(":")[0];
    var typhoonData = data[hour+":00:00"];
    if(!typhoonData){
      //颱風未靠近台灣時是6小時更新一次，這邊確認若颱風資料有持續更新，就拿前幾個小時的資料來顯示，避免颱風圖示一下消失一下出現
      var futureData = g_APP.GetDataAfterTime(data,g_APP.curTime);
      if(futureData) typhoonData = g_APP.GetDataFromTime(data,g_APP.curTime);
    }
		if(!typhoonData) return;

		var clickFn = function(data,i){ 
			return function() {
				this.UpdateInfoWindow(data[i]);
				this.infoWindow.open(this.map);
				this.infoTarget = data[i].typhoon_name;
			}.bind(this);
		}.bind(this);

		for(var i=0;i<typhoonData.length;i++){
			var typhoon = typhoonData[i];
			var sID = typhoon.typhoon_name;

			//info window有打開，更新資訊
			if(this.infoWindow.getMap() && this.infoTarget == sID){
				this.UpdateInfoWindow(typhoon);
			}

			var scale = 1000; //google map circle unit is m

			if(this.layer[sID]){
				var graph = this.layer[sID];

	      graph.level7.setOptions({
	        map: this.map,
	        fillOpacity: g_APP.typhoonTrajectoryOption.opacity,
	        center: {lat:typhoon.lat, lng:typhoon.lng},
	        radius: Math.max(0,typhoon.circle_of_15ms*scale)
	      });

	      graph.level10.setOptions({
	        map: this.map,
	        fillOpacity: g_APP.typhoonTrajectoryOption.opacity,
	        center: {lat:typhoon.lat, lng:typhoon.lng},
	        radius: Math.max(0,typhoon.circle_of_25ms*scale)
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
	        radius: Math.max(0,typhoon.circle_of_15ms*scale)
	      });
	      
	      graph.level10 = new google.maps.Circle({
	        strokeColor: '#FFFFFF',
	        strokeOpacity: 1,
	        strokeWeight: 1,
	        fillColor: '#FF0000',
	        fillOpacity: g_APP.typhoonTrajectoryOption.opacity,
	        map: this.map,
	        center: {lat:typhoon.lat, lng:typhoon.lng},
	        radius: Math.max(0,typhoon.circle_of_25ms*scale)
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

	      this.layer[sID] = graph;
			}
		}
	}

	ClearMap(){
    for(var key in this.layer){
    	if(this.layer[key]){
    		for(var graph in this.layer[key]){
    			this.layer[key][graph].setMap(null);
    		}
    	}
    }
  }

}
