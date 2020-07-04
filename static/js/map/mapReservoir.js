
class MapReservoir extends MapLayer{
    constructor(option){
    	if(option.siteKey == null) option.siteKey = "id";
    	if(option.dataSiteKey == null) option.dataSiteKey = "ReservoirIdentifier";
    	if(option.timeKey == null) option.timeKey = "ObservationTime";
    	if(option.divideLatLng == null) option.divideLatLng = false;
      super(option);
    }

    LoadLayer(param){
      if(!this.map) return;
      if(!g_APP.reservoirOption.show) return;
      param.expendData = true;
      MapLayer.prototype.LoadLayer.call(this,param);
    }

    UpdateInfoWindow(d){
      var s = this.data.site[d.ReservoirIdentifier];
	    var percent = (100*d.EffectiveWaterStorageCapacity/s.EffectiveCapacity).toFixed(2);
	    var str = "<p>"+s.ReservoirName+"</p>";
	    str += "<p>蓄水百分比 "+percent+" %</p>";
	    str += "<p>水位/滿水位/死水位: </p>"
	    str += d.WaterLevel+" / "+s.FullWaterLevel+" / "+s.DeadStorageLevel+" m</p>";
	    str += "<p>有效總容量 "+s.EffectiveCapacity+" m3</p>";
	    str += "<p>時間 "+d.ObservationTime+" </p>";
	    str += "<div class='info-bt-container'><div class='info-bt' onclick='g_APP.mapControl.OpenLineChart(\"reservoir\");'>今日變化</div></div>";
	    var loc = new google.maps.LatLng(s.lat, s.lng);
	    this.infoWindow.setOptions({content: str, position: loc});
    }

    GetBaseScale(){
      var zoom = this.map.getZoom();
      return 0.001*(Math.pow(1.7,zoom-7));
    }

    DrawLayer(data){
      if(!this.map) return;
      if(!data || !g_APP.reservoirOption.show) return;
      var hour = g_APP.curTime.split(":")[0];
      var reservoirData = g_APP.GetDataFromTime(data,hour+":00");
      if(!reservoirData || !g_APP.reservoirOption.show) return;

		  var baseSize = this.GetBaseScale()*g_APP.reservoirOption.scale;
		  var bound = this.map.getBounds();
		  for(var i=0;i<reservoirData.length;i++){
		    var sID = reservoirData[i].ReservoirIdentifier;
		    var s = this.data.site[sID];
		    if(!s) continue;
		    if(!bound.contains({lat:s.lat,lng:s.lng})) continue;

		    var d = reservoirData[i];
		    var percent = (100*d.EffectiveWaterStorageCapacity/s.EffectiveCapacity).toFixed(2);
		    if(isNaN(percent)) continue;
		    var size = Math.min(200,s.EffectiveCapacity*baseSize);
        	var clickFn = this.GenClickFn(reservoirData,i,"ReservoirIdentifier");

		    //info window有打開，更新資訊
		    if(this.infoWindow.getMap() && this.infoTarget == sID){
		      this.UpdateInfoWindow(reservoirData[i]);
		    }

		    if(this.layer[sID]){
		      var overlay = this.layer[sID];
		      var option = {
		        map: this.map,
		        size: size,
		        percent: percent,
		        opacity: g_APP.reservoirOption.opacity,
		        color: g_APP.color.reservoir(percent*0.01)
		      };
		      overlay.Update(option);
		      google.maps.event.clearListeners(overlay,"click");
		      overlay.addListener('click', clickFn);
		    }
		    else{
		      var overlay = new ReservoirOverlay({
		        map: this.map,
		        lat: s.lat,
		        lng: s.lng,
		        size: size,
		        svgID: "svg_"+sID,
		        percent: percent,
		        opacity: g_APP.reservoirOption.opacity,
		        color: g_APP.color.reservoir(percent*0.01),
		      });
		      
		      overlay.addListener('click', clickFn);
		      this.layer[sID] = overlay;
		    }
		  }
    }

}
