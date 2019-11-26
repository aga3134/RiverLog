
class MapPump extends MapLayer{
    constructor(option){
		if(option.siteKey == null) option.siteKey = "id";
		if(option.dataSiteKey == null) option.dataSiteKey = "stationNo";
		if(option.timeKey == null) option.timeKey = "time";
		if(option.divideLatLng == null) option.divideLatLng = false;
		super(option);
    }

    LoadLayer(param){
		if(!this.map) return;
		if(!g_APP.waterLevelOption.showPump) return;
		MapLayer.prototype.LoadLayer.call(this,param);
	}

    UpdateInfoWindow(d){
    	var str = "";
		var loc = null;
		var s = this.data.site[d.stationNo];
	    str = "<p>"+s.name+"</p>";
	    str += "<p>內水水位 "+d.levelIn.toFixed(2)+" m";
	    str += "<p>外水水位 "+d.levelOut.toFixed(2)+" m";
	    str += "<p>時間 "+d.time+" </p>";
	    //str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"pump\");'>今日變化</div></div>";
	    loc = new google.maps.LatLng(s.lat, s.lng); 
		
		this.infoWindow.setOptions({content: str, position: loc});
    }

    UpdateIcon(id,lat,lng,levelIn,levelOut,pumping,clickFn){
    	var baseScale = Math.min(4,this.GetBaseScale());
	    var scale = 0.03*baseScale*g_APP.waterLevelOption.scale;
	    var valueScale = 0.01*baseScale*g_APP.waterLevelOption.scale;

	    //arrow
	    var arrowPath = [];
	    arrowPath.push({lat: lat+scale*0.1, lng: lng+scale*0.6});
		arrowPath.push({lat: lat+scale*0.1, lng: lng-scale*0.6});
		arrowPath.push({lat: lat+scale*0.2, lng: lng-scale*0.6});
		arrowPath.push({lat: lat, lng: lng-scale*0.8});
		arrowPath.push({lat: lat-scale*0.2, lng: lng-scale*0.6});
		arrowPath.push({lat: lat-scale*0.1, lng: lng-scale*0.6});
		arrowPath.push({lat: lat-scale*0.1, lng: lng+scale*0.6});

		var arrowColor = pumping?"#ff6600":"#ffff33";
		var levelInColor = "#00A862";
		var levelOutColor = "#0075FF";

	    if(this.layer[id]){
	    	var arrowGraph = this.layer[id].arrow;
	    	arrowGraph.setOptions({
				map: this.map,
				fillColor: arrowColor,
				strokeOpacity: g_APP.waterLevelOption.opacity,
				fillOpacity: g_APP.waterLevelOption.opacity,
				paths: arrowPath
			});
			google.maps.event.clearListeners(arrowGraph,"click");
			arrowGraph.addListener('click', clickFn);

			var levelInGraph = this.layer[id].levelIn;
			levelInGraph.setOptions({
				map: this.map,
				fillColor: levelInColor,
				strokeOpacity: g_APP.waterLevelOption.opacity,
				fillOpacity: g_APP.waterLevelOption.opacity,
				bounds: {
					north: lat+levelIn*valueScale,
					south: lat,
					east: lng+scale*0.5,
					west: lng
				}
			});
			google.maps.event.clearListeners(levelInGraph,"click");
			levelInGraph.addListener('click', clickFn);

			var levelOutGraph = this.layer[id].levelOut;
			levelOutGraph.setOptions({
				map: this.map,
				fillColor: levelOutColor,
				strokeOpacity: g_APP.waterLevelOption.opacity,
				fillOpacity: g_APP.waterLevelOption.opacity,
				bounds: {
					north: lat+levelOut*valueScale,
					south: lat,
					east: lng,
					west: lng-scale*0.5
				}
			});
			google.maps.event.clearListeners(levelOutGraph,"click");
			levelOutGraph.addListener('click', clickFn);
	    }
	    else{
		    var arrow = new google.maps.Polygon({
				strokeWeight: 1,
				strokeColor: '#000000',
				strokeOpacity: g_APP.waterLevelOption.opacity,
				fillColor: arrowColor,
				fillOpacity: g_APP.waterLevelOption.opacity,
				map: this.map,
				zIndex: 2,
				paths: arrowPath
			});
			arrow.addListener('click', clickFn);

			var levelInGraph = new google.maps.Rectangle({
				strokeWeight: 1,
				strokeColor: '#000000',
				fillColor: levelInColor,
				fillOpacity: g_APP.waterLevelOption.opacity,
				map: this.map,
				zIndex: 2,
				bounds: {
					north: lat+levelIn*valueScale,
					south: lat,
					east: lng+scale*0.5,
					west: lng
				}
			});
			levelInGraph.addListener('click', clickFn);

			var levelOutGraph = new google.maps.Rectangle({
				strokeWeight: 1,
				strokeColor: '#000000',
				fillColor: levelOutColor,
				fillOpacity: g_APP.waterLevelOption.opacity,
				map: this.map,
				zIndex: 2,
				bounds: {
					north: lat+levelOut*valueScale,
					south: lat,
					east: lng,
					west: lng-scale*0.5
				}
			});
			levelOutGraph.addListener('click', clickFn);

			this.layer[id] = {arrow:arrow,levelIn:levelInGraph,levelOut:levelOutGraph};
	    }
	}

    DrawLayer(data){
    	if(!this.map) return;
		if(!data || !g_APP.waterLevelOption.showPump) return;
		var offset = g_APP.TimeToOffset(g_APP.curTime);
		var pumpData = g_APP.GetDataFromTime(data,g_APP.curTime);
		if(!pumpData) return;

		var baseSize = this.GetBaseScale()*g_APP.waterLevelOption.scale;
		for(var i=0;i<pumpData.length;i++){
			var sID = pumpData[i].stationNo;
			var s = this.data.site[sID];
			if(!s) continue;

			var d = pumpData[i];
			var clickFn = this.GenClickFn(pumpData,i,"stationNo");

			//info window有打開，更新資訊
			if(this.infoWindow.getMap() && this.infoTarget == sID){
				this.UpdateInfoWindow(pumpData[i]);
			}

			var pumping = d.allPumbLights=="-"?false:true;
			this.UpdateIcon(sID,s.lat,s.lng,d.levelIn,d.levelOut,pumping,clickFn);
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
