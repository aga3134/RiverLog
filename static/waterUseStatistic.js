
function WaterUseStatistic(){
	this.minYear = 2010;
	this.maxYear = 2019;
	this.year = 2015;
	this.type = "overview";
	this.agricultureMap = null;
	this.reservoirMap = null;
};

WaterUseStatistic.prototype.InitMap = function(){
	var loc = {lat: 23.682094, lng: 120.7764642, zoom: 7};
  var taiwan = new google.maps.LatLng(loc.lat,loc.lng);

  $.get("/static/mapStyle.json",function(style){
    this.agricultureMap = new google.maps.Map(document.getElementById('agricultureMap'), {
      center: taiwan,
      zoom: loc.zoom,
      scaleControl: true,
      mapTypeId: 'terrain',
      styles: style,
      mapTypeControl: false
    });

    google.maps.event.addListener(this.agricultureMap, 'click', function(event) {
      
    });

    this.agricultureMap.addListener('dragend', function() {

    });

    this.agricultureMap.addListener('zoom_changed', function() {
      
    }.bind(this));


    this.reservoirMap = new google.maps.Map(document.getElementById('reservoirMap'), {
      center: taiwan,
      zoom: loc.zoom,
      scaleControl: true,
      mapTypeId: 'terrain',
      styles: style,
      mapTypeControl: false
    });

    google.maps.event.addListener(this.reservoirMap, 'click', function(event) {
      
    });

    this.reservoirMap.addListener('dragend', function() {

    });

    this.reservoirMap.addListener('zoom_changed', function() {
      
    }.bind(this));
  });
};

WaterUseStatistic.prototype.PrevYear = function(){
	
};

WaterUseStatistic.prototype.NextYear = function(){
	
};

WaterUseStatistic.prototype.ToggleYearPlay = function(){
	
};

WaterUseStatistic.prototype.UpdateGraph = function(){
	
};