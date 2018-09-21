var g_APP = new Vue({
  el: "#app",
  data: {
    timeStr: "2018-09-20 17:00",
    timebar: [],
    openDateSelect: false,
    openOption: false,
    openAbout: false,
    curYear: 2018,
    curItem: "rain"
  },
  created: function () {
    for(var i=0;i<144;i++){
      var bt = {};
      bt.x = i*8;
      bt.north = "#333333";
      bt.center = "#888888";
      bt.south = "#ffffff";
      this.timebar.push(bt);
    }
    google.maps.event.addDomListener(window, 'load', this.InitMap);
  },
  methods: {
    InitMap: function(){
      var loc = {lat: 23.682094, lng: 120.7764642, zoom: 7};
      var taiwan = new google.maps.LatLng(loc.lat,loc.lng);

      $.get("/static/mapStyle.json",function(style){
        map = new google.maps.Map(document.getElementById('map'), {
          center: taiwan,
          zoom: loc.zoom,
          scaleControl: true,
          mapTypeId: 'terrain',
          styles: style,
          mapTypeControl: false
        });

        google.maps.event.addListener(map, 'click', function(event) {

        });

        map.addListener('dragend', function() {

        });

        map.addListener('zoom_changed', function() {

        });
      }.bind(this));
      
    },
    UpdateMap: function(){

    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  
});