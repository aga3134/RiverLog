
class MapWaterLevelGate extends MapWaterLevel{
    constructor(option){
		if(option.siteKey == null) option.siteKey = "_id";
		if(option.dataSiteKey == null) option.dataSiteKey = "stationID";
		if(option.timeKey == null) option.timeKey = "time";
		if(option.divideLatLng == null) option.divideLatLng = false;
		super(option);
    }

    LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.waterLevelOption.showGate) return;
		MapWaterLevel.prototype.LoadLayer.call(this,param);
	}

	ComputeDiff(preValue,curValue){
		var diff = {};
		for(var key in curValue){
			if(!key.includes("水")) continue;
			if(preValue[key]) diff[key] = curValue[key]-preValue[key];
	    }
		return diff;
	}

	AccumulateValue(acc,data,param){
		var key = param.clusterKey;
		var s = param.site;
		var timeKey = param.timeKey;
		var valueKey = param.valueKey;
		var latKey = param.latKey;
		var lngKey = param.lngKey;
		var value = data[valueKey];
		if(value < 0) return acc;
		else if(!acc){
			acc = {};
			acc.key = key;
			acc.t = data[timeKey];
			acc.sum = {};
			acc.diff = {};
			acc.minDiff = {};
			acc.maxDiff = {};
			for(var key in data.diff){
				acc.sum[key] = value[key];
				acc.diff[key] = data.diff[key]
				acc.minDiff[key] = data.diff[key];
				acc.maxDiff[key] = data.diff[key];
			}
			acc.num = 1;
			acc.latSum = s[latKey];
			acc.lngSum = s[lngKey];
		}
		else{
			for(var key in data.diff){
				acc["sum"][key] += value[key];
				acc.diff[key] += data.diff[key];
				if(data.diff[key] < acc.minDiff[key]) acc.minDiff[key] = data.diff[key];
				if(data.diff[key] > acc.maxDiff[key]) acc.maxDiff[key] = data.diff[key];
			}
			acc.num += 1;
			acc.latSum += s[latKey];
			acc.lngSum += s[lngKey];
		}
		return acc;
	}

    UpdateInfoWindow(d){
    	var str = "";
		var loc = null;
		if(d.num){	//cluster
			var lat = d.latSum/d.num;
			var lng = d.lngSum/d.num;
			str = "<p>平均閘門水位</p>";
			str += "<p>測站數 "+d.num+"</p>";
			for(var key in d.diff){
				//str += "<p>最大"+key+"變化 "+d.maxDiff[key].toFixed(2)+" m</p>";
				//str += "<p>最小"+key+"變化 "+d.minDiff[key].toFixed(2)+" m</p>";
				str += "<p>平均"+key+"水位 "+(d.sum[key]/d.num).toFixed(2)+" m (";
				var diff = d.diff[key]/d.num;
			    if(diff >= 0) str += "+";
			    str += diff.toFixed(2)+" m)</p>";
			}
			str += "<p>時間 "+d.t+" </p>";
			loc = new google.maps.LatLng(lat,lng);
		}
		else{
			var s = this.data.site[d.stationID];
		    str = "<p>"+s.stationName+" 閘門水位</p>";
		    for(var key in d.diff){
		    	str += "<p>"+key+" "+d.value[key].toFixed(2)+" m";
		    	if(d.diff[key]){
		    		str += " (";
		    		if(d.diff[key] >= 0) str += "+";
			    	str += d.diff[key].toFixed(2)+" m)</p>";
		    	}
		    }
		    str += "<p>時間 "+d.time+" </p>";
		    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"waterLevelAgri\");'>今日變化</div></div>";
		    loc = new google.maps.LatLng(s.lat, s.lng); 
		}
		this.infoWindow.setOptions({content: str, position: loc});
    }

    DrawLayer(data){
		if(!this.map) return;
		if(!data || !g_APP.waterLevelOption.showGate) return;

		var cluster = this.GetDisplayData(data,"stationID","value","time","lat","lng");
		var color = "#ffffff";
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
				var maxDiff = 0, minDiff = 0, diff = 0, num = 0;
				for(var key in d.diff){
					diff += d.diff[key]/d.num;
					num++;
					if(maxDiff < d.maxDiff[key]) maxDiff = d.maxDiff[key];
					if(minDiff > d.minDiff[key]) minDiff = d.minDiff[key];
				}
				diff = diff/num;
				var clickFn = this.GenClickFn(cluster.data,i,"key");
				this.DrawWaterLevel(sID,[minDiff,maxDiff],color,lat,lng,clickFn);
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
				var maxDiff = 0, minDiff = 0, diff = 0, num = 0;
				for(var key in d.diff){
					diff += d.diff[key];
					num++;
					if(maxDiff < d.diff[key]) maxDiff = d.diff[key];
					if(minDiff > d.diff[key]) minDiff = d.diff[key];
				}
				diff = diff/num;
				this.DrawWaterLevel(sID,[diff],color,s.lat,s.lng,clickFn);
			}
		}
	}

}
