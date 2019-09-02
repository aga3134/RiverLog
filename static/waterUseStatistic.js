
function WaterUseStatistic(){
	this.minYear = 2010;
	this.maxYear = 2019;
	this.year = 2010;
	this.type = "overview";
	this.agricultureMap = null;
	this.reservoirMap = null;
	this.yearTimer = null;
	this.isPlay = false;
	this.overviewData = {};
	this.agricultureData = {};
	this.cultivationData = {};
	this.livestockData = {};
	this.industryData = {};
	this.livingData = {};
	this.reservoirData = {};
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

  }.bind(this));
};

WaterUseStatistic.prototype.PrevYear = function(){
	this.year--;
	if(this.year < this.minYear) this.year = this.minYear;
	this.UpdateGraph();
};

WaterUseStatistic.prototype.NextYear = function(){
	this.year++;
	if(this.year > this.maxYear) this.year = this.maxYear;
	this.UpdateGraph();
};

WaterUseStatistic.prototype.ToggleYearPlay = function(){
	this.isPlay = !this.isPlay;
	if(this.isPlay){
		this.yearTimer = setInterval(function(){
			this.NextYear();
			if(this.year == this.maxYear){
				this.ToggleYearPlay();
			}
		}.bind(this),500);
	}
	else{
		if(this.yearTimer){
			clearInterval(this.yearTimer);
			this.yearTimer = null;
		}
	}
};

WaterUseStatistic.prototype.UpdateGraph = function(){
	switch(this.type){
		case "overview":
			this.UpdateGraphOverview();
			break;
		case "agriculture":
			this.UpdateGraphAgriculture();
			break;
		case "cultivation":
			this.UpdateGraphCultivation();
			break;
		case "livestock":
			this.UpdateGraphLivestock();
			break;
		case "industry":
			this.UpdateGraphIndustry();
			break;
		case "living":
			this.UpdateGraphLiving();
			break;
		case "reservoir":
			this.UpdateGraphReservoir();
			break;
	}
};

WaterUseStatistic.prototype.BoundYear = function(){
	if(this.year < this.minYear) this.year = this.minYear;
	else if(this.year > this.maxYear) this.year = this.maxYear;
};

WaterUseStatistic.prototype.UpdateGraphOverview = function(){
	if(!this.overviewData.data){
		$.ajax({
      url:"/statistic/waterUseOverview",
      async: false,
      success: function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        for(var i=0;i<result.data.length;i++){
        	result.data[i].Year += 1911;
        }
        this.overviewData.data = result.data.sort(function(a,b){
        	return a.Year - b.Year;
        });
        var yearBound = d3.extent(this.overviewData.data, function(d) { return d.Year; });
        this.overviewData.minYear = yearBound[0];
        this.overviewData.maxYear = yearBound[1];
        var supplyBound = d3.extent(this.overviewData.data, function(d) { return d.TotalWaterSupply; });
        this.overviewData.minSupply = supplyBound[0];
        this.overviewData.maxSupply = supplyBound[1];
      }.bind(this)
    });
	}

	this.minYear = this.overviewData.minYear;
	this.maxYear = this.overviewData.maxYear;
	this.BoundYear();

	//=====================overviewSupply=======================
	var param = {};
	param.selector = "#overviewSupply";
	param.textInfo = "#overviewSupplyText";
	param.padding = {
		left: 50,
		right: 20,
		top: 20,
		bottom: 20
	};
	param.axis = {
		minX: this.minYear,
		maxX: this.maxYear,
		minY: 0,
		maxY: this.overviewData.maxSupply,
		curX: this.year
	};
	
	var supplyStack = {
		"type": "stack",
		"data": [
			{
				"name": "河川引水",
				"unit": "百萬立方公尺",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterSupplyRiver}
				})
			},
			{
				"name": "水庫調節",
				"unit": "百萬立方公尺",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterSupplyReservoir}
				})
			},
			{
				"name": "地下水及其他",
				"unit": "百萬立方公尺",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterSupplyUnderGround}
				})
			}
		]
	};
	var totalSupply = {
		"type": "line",
		"data": [
			{
				"name": "總供水量",
				"unit": "百萬立方公尺",
				"color": "#ff3333",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.TotalWaterSupply}
				})
			}
		]
	};
	param.graph = [supplyStack,totalSupply];
	var graph = new SvgGraph(param);
	graph.DrawGraph();

	//=====================overviewConsumption=======================
	param = {};
	param.selector = "#overviewConsumption";
	param.textInfo = "#overviewConsumptionText";
	param.padding = {
		left: 50,
		right: 20,
		top: 20,
		bottom: 20
	};
	param.axis = {
		minX: this.minYear,
		maxX: this.maxYear,
		minY: 0,
		maxY: this.overviewData.maxSupply,
		curX: this.year
	};
	
	var consumptionStack = {
		"type": "stack",
		"data": [
			{
				"name": "灌溉用水",
				"unit": "百萬立方公尺",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseAgriculture}
				})
			},
			{
				"name": "養殖用水",
				"unit": "百萬立方公尺",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseCultivation}
				})
			},
			{
				"name": "畜牧用水",
				"unit": "百萬立方公尺",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseLivestock}
				})
			},
			{
				"name": "工業用水",
				"unit": "百萬立方公尺",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseIndustry}
				})
			},
			{
				"name": "生活用水",
				"unit": "百萬立方公尺",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseLiving}
				})
			}
		]
	};
	var totalConsumption = {
		"type": "line",
		"data": [
			{
				"name": "總用水量",
				"unit": "百萬立方公尺",
				"color": "#ff3333",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.TotalWaterUse}
				})
			}
		]
	};
	param.graph = [consumptionStack,totalConsumption];
	graph = new SvgGraph(param);
	graph.DrawGraph();
};

WaterUseStatistic.prototype.UpdateGraphAgriculture = function(){

};

WaterUseStatistic.prototype.UpdateGraphCultivation = function(){

};

WaterUseStatistic.prototype.UpdateGraphLivestock = function(){

};

WaterUseStatistic.prototype.UpdateGraphIndustry = function(){

};

WaterUseStatistic.prototype.UpdateGraphLiving = function(){

};

WaterUseStatistic.prototype.UpdateGraphReservoir = function(){

};