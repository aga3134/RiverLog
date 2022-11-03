
class MapCCTV extends MapLayer{
	constructor(option){
		if(option.siteKey == null) option.siteKey = "stationID";
		if(option.dataSiteKey == null) option.dataSiteKey = "stationID";
		if(option.divideLatLng == null) option.divideLatLng = false;
		super(option);
	}

	LoadLayer(param){
		if(!this.map) return;
  }

	UpdateInfoWindow(d){
		var s = this.data.site[d.stationID];
		var str = "<p>"+s.name+"</p>";
		str += `<div class='info-bt-container'><div class='info-bt' onclick='window.open("${d.link}","_blank")'>觀看影像</div></div>`;
		var loc = new google.maps.LatLng(s.lat, s.lon);
		this.infoWindow.setOptions({content: str, position: loc});
	}

  GenClickFn(s,key){
    return function() {
      this.UpdateInfoWindow(s);
      this.infoWindow.open(this.map);
      this.infoTarget = s[key];
    }.bind(this);
  }

	Update(){
		if(!this.map) return;
    for(var sID in this.data.site){
      var s = this.data.site[sID];
      var type = s.type;
      console.log(type);
      var show = g_APP.cctvOption["show_"+type];
			var clickFn = this.GenClickFn(s,"stationID");

			if(this.layer[sID]){
				var marker = this.layer[sID];
				var option = {
					map: show?this.map:null,
				};
				marker.setOptions(option);
			}
			else{
        const image =
          "static/Image/icon-cctv_"+type+".png";
        const marker = new google.maps.Marker({
          position: {lat: s.lat, lng: s.lon},
          map: show?this.map:null,
          icon: image,
        });
				marker.addListener('click', clickFn);
				this.layer[sID] = marker;
			}
    }

	}

}
