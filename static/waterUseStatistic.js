
function WaterUseStatistic(){
	this.minYear = 2010;
	this.maxYear = 2019;
	this.year = 2010;
	this.type = "agriculture";
	this.yearTimer = null;
	this.isPlay = false;
	this.overviewData = {};
	this.agricultureData = {};
	this.cultivationData = {};
	this.livestockData = {};
	this.industryData = {};
	this.livingData = {};
	this.reservoirData = {};
	this.county = null;
	this.countyPath = null;
	this.openDetailPanel = false;
	this.select = {};
};

WaterUseStatistic.prototype.InitMap = function(){
	d3.json("/static/geo/county_sim.json", function(data) {
    this.county = topojson.feature(data, data.objects["geo"]).features;
	  this.UpdateGraph();
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
	Vue.nextTick(function(){
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
	}.bind(this));
	
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
		curX: this.year,
		draw: true
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
	if(!this.agricultureData.data){
		$.ajax({
      url:"/statistic/waterUseAgriculture",
      async: false,
      success: function(result){
        if(result.status != "ok"){
          return console.log(result.err);
        }
        var scale = 0.001;	//千立方公尺 -> 百萬立方公尺
        for(var i=0;i<result.data.length;i++){
        	var d = result.data[i];
        	d.Year += 1911;
        	d.FirstPhaseRiceWaterConsumption *= scale;
        	d.FirstPhaseMiscellaneousWaterConsumption *= scale;
        	d.SecondPhaseRiceWaterConsumption *= scale;
        	d.SecondPhaseMiscellaneousWaterConsumption *= scale;
        }
        this.agricultureData.data = result.data;

        var yearBound = d3.extent(result.data, function(d) { return d.Year; });
        this.agricultureData.minYear = yearBound[0];
        this.agricultureData.maxYear = yearBound[1];
      }.bind(this)
    });
	}
	if(!this.agricultureData.association){
		$.ajax({
      url:"/static/geo/irrigationAssociation.json",
      async: false,
      success: function(result){
      	for(var i=0;i<result.length;i++){
      		result[i].shape = "circle";
      		result[i].radius = 5;
      	}
        this.agricultureData.association = result;
      }.bind(this)
    });
	}

	this.minYear = this.agricultureData.minYear;
	this.maxYear = this.agricultureData.maxYear;
	this.BoundYear();

	var yearData = d3.nest()
    .key(function(d){return d.Year;})
    .map(this.agricultureData.data);

	//compute water consumption
	var associationHash = {};
	for(var i=0;i<this.agricultureData.association.length;i++){
		var association = this.agricultureData.association[i];
		associationHash[association.id] = association;
	}
	var data = yearData[this.year];
	var minValue = Number.MAX_VALUE, maxValue = Number.MIN_VALUE;
	for(var i=0;i<data.length;i++){
		var d = data[i];
		var sum = 0;
		sum += d.FirstPhaseRiceWaterConsumption;
		sum += d.FirstPhaseMiscellaneousWaterConsumption;
		sum += d.SecondPhaseRiceWaterConsumption;
		sum += d.SecondPhaseMiscellaneousWaterConsumption;
		if(sum < minValue) minValue = sum;
		if(sum > maxValue) maxValue = sum;
		associationHash[d.IrrigationAssociation].x = sum;
	}

	//===================agriculture map===========================
	var param = {};
	param.selector = "#agricultureMap";
	param.textInfo = "#agricultureMapText";
	param.axis = {
		minX: minValue,
		maxX: maxValue,
		minY: 0,
		maxY: this.agricultureData.association.length
	};
	var agriMap = {
		"type": "map",
		"data": [
			{
				"name": "水利會位置",
				"unit": "百萬立方公尺",
				"color": {
					"minColor": "#888888",
					"maxColor": "#333333"
				},
				"path": this.county,
				"marker": this.agricultureData.association,
				"clickFn": function(d){
					this.openDetailPanel = true;
					var select = {"id":d.id, "name":d.name};
					this.agricultureData.select = select;
					this.UpdateAgricultureDetail();
				}.bind(this)
			}
		]
	};
	param.graph = [agriMap];
	var graph = new SvgGraph(param);
	graph.DrawGraph();

	//===================agriculture rank===========================
	param = {};
	param.selector = "#agricultureRank";
	param.textInfo = "#agricultureRankText";
	param.padding = {
		top: 10, bottom: 10, left: 10, right: 10
	}
	param.axis = {
		minX: minValue,
		maxX: maxValue,
		minY: 0,
		maxY: this.agricultureData.association.length
	};
	var agriRank = {
		"type": "rank",
		"data": [
			{
				"name": "用水排名",
				"unit": "百萬立方公尺",
				"color": {
					"minColor": "#888888",
					"maxColor": "#333333"
				},
				"value": this.agricultureData.association,
				"clickFn": function(d){
					this.openDetailPanel = true;
					var select = {"id":d.id, "name":d.name};
					this.agricultureData.select = select;
					this.UpdateAgricultureDetail();
				}.bind(this)
			}
		]
	};
	param.graph = [agriRank];
	graph = new SvgGraph(param);
	graph.DrawGraph();

	this.UpdateAgricultureDetail();
};

WaterUseStatistic.prototype.UpdateAgricultureDetail = function(){
	if(!this.agricultureData.select) return;
	var associationData = d3.nest()
    .key(function(d){return d.IrrigationAssociation;})
    .map(this.agricultureData.data);

  var data = associationData[this.agricultureData.select.id];
  data = data.sort(function(a,b){
  	return a.Year - b.Year;
  });

  var maxValue = Number.MIN_VALUE;
  for(var i=0;i<data.length;i++){
  	var d = data[i];
  	if(d.FirstPhaseRiceWaterConsumption > maxValue) maxValue = d.FirstPhaseRiceWaterConsumption;
  	if(d.FirstPhaseMiscellaneousWaterConsumption > maxValue) maxValue = d.FirstPhaseMiscellaneousWaterConsumption;
  	if(d.SecondPhaseRiceWaterConsumption > maxValue) maxValue = d.SecondPhaseRiceWaterConsumption;
  	if(d.SecondPhaseMiscellaneousWaterConsumption > maxValue) maxValue = d.SecondPhaseMiscellaneousWaterConsumption;
  }

  //====================agriculture category=====================
	var param = {};
	param.selector = "#agricultureCategory";
	param.textInfo = "#agricultureCategoryText";
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
		maxY: maxValue,
		curX: this.year,
		draw: true
	};
	
	var category = {
		"type": "line",
		"data": [
			{
				"name": "第一期稻作用水量",
				"unit": "百萬立方公尺",
				"value": data.map(function(d){
					return {x: d.Year, y: d.FirstPhaseRiceWaterConsumption}
				})
			},
			{
				"name": "第一期雜作用水量",
				"unit": "百萬立方公尺",
				"value": data.map(function(d){
					return {x: d.Year, y: d.FirstPhaseMiscellaneousWaterConsumption}
				})
			},
			{
				"name": "第二期稻作用水量",
				"unit": "百萬立方公尺",
				"value": data.map(function(d){
					return {x: d.Year, y: d.SecondPhaseRiceWaterConsumption}
				})
			},
			{
				"name": "第二期雜作用水量",
				"unit": "百萬立方公尺",
				"value": data.map(function(d){
					return {x: d.Year, y: d.SecondPhaseMiscellaneousWaterConsumption}
				})
			},
		]
	};
	param.graph = [category];
	var graph = new SvgGraph(param);
	graph.DrawGraph();

	//====================agriculture ratio=====================
	var d = data.filter(function(d){
		return this.year == d.Year;
	}.bind(this))[0];

	param = {};
	param.selector = "#agricultureRatio";
	param.textInfo = "#agricultureRatioText";
	
	var ratio = {
		"type": "pie",
		"inRadius": 50,
		"data": [
			{
				"name": "第一期稻作用水量",
				"unit": "百萬立方公尺",
				"value": d.FirstPhaseRiceWaterConsumption
			},
			{
				"name": "第一期雜作用水量",
				"unit": "百萬立方公尺",
				"value": d.FirstPhaseMiscellaneousWaterConsumption
			},
			{
				"name": "第二期稻作用水量",
				"unit": "百萬立方公尺",
				"value": d.SecondPhaseRiceWaterConsumption
			},
			{
				"name": "第二期雜作用水量",
				"unit": "百萬立方公尺",
				"value": d.SecondPhaseMiscellaneousWaterConsumption
			},
		]
	};
	param.graph = [ratio];
	graph = new SvgGraph(param);
	graph.DrawGraph();

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