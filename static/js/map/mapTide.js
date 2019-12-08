
class MapTide extends MapWaterLevel{
    constructor(option){
		if(option.siteKey == null) option.siteKey = "id";
		if(option.dataSiteKey == null) option.dataSiteKey = "stationID";
		if(option.timeKey == null) option.timeKey = "time";
		if(option.divideLatLng == null) option.divideLatLng = false;
		super(option);
    }

    LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.waterLevelOption.showTide) return;
		MapWaterLevel.prototype.LoadLayer.call(this,param);
	}

    UpdateInfoWindow(d){
    	var str = "";
		var loc = null;
		if(d.num){	//cluster
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			var value = d.valueSum/d.num;
			var diff = d.diffSum/d.num;
			str = "<p>平均潮位</p>";
			str += "<p>測站數 "+d.num+"</p>";
			//str += "<p>最大潮位變化 "+d.maxDiff.toFixed(2)+" m</p>";
			//str += "<p>最小潮位變化 "+d.minDiff.toFixed(2)+" m</p>";
			str += "<p>平均水位 "+value.toFixed(2)+" m</p>";
			str += "<p>平均水位變化 "+diff.toFixed(2)+" m</p>";
			str += "<p>時間 "+d.t+" </p>";
			loc = new google.maps.LatLng(lat,lng);
		}
		else{
			var s = this.data.site[d.stationID];
		    str = "<p>"+s.name+" 潮位</p>";
		    str += "<p>潮位 "+d.value.toFixed(2)+" m (";
		    if(d.diff >= 0) str += "+";
		    str += d.diff.toFixed(2)+" m)</p>";
		    str += "<p>時間 "+d.time+" </p>";
		    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"tide\");'>今日變化</div></div>";
		    loc = new google.maps.LatLng(s.lat, s.lng); 
		}
		this.infoWindow.setOptions({content: str, position: loc});
    }


    DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.waterLevelOption.showTide) return;
		
		var cluster = this.GetDisplayData(data,"stationID","value","time","lat","lng");
		var color = "#FFFFFF";
		
		if(cluster.isCluster){
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.key;
				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}

				var lat = d.latSum/d.num;
				var lng = d.lngSum/d.num;
				var diff = d.diffSum/d.num;
				var clickFn = this.GenClickFn(cluster.data,i,"key");
				this.DrawWaterLevel(sID,[diff],color,lat,lng,clickFn);
			}
		}
		else{
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.stationID;
				var s = this.data.site[sID];
				if(!s) continue;
				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}
				var clickFn = this.GenClickFn(cluster.data,i,"stationID");
				this.DrawWaterLevel(sID,[d.diff],color,s.lat,s.lng,clickFn);
			}
		}
	}

}
