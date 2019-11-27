
class MapBasin extends MapLayer{
	constructor(option){
		option.divideLatLng = false;
		super(option);
		this.geoBasin = {};
	}

	SetFeatureStyle(feature){
		var displayType = feature.getProperty("displayType");
		switch(displayType){
			case "fill":
				return {
					strokeWeight: 1,
					strokeOpacity: 1,
					strokeColor: '#000',
					fillColor: '#00f',
					fillOpacity: 0.5
				}
			case "outline":
				return {
					strokeWeight: 1,
					strokeOpacity: 1,
					strokeColor: '#000',
					fillOpacity: 0
				}
			case "none":
				return {
				  strokeOpacity: 0,
				  fillOpacity: 0
				}
		}
	}

	FeatureClick(event){
		if(!g_APP.mapOption.showBasin) return;
		var name = event.feature.getProperty("name");
		var content = name+"流域";
		var loc = event.feature.getProperty("loc");
		if(content != ""){
			this.infoWindow.setOptions({content: content,position: loc});
			this.infoWindow.open(this.map);
			this.infoTarget = event.feature.getId();
		}
	}

	FeatureMouseOver(event){
		event.feature.setProperty("hover",true);
		event.feature.setProperty("displayType",g_APP.mapOption.showBasin?"fill":"none");
	}

	FeatureMouseOut(event){
		event.feature.setProperty("hover",false);
		event.feature.setProperty("displayType",g_APP.mapOption.showBasin?"outline":"none");
	}

	InitMapInfo(){
		$.getJSON("/static/geo/basin_sim.json", function(data){
			var geoJsonObject = topojson.feature(data, data.objects["collection"]);
			for(var i=0;i<geoJsonObject.features.length;i++){
				var basin = geoJsonObject.features[i];
				this.geoBasin[basin.properties.name] = basin;
				basin.id = basin.properties.name;
				//用所有點平均當window位置
				var lat = 0,lng = 0,num = 0;
				for(var j=0;j<basin.geometry.coordinates.length;j++){
					var coord = basin.geometry.coordinates[j];
					for(var k=0;k<coord.length;k++){
						lat += parseFloat(coord[k][1]);
						lng += parseFloat(coord[k][0]);
						num += 1;
					}
				}
				basin.properties.type = "basin";
				basin.properties.displayType = "none";
				basin.properties.loc = {lat: lat/num, lng: lng/num};
			}
			this.map.data.addGeoJson(geoJsonObject);
			this.Update();
		}.bind(this));

	}

	Update(){
		if(!this.map) return;
		for(var id in this.geoBasin){
			var feature = this.map.data.getFeatureById(id);
			if(!feature) continue;
			if(g_APP.mapOption.showBasin){
				var hover = feature.getProperty("hover");
				if(hover){
					feature.setProperty("displayType","fill");
				}
				else{
					feature.setProperty("displayType","outline");
				}
			}
			else{
				feature.setProperty("displayType","none");
			}
		}
	}

	LoadLayer(param){
		this.Update();
	}

	ClearMap(){
		if(!this.map) return;
		this.map.data.forEach(function(feature){
			var type = feature.getProperty('type');
			if(type == "basin") feature.setProperty("displayType","none");
		});
	}

}
