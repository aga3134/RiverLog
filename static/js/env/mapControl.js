
function MapControl(){
	this.map = null;
  this.mapStyle = "";
};

MapControl.prototype.InitMap = function(param){
	var loc = {lat: 23.682094, lng: 120.7764642, zoom: 7};
  if(param.initLoc){
    if(param.initLoc.lat) loc.lat = param.initLoc.lat;
    if(param.initLoc.lng) loc.lng = param.initLoc.lng;
    if(param.initLoc.zoom) loc.zoom = param.initLoc.zoom;
  }
  var taiwan = new google.maps.LatLng(loc.lat,loc.lng);

  $.get("/static/mapStyle.json",function(style){
    this.mapStyle = style;
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: taiwan,
      zoom: loc.zoom,
      scaleControl: true,
      mapTypeId: param.useSatellite?"hybrid":"terrain",
      styles: style,
      mapTypeControl: false
    });

    google.maps.event.addListener(this.map, 'click', function(event) {
      
    });

    this.map.addListener('dragend', function() {

    });

    this.map.addListener('zoom_changed', function() {
      
    }.bind(this));

    this.map.addListener('bounds_changed',function(){
      g_Env.UpdateMap();
    });

    this.map.data.setStyle(function(feature){
      var type = feature.getProperty('type');
      switch(type){
        case "basin":
          return this.mapBasin.SetFeatureStyle(feature);
      }
    }.bind(this));

    this.map.data.addListener('click',function(event){
      var type = event.feature.getProperty('type');
      switch(type){
        case "basin":
          return this.mapBasin.FeatureClick(event);
      }
      
    }.bind(this));

    this.map.data.addListener('mouseover',function(event){
      var type = event.feature.getProperty('type');
      switch(type){
        case "basin":
          return this.mapBasin.FeatureMouseOver(event);
      }
    }.bind(this));

    this.map.data.addListener('mouseout',function(event){
      var type = event.feature.getProperty('type');
      switch(type){
        case "basin":
          return this.mapBasin.FeatureMouseOut(event);
      }
    }.bind(this));


    param.succFunc();

  }.bind(this));
  
};

MapControl.prototype.ChangeDate = function(){
  var date = g_Env.curYear+"-"+g_Env.curDate;
}

MapControl.prototype.ToggleSatellite = function(useSatellite){
  if(useSatellite){
    this.map.setMapTypeId('hybrid');
  }
  else{
    this.map.setMapTypeId('terrain');
  }
};

MapControl.prototype.UpdateWaterbox = function(){
  
};

MapControl.prototype.ClearMap = function(){
  
};

MapControl.prototype.GetLocation = function(keepLayer){
  if(!this.map) return;
  var center = this.map.getCenter();
  return {lat: center.lat(), lng: center.lng(), zoom: this.map.getZoom()};
};