
function WaterUseStatistic(){
	this.minYear = 2010;
	this.maxYear = 2019;
	this.year = 2010;
	this.type = "cultivation";
	this.yearTimer = null;
	this.isPlay = false;
	this.playSpeed = 2;
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
	this.countyMap = {"1":"基隆市","2":"臺北市","3":"新北市","4":"桃園市","5":"新竹市","6":"新竹縣","7":"苗栗縣","8":"臺中市","9":"臺中縣","10":"南投縣","11":"彰化縣","12":"雲林縣","13":"嘉義市","14":"嘉義縣","15":"臺南市","16":"高雄市","17":"高雄市","18":"高雄縣","19":"屏東縣","20":"臺東縣","21":"花蓮縣","22":"宜蘭縣","23":"澎湖縣","24":"金門縣","25":"連江縣","26":"新竹縣","27":"臺中市","28":"嘉義縣","29":"臺南市","0":"其他"};
	this.cultivationKindMap = {"1":"吳郭魚","2":"鰻魚","3":"鱸魚","4":"虱目魚","5":"鯛類","7":"烏魚","8":"海水蝦類","9":"長腳大蝦","10":"文蛤","11":"蜆","12":"龍鬚菜","14":"其他鹹水","15":"其他淡水","16":"鱠","17":"九孔","18":"香魚"};
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
		}.bind(this),1000/this.playSpeed);
	}
	else{
		if(this.yearTimer){
			clearInterval(this.yearTimer);
			this.yearTimer = null;
		}
	}
};

WaterUseStatistic.prototype.UpdatePlaySpeed = function(){
	if(this.yearTimer){
		clearInterval(this.yearTimer);
		this.yearTimer = setInterval(function(){
			this.NextYear();
			if(this.year == this.maxYear){
				this.ToggleYearPlay();
			}
		}.bind(this),1000/this.playSpeed);
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
		"unitX": "年",
		"unitY": "百萬立方公尺",
		"data": [
			{
				"name": "河川引水",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterSupplyRiver}
				})
			},
			{
				"name": "水庫調節",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterSupplyReservoir}
				})
			},
			{
				"name": "地下水及其他",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterSupplyUnderGround}
				})
			}
		]
	};
	var totalSupply = {
		"type": "line",
		"unitX": "年",
		"unitY": "百萬立方公尺",
		"data": [
			{
				"name": "總供水量",
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
		curX: this.year,
		draw: true
	};
	
	var consumptionStack = {
		"type": "stack",
		"unitX": "年",
		"unitY": "百萬立方公尺",
		"data": [
			{
				"name": "灌溉用水",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseAgriculture}
				})
			},
			{
				"name": "養殖用水",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseCultivation}
				})
			},
			{
				"name": "畜牧用水",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseLivestock}
				})
			},
			{
				"name": "工業用水",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseIndustry}
				})
			},
			{
				"name": "生活用水",
				"value": this.overviewData.data.map(function(d){
					return {x: d.Year, y: d.WaterUseLiving}
				})
			}
		]
	};
	var totalConsumption = {
		"type": "line",
		"unitX": "年",
		"unitY": "百萬立方公尺",
		"data": [
			{
				"name": "總用水量",
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

WaterUseStatistic.prototype.GetAgricultureValue = function(d){
	switch(this.agricultureData.type){
		case "灌溉用水":
			return [
				d.FirstPhaseRiceWaterConsumption,
				d.FirstPhaseMiscellaneousWaterConsumption,
				d.SecondPhaseRiceWaterConsumption,
				d.SecondPhaseMiscellaneousWaterConsumption
			];
		case "灌溉面積":
			return [
				d.FirstPhaseRiceIrrigationArea,
				d.FirstPhaseMiscellaneousIrrigationArea,
				d.SecondPhaseRiceIrrigationArea,
				d.SecondPhaseMiscellaneousIrrigationArea
			];
		case "單位面積用水量":
			return [
				d.FirstPhaseRiceIrrigationArea?d.FirstPhaseRiceWaterConsumption/d.FirstPhaseRiceIrrigationArea:0,
				d.FirstPhaseMiscellaneousIrrigationArea?d.FirstPhaseMiscellaneousWaterConsumption/d.FirstPhaseMiscellaneousIrrigationArea:0,
				d.SecondPhaseRiceIrrigationArea?d.SecondPhaseRiceWaterConsumption/d.SecondPhaseRiceIrrigationArea:0,
				d.SecondPhaseMiscellaneousIrrigationArea?d.SecondPhaseMiscellaneousWaterConsumption/d.SecondPhaseMiscellaneousIrrigationArea:0
			];
	}
};

WaterUseStatistic.prototype.GetAgricultureUnit = function(){
	switch(this.agricultureData.type){
		case "灌溉用水":
			return "百萬立方公尺";
		case "灌溉面積":
			return "公頃";
		case "單位面積用水量":
			return "百萬立方公尺/公頃";
	}
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
        Vue.set(this.agricultureData, "type", "灌溉用水");

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
	var unit =  this.GetAgricultureUnit();
	for(var i=0;i<data.length;i++){
		var d = data[i];
		d.value = this.GetAgricultureValue(d);
		var sum = 0;
		for(var j=0;j<d.value.length;j++){
			sum += d.value[j];
		}
		if(sum < minValue) minValue = sum;
		if(sum > maxValue) maxValue = sum;
		associationHash[d.IrrigationAssociation].value = sum;
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
		"unit": unit,
		"data": [
			{
				"name": "水利會位置",
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
		"unit": unit,
		"data": [
			{
				"name": "用水排名",
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
  var minValue = Number.MAX_VALUE;
  var unit =  this.GetAgricultureUnit();
  for(var i=0;i<data.length;i++){
  	var d = data[i];
  	d.value = this.GetAgricultureValue(d);
  	var sum = 0;
  	for(var j=0;j<d.value.length;j++){
			sum += d.value[j];
		}
  	if(sum < minValue) minValue = sum;
  	if(sum > maxValue) maxValue = sum;
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

	var total = {
		"type": "line",
		"unitX": "年",
		"unitY": unit,
		"data": [
			{
				"name": "總"+this.agricultureData.type,
				"color": "#ff3333",
				"value": data.map(function(d){
					return {
						x: d.Year,
						y: d3.sum(d.value)
					}
				})
			}
		]
	}
	
	var stack = {
		"type": "stack",
		"unitX": "年",
		"unitY": unit,
		"data": [
			{
				"name": "第一期稻作"+this.agricultureData.type,
				"value": data.map(function(d){
					return {x: d.Year, y: d.value[0]}
				})
			},
			{
				"name": "第一期雜作"+this.agricultureData.type,
				"value": data.map(function(d){
					return {x: d.Year, y: d.value[1]}
				})
			},
			{
				"name": "第二期稻作"+this.agricultureData.type,
				"value": data.map(function(d){
					return {x: d.Year, y: d.value[2]}
				})
			},
			{
				"name": "第二期雜作"+this.agricultureData.type,
				"value": data.map(function(d){
					return {x: d.Year, y: d.value[3]}
				})
			},
		]
	};
	param.graph = [stack,total];
	var graph = new SvgGraph(param);
	graph.DrawGraph();

	//====================agriculture ratio=====================
	var d = data.filter(function(d){
		return this.year == d.Year;
	}.bind(this))[0];

	if(!d){
		d = {value:[0,0,0,0]};
	}

	param = {};
	param.selector = "#agricultureRatio";
	param.textInfo = "#agricultureRatioText";
	
	var ratio = {
		"type": "pie",
		"inRadius": 50,
		"unit": unit,
		"data": [
			{
				"name": "第一期稻作"+this.agricultureData.type,
				"value": d.value[0]
			},
			{
				"name": "第一期雜作"+this.agricultureData.type,
				"value": d.value[1]
			},
			{
				"name": "第二期稻作"+this.agricultureData.type,
				"value": d.value[2]
			},
			{
				"name": "第二期雜作"+this.agricultureData.type,
				"value": d.value[3]
			},
		]
	};
	param.graph = [ratio];
	graph = new SvgGraph(param);
	graph.DrawGraph();

};

WaterUseStatistic.prototype.GetCultivationValue = function(d){
	switch(this.cultivationData.type){
		case "養殖用水":
			return d.TotalWaterConsumption;
		case "養殖面積":
			return 	d.CultivationArea;
		case "單位面積用水量":
			if(d.CultivationArea > 0){
				return d.TotalWaterConsumption/d.CultivationArea;
			}
  		else return 0;
	}
};

WaterUseStatistic.prototype.GetCultivationUnit = function(d){
	switch(this.cultivationData.type){
		case "養殖用水":
			return "百萬立方公尺";
		case "養殖面積":
			return "公頃";
		case "單位面積用水量":
			return "百萬立方公尺/公頃";
	}
};

WaterUseStatistic.prototype.UpdateGraphCultivation = function(){
	if(!this.cultivationData.data){
		$.ajax({
	      url:"/statistic/waterUseCultivation",
	      async: false,
	      success: function(result){
	        if(result.status != "ok"){
	          return console.log(result.err);
	        }
	        var scale = 0.001;	//千立方公尺 -> 百萬立方公尺
	        for(var i=0;i<result.data.length;i++){
	        	var d = result.data[i];
	        	d.Year += 1911;
	        	d.TotalWaterConsumption *= scale;
	        }
	        this.cultivationData.data = result.data;
	        Vue.set(this.cultivationData, "type", "養殖用水");

	        var yearBound = d3.extent(result.data, function(d) { return d.Year; });
	        this.cultivationData.minYear = yearBound[0];
	        this.cultivationData.maxYear = yearBound[1];
	      }.bind(this)
	    });
	}

	this.minYear = this.cultivationData.minYear;
	this.maxYear = this.cultivationData.maxYear;
	this.BoundYear();

	var yearData = d3.nest()
    .key(function(d){return d.Year;})
    .key(function(d){return d.County})
    .rollup(function(arr){
    	return d3.sum(arr, function(d){
    		return 	this.GetCultivationValue(d);
    	}.bind(this));
    }.bind(this))
    .map(this.cultivationData.data);

	//compute water consumption
	var data = yearData[this.year];
	var dataArr = [];
	var minValue = Number.MAX_VALUE, maxValue = Number.MIN_VALUE;
	var unit =  this.GetCultivationUnit();
	for(var county in data){
		var d = data[county];
		dataArr.push({id: county, "name":this.countyMap[county],"value":d});
		if(d < minValue) minValue = d;
		if(d > maxValue) maxValue = d;
	}
	
	//===================cultivation map===========================
	var param = {};
	param.selector = "#cultivationMap";
	param.textInfo = "#cultivationMapText";
	param.axis = {
		minX: minValue,
		maxX: maxValue,
		minY: 0,
		maxY: dataArr.length
	};
	var cultiMap = {
		"type": "map",
		"unit": unit,
		"data": [
			{
				"name": "縣市統計",
				"color": {
					"minColor": "#888888",
					"maxColor": "#333333"
				},
				"path": this.county,
				"value": dataArr,
				"clickFn": function(d){
					this.openDetailPanel = true;
					var select = {"id":d.id, "name":d.name};
					this.cultivationData.select = select;
					this.UpdateCultivationDetail();
				}.bind(this)
			}
		]
	};
	param.graph = [cultiMap];
	var graph = new SvgGraph(param);
	graph.DrawGraph();

	//===================agriculture rank===========================
	param = {};
	param.selector = "#cultivationRank";
	param.textInfo = "#cultivationRankText";
	param.padding = {
		top: 10, bottom: 10, left: 10, right: 10
	}
	param.axis = {
		minX: minValue,
		maxX: maxValue,
		minY: 0,
		maxY: dataArr.length
	};
	var cultiRank = {
		"type": "rank",
		"unit": unit,
		"data": [
			{
				"name": "用水排名",
				"color": {
					"minColor": "#888888",
					"maxColor": "#333333"
				},
				"value": dataArr,
				"clickFn": function(d){
					this.openDetailPanel = true;
					var select = {"id":d.id, "name":d.name};
					this.cultivationData.select = select;
					this.UpdateCultivationDetail();
				}.bind(this)
			}
		]
	};
	param.graph = [cultiRank];
	graph = new SvgGraph(param);
	graph.DrawGraph();

	this.UpdateCultivationDetail();
};

WaterUseStatistic.prototype.UpdateCultivationDetail = function(){
	if(!this.cultivationData.select) return;

	var countyData = d3.nest()
    .key(function(d){return d.County;})
    .map(this.cultivationData.data);

  var data = countyData[this.cultivationData.select.id];

  var yearSum = d3.nest()
  	.key(function(d){return d.Year})
  	.rollup(function(arr){
  		return d3.sum(arr, function(d){
    		return 	this.GetCultivationValue(d);
    	}.bind(this));
  	}.bind(this))
  	.entries(data);

  yearSum = yearSum.sort(function(a,b){
  	return a.key-b.key;
  });

  var maxValue = Number.MIN_VALUE;
  var minValue = Number.MAX_VALUE;
  for(var i=0;i<yearSum.length;i++){
  	var d = yearSum[i];
  	if(d.values > maxValue) maxValue = d.values;
  	if(d.values < minValue) minValue = d.values;
  }

  var unit = this.GetCultivationUnit();

  //====================cultivation category=====================
	var param = {};
	param.selector = "#cultivationCategory";
	param.textInfo = "#cultivationCategoryText";
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

	var total = {
		"type": "line",
		"unitX": "年",
		"unitY": unit,
		"data": [
			{
				"name": "總"+this.cultivationData.type,
				"color": "#ff3333",
				"value": yearSum.map(function(d){
					return {"x": d.key, "y": d.values};
				})
			}
		]
	}

	var kindData = d3.nest()
    .key(function(d){return d.CultivationKind;})
    .key(function(d){return d.Year;})
    .map(data);

  var dataArr = [];
  for(var kind in kindData){
  	var arr = kindData[kind];

  	//loop from minYear to maxYear to avoid missing data
  	var value = [];
  	for(var year=this.minYear;year<=this.maxYear;year++){
  		if(year in arr){
  			var d = arr[year][0];
  			value.push({"x": year, "y":this.GetCultivationValue(d)});
  		}
  		else value.push({"x": year, "y":0});
  	}

  	dataArr.push({
  		"name": this.cultivationKindMap[kind]+this.cultivationData.type,
  		"value": value
  	});
  }
	
	var stack = {
		"type": "stack",
		"unitX": "年",
		"unitY": unit,
		"data": dataArr
	};
	param.graph = [stack,total];
	var graph = new SvgGraph(param);
	graph.DrawGraph();

	//====================cultivation ratio=====================
	var yearData = d3.nest()
    .key(function(d){return d.Year;})
    .map(data);
  var arr = yearData[this.year];
	param = {};
	param.selector = "#cultivationRatio";
	param.textInfo = "#cultivationRatioText";
	
	var ratio = {
		"type": "pie",
		"inRadius": 50,
		"unit": unit,
		"data": arr.map(function(d){
			var name = this.cultivationKindMap[d.CultivationKind];
			return {"name": name, "value":this.GetCultivationValue(d)};
		}.bind(this))
	};
	param.graph = [ratio];
	graph = new SvgGraph(param);
	graph.DrawGraph();
};

WaterUseStatistic.prototype.UpdateGraphLivestock = function(){

};

WaterUseStatistic.prototype.UpdateGraphIndustry = function(){

};

WaterUseStatistic.prototype.UpdateGraphLiving = function(){

};

WaterUseStatistic.prototype.UpdateGraphReservoir = function(){

};