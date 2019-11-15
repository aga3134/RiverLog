
class MapSewer extends MapWaterLevel{
    constructor(option){
		if(!option.siteKey) option.siteKey = "no";
		if(!option.dataSiteKey) option.dataSiteKey = "stationNo";
		if(!option.timeKey) option.timeKey = "time";
		if(!option.divideLatLng) option.divideLatLng = false;
		super(option);
    }

    UpdateInfoWindow(d){
    	var str = "";
		var loc = null;
		if(d.num){	//cluster
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			var value = d.valueSum/d.num;
			var diff = d.diffSum/d.num;
			str = "<p>下水道水位</p>";
			str += "<p>平均水位 "+value.toFixed(2)+" m</p>";
			str += "<p>平均水位變化 "+diff.toFixed(2)+" m</p>";
			str += "<p>測站數 "+d.num+"</p>";
			str += "<p>時間 "+d.t+" </p>";
			loc = new google.maps.LatLng(lat,lng);
		}
		else{
			var s = this.data.site[d.stationNo];
		    str = "<p>"+s.name+"</p>";
		    str += "<p>水位 "+d.value.toFixed(2)+" m (";
		    if(d.diff >= 0) str += "+";
		    str += d.diff.toFixed(2)+" m)</p>";
		    str += "<p>時間 "+d.time+" </p>";
		    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"waterLevelDrain\");'>今日變化</div></div>";
		    loc = new google.maps.LatLng(s.lat, s.lng); 
		}
		this.infoWindow.setOptions({content: str, position: loc});
    }

    DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.waterLevelOption.showSewer) return;

		var cluster = this.GetDisplayData(data,"stationNo","value","time","lat","lng");
		var color = "#333333";

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
				this.DrawWaterLevel(sID,diff,color,lat,lng,clickFn);
			}
		}
		else{
			for(var i=0;i<cluster.data.length;i++){
				var d = cluster.data[i];
				var sID = d.stationNo;
				var s = this.data.site[sID];
				if(!s) continue;
				//info window有打開，更新資訊
				if(this.infoWindow.getMap() && this.infoTarget == sID){
					this.UpdateInfoWindow(d);
				}
				var clickFn = this.GenClickFn(cluster.data,i,"stationNo");
				this.DrawWaterLevel(sID,d.diff,color,s.lat,s.lng,clickFn);
			}
		}

	}

}
