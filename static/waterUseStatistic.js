
function WaterUseStatistic(){
	this.minYear = 2010;
	this.maxYear = 2019;
	this.year = 2019;
	this.type = "overview";
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
	this.livestockKindMap = {"2":"水牛及黃雜牛","3":"乳牛","4":"豬","5":"綿羊及山羊","6":"乳羊","7":"雞","8":"鴨"};
	this.industryKindMap = {"0800":"食品及飼品製造業","0900":"飲料製造業","1000":"菸草製造業","1100":"紡織業","1200":"成衣及服飾品製造業","1300":"皮革、毛皮及其製品製造業","1400":"木竹製品製造業","1500":"紙漿、紙及紙製品製造業","1600":"印刷及資料儲存媒體複製業","1700":"石油及煤製品製造業","1800":"化學原材料、肥料、氮化合物、塑橡膠原料及人造纖維製造業","1900":"其他化學製品製造業","2000":"藥品及醫用化學製品製造業","2100":"橡膠製品製造業","2200":"塑膠製品製造業","2300":"非金屬礦物製品製造業","2400":"基本金屬製造業","2500":"金屬製品製造業","2600":"電子零組件製造業","2700":"電腦、電子產品及光學製品製造業","2800":"電力設備及配備製造業","2900":"機械設備製造業","3000":"汽車及其零件製造業","3100":"其他運輸工具及其零件製造業","3200":"家具製造業","3300":"其他製造業","3400":"產業用機械設備維修及安裝業"};
};

WaterUseStatistic.prototype.InitMap = function(){
	d3.json("/static/geo/irrigationAssociation.json", function(result){
	  	for(var i=0;i<result.length;i++){
	  		result[i].shape = "circle";
	  		result[i].radius = 5;
	  	}
	    this.agricultureData.association = result;
	}.bind(this));

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

WaterUseStatistic.prototype.ClearGraph = function(graphID){
	d3.select(graphID).selectAll("*").remove();
};

WaterUseStatistic.prototype.UpdateGraphOverview = function(){
	this.ClearGraph("#overviewConsumption");

	var DrawData = function(){
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
	}.bind(this);

	if(!this.overviewData.data){
		$.get("/statistic/waterUseOverview", function(result){
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
	        DrawData();
	    }.bind(this));
	}
	else DrawData();

	
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
			return "千立方公尺";
		case "灌溉面積":
			return "公頃";
		case "單位面積用水量":
			return "千立方公尺/公頃";
	}
};

WaterUseStatistic.prototype.UpdateGraphAgriculture = function(){
	this.ClearGraph("#agricultureMap");
	this.ClearGraph("#agricultureRank");
	var minColor = "#71D17B";
	var maxColor = "#417846";
	var DrawData = function(){
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
			minX: 0,
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
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
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
			minX: 0,
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
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
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
	}.bind(this);

	if(!this.agricultureData.data){
		$.get("/statistic/waterUseAgriculture", function(result){
	        if(result.status != "ok"){
	          return console.log(result.err);
	        }
	        for(var i=0;i<result.data.length;i++){
	        	var d = result.data[i];
	        	d.Year += 1911;
	        }
	        this.agricultureData.data = result.data;
	        Vue.set(this.agricultureData, "type", "灌溉用水");

	        var yearBound = d3.extent(result.data, function(d) { return d.Year; });
	        this.agricultureData.minYear = yearBound[0];
	        this.agricultureData.maxYear = yearBound[1];
	        DrawData();
	    }.bind(this));
	}
	else DrawData();
	
};

WaterUseStatistic.prototype.UpdateAgricultureDetail = function(){
	this.ClearGraph("#agricultureCategory");
	this.ClearGraph("#agricultureRatio");
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
		left: 80,
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

WaterUseStatistic.prototype.GetCultivationUnit = function(){
	switch(this.cultivationData.type){
		case "養殖用水":
			return "千立方公尺";
		case "養殖面積":
			return "公頃";
		case "單位面積用水量":
			return "千立方公尺/公頃";
	}
};

WaterUseStatistic.prototype.UpdateGraphCultivation = function(){
	this.ClearGraph("#cultivationMap");
	this.ClearGraph("#cultivationRank");
	var minColor = "#719ED1";
	var maxColor = "#415A78";
	var DrawData = function(){
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
			minX: 0,
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
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
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
			minX: 0,
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
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
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
	}.bind(this);

	if(!this.cultivationData.data){
		$.get("/statistic/waterUseCultivation",function(result){
	        if(result.status != "ok"){
	          return console.log(result.err);
	        }
	        for(var i=0;i<result.data.length;i++){
	        	var d = result.data[i];
	        	d.Year += 1911;
	        }
	        this.cultivationData.data = result.data;
	        Vue.set(this.cultivationData, "type", "養殖用水");

	        var yearBound = d3.extent(result.data, function(d) { return d.Year; });
	        this.cultivationData.minYear = yearBound[0];
	        this.cultivationData.maxYear = yearBound[1];
	        DrawData();
	    }.bind(this));
	}
	else DrawData();
	
};

WaterUseStatistic.prototype.UpdateCultivationDetail = function(){
	this.ClearGraph("#cultivationCategory");
	this.ClearGraph("#cultivationRatio");
	if(!this.cultivationData.select) return;
	
	var countyData = d3.nest()
    .key(function(d){return d.County;})
    .map(this.cultivationData.data);

  var data = countyData[this.cultivationData.select.id];
  data.sort(function(a,b){
  	return a.CultivationKind - b.CultivationKind;
  });

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
		left: 80,
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
  if(!arr) arr = [];
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

WaterUseStatistic.prototype.GetLivestockValue = function(d){
	switch(this.livestockData.type){
		case "畜牧用水":
			return d.WaterConsumption;
		case "畜牧數量":
			return 	d.LivestockQuantity;
		case "每千隻用水量":
			if(d.LivestockQuantity > 0){
				return d.WaterConsumption/d.LivestockQuantity;
			}
  		else return 0;
	}
};

WaterUseStatistic.prototype.GetLivestockUnit = function(){
	switch(this.livestockData.type){
		case "畜牧用水":
			return "千立方公尺";
		case "畜牧數量":
			return "千隻";
		case "每千隻用水量":
			return "千立方公尺/千隻";
	}
};

WaterUseStatistic.prototype.UpdateGraphLivestock = function(){
	this.ClearGraph("#livestockMap");
	this.ClearGraph("#livestockRank");
	var minColor = "#D17171";
	var maxColor = "#784141";
	var DrawData = function(){
		this.minYear = this.livestockData.minYear;
		this.maxYear = this.livestockData.maxYear;
		this.BoundYear();

		var yearData = d3.nest()
	    .key(function(d){return d.Year;})
	    .key(function(d){return d.County})
	    .rollup(function(arr){
	    	return d3.sum(arr, function(d){
	    		return 	this.GetLivestockValue(d);
	    	}.bind(this));
	    }.bind(this))
	    .map(this.livestockData.data);

		//compute water consumption
		var data = yearData[this.year];
		var dataArr = [];
		var minValue = Number.MAX_VALUE, maxValue = Number.MIN_VALUE;
		var unit =  this.GetLivestockUnit();
		for(var county in data){
			var d = data[county];
			dataArr.push({id: county, "name":this.countyMap[county],"value":d});
			if(d < minValue) minValue = d;
			if(d > maxValue) maxValue = d;
		}
		
		//===================livestock map===========================
		var param = {};
		param.selector = "#livestockMap";
		param.textInfo = "#livestockMapText";
		param.axis = {
			minX: 0,
			maxX: maxValue,
			minY: 0,
			maxY: dataArr.length
		};
		var livestockMap = {
			"type": "map",
			"unit": unit,
			"data": [
				{
					"name": "縣市統計",
					"color": {
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
					},
					"path": this.county,
					"value": dataArr,
					"clickFn": function(d){
						this.openDetailPanel = true;
						var select = {"id":d.id, "name":d.name};
						this.livestockData.select = select;
						this.UpdateLivestockDetail();
					}.bind(this)
				}
			]
		};
		param.graph = [livestockMap];
		var graph = new SvgGraph(param);
		graph.DrawGraph();

		//===================livestock rank===========================
		param = {};
		param.selector = "#livestockRank";
		param.textInfo = "#livestockRankText";
		param.padding = {
			top: 10, bottom: 10, left: 10, right: 10
		}
		param.axis = {
			minX: 0,
			maxX: maxValue,
			minY: 0,
			maxY: dataArr.length
		};
		var livestockRank = {
			"type": "rank",
			"unit": unit,
			"data": [
				{
					"name": "用水排名",
					"color": {
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
					},
					"value": dataArr,
					"clickFn": function(d){
						this.openDetailPanel = true;
						var select = {"id":d.id, "name":d.name};
						this.livestockData.select = select;
						this.UpdateLivestockDetail();
					}.bind(this)
				}
			]
		};
		param.graph = [livestockRank];
		graph = new SvgGraph(param);
		graph.DrawGraph();

		this.UpdateLivestockDetail();
	}.bind(this);

	if(!this.livestockData.data){
		$.get("/statistic/waterUseLivestock",function(result){
	        if(result.status != "ok"){
	          return console.log(result.err);
	        }
	        for(var i=0;i<result.data.length;i++){
	        	var d = result.data[i];
	        	d.Year += 1911;
	        	if(d.AnimalHusbandryKind != 7 && d.AnimalHusbandryKind != 8){
	        		d.LivestockQuantity /= 1000;	//隻 -> 千隻
	        	}
	        }
	        this.livestockData.data = result.data;
	        Vue.set(this.livestockData, "type", "畜牧用水");

	        var yearBound = d3.extent(result.data, function(d) { return d.Year; });
	        this.livestockData.minYear = yearBound[0];
	        this.livestockData.maxYear = yearBound[1];
	        DrawData();
	    }.bind(this));
	}
	else DrawData();
	
};

WaterUseStatistic.prototype.UpdateLivestockDetail = function(){
	this.ClearGraph("#livestockCategory");
	this.ClearGraph("#livestockRatio");
	if(!this.livestockData.select) return;

	var countyData = d3.nest()
    .key(function(d){return d.County;})
    .map(this.livestockData.data);

  var data = countyData[this.livestockData.select.id];
  data.sort(function(a,b){
  	return a.AnimalHusbandryKind - b.AnimalHusbandryKind;
  });

  var yearSum = d3.nest()
  	.key(function(d){return d.Year})
  	.rollup(function(arr){
  		return d3.sum(arr, function(d){
    		return 	this.GetLivestockValue(d);
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

  var unit = this.GetLivestockUnit();

  //====================livestock category=====================
	var param = {};
	param.selector = "#livestockCategory";
	param.textInfo = "#livestockCategoryText";
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
				"name": "總"+this.livestockData.type,
				"color": "#ff3333",
				"value": yearSum.map(function(d){
					return {"x": d.key, "y": d.values};
				})
			}
		]
	}

	var kindData = d3.nest()
    .key(function(d){return d.AnimalHusbandryKind;})
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
  			value.push({"x": year, "y":this.GetLivestockValue(d)});
  		}
  		else value.push({"x": year, "y":0});
  	}

  	dataArr.push({
  		"name": this.livestockKindMap[kind]+this.livestockData.type,
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

	//====================livestock ratio=====================
	var yearData = d3.nest()
    .key(function(d){return d.Year;})
    .map(data);
  var arr = yearData[this.year];
  if(!arr) arr = [];
	param = {};
	param.selector = "#livestockRatio";
	param.textInfo = "#livestockRatioText";
	
	var ratio = {
		"type": "pie",
		"inRadius": 50,
		"unit": unit,
		"data": arr.map(function(d){
			var name = this.livestockKindMap[d.AnimalHusbandryKind];
			return {"name": name, "value":this.GetLivestockValue(d)};
		}.bind(this))
	};
	param.graph = [ratio];
	graph = new SvgGraph(param);
	graph.DrawGraph();
};

WaterUseStatistic.prototype.GetIndustryValue = function(d){
	switch(this.industryData.type){
		case "工業用水":
			return d.IndustrialWaterConsumption;
		case "工業面積":
			return 	d.IndustryArea;
		case "單位面積用水量":
			if(d.IndustryArea > 0){
				return d.IndustrialWaterConsumption/d.IndustryArea;
			}
  		else return 0;
	}
};

WaterUseStatistic.prototype.GetIndustryUnit = function(){
	switch(this.industryData.type){
		case "工業用水":
			return "百萬立方公尺";
		case "工業面積":
			return "公頃";
		case "單位面積用水量":
			return "百萬立方公尺/公頃";
	}
};

WaterUseStatistic.prototype.UpdateGraphIndustry = function(){
	this.ClearGraph("#industryMap");
	this.ClearGraph("#industryRank");
	var minColor = "#cccccc";
	var maxColor = "#555555";
	var DrawData = function(){
		this.minYear = this.industryData.minYear;
		this.maxYear = this.industryData.maxYear;
		this.BoundYear();

		var yearData = d3.nest()
	    .key(function(d){return d.Year;})
	    .key(function(d){return d.County})
	    .rollup(function(arr){
	    	return d3.sum(arr, function(d){
	    		return 	this.GetIndustryValue(d);
	    	}.bind(this));
	    }.bind(this))
	    .map(this.industryData.data);

		//compute water consumption
		var data = yearData[this.year];
		var dataArr = [];
		var minValue = Number.MAX_VALUE, maxValue = Number.MIN_VALUE;
		var unit =  this.GetIndustryUnit();
		for(var county in data){
			var d = data[county];
			dataArr.push({id: county, "name":this.countyMap[county],"value":d});
			if(d < minValue) minValue = d;
			if(d > maxValue) maxValue = d;
		}
		
		//===================industry map===========================
		var param = {};
		param.selector = "#industryMap";
		param.textInfo = "#industryMapText";
		param.axis = {
			minX: 0,
			maxX: maxValue,
			minY: 0,
			maxY: dataArr.length
		};
		var industryMap = {
			"type": "map",
			"unit": unit,
			"data": [
				{
					"name": "縣市統計",
					"color": {
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
					},
					"path": this.county,
					"value": dataArr,
					"clickFn": function(d){
						this.openDetailPanel = true;
						var select = {"id":d.id, "name":d.name};
						this.industryData.select = select;
						this.UpdateIndustryDetail();
					}.bind(this)
				}
			]
		};
		param.graph = [industryMap];
		var graph = new SvgGraph(param);
		graph.DrawGraph();

		//===================industry rank===========================
		param = {};
		param.selector = "#industryRank";
		param.textInfo = "#industryRankText";
		param.padding = {
			top: 10, bottom: 10, left: 10, right: 10
		}
		param.axis = {
			minX: 0,
			maxX: maxValue,
			minY: 0,
			maxY: dataArr.length
		};
		var industryRank = {
			"type": "rank",
			"unit": unit,
			"data": [
				{
					"name": "用水排名",
					"color": {
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
					},
					"value": dataArr,
					"clickFn": function(d){
						this.openDetailPanel = true;
						var select = {"id":d.id, "name":d.name};
						this.industryData.select = select;
						this.UpdateIndustryDetail();
					}.bind(this)
				}
			]
		};
		param.graph = [industryRank];
		graph = new SvgGraph(param);
		graph.DrawGraph();

		this.UpdateIndustryDetail();
	}.bind(this);

	if(!this.industryData.data){
		$.get("/statistic/waterUseIndustry",function(result){
	        if(result.status != "ok"){
	          return console.log(result.err);
	        }
	        for(var i=0;i<result.data.length;i++){
	        	var d = result.data[i];
	        	d.Year += 1911;
	        }
	        this.industryData.data = result.data;
	        Vue.set(this.industryData, "type", "工業用水");

	        var yearBound = d3.extent(result.data, function(d) { return d.Year; });
	        this.industryData.minYear = yearBound[0];
	        this.industryData.maxYear = yearBound[1];
	        DrawData();
	    }.bind(this));
	}
	else DrawData();
	
};

WaterUseStatistic.prototype.UpdateIndustryDetail = function(){
	this.ClearGraph("#industryCategory");
	this.ClearGraph("#industryRatio");
	if(!this.industryData.select) return;

	var countyData = d3.nest()
    .key(function(d){return d.County;})
    .map(this.industryData.data);

  var data = countyData[this.industryData.select.id];
  data.sort(function(a,b){
  	return a.Category - b.Category;
  });

  var yearSum = d3.nest()
  	.key(function(d){return d.Year})
  	.rollup(function(arr){
  		return d3.sum(arr, function(d){
    		return 	this.GetIndustryValue(d);
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

  var unit = this.GetIndustryUnit();

  //====================industry category=====================
	var param = {};
	param.selector = "#industryCategory";
	param.textInfo = "#industryCategoryText";
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
				"name": "總"+this.industryData.type,
				"color": "#ff3333",
				"value": yearSum.map(function(d){
					return {"x": d.key, "y": d.values};
				})
			}
		]
	}

	var kindData = d3.nest()
    .key(function(d){return d.Category;})
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
  			value.push({"x": year, "y":this.GetIndustryValue(d)});
  		}
  		else value.push({"x": year, "y":0});
  	}

  	dataArr.push({
  		"name": this.industryKindMap[kind]+this.industryData.type,
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

	//====================industry ratio=====================
	var yearData = d3.nest()
    .key(function(d){return d.Year;})
    .map(data);
  var arr = yearData[this.year];
  if(!arr) arr = [];
	param = {};
	param.selector = "#industryRatio";
	param.textInfo = "#industryRatioText";
	
	var ratio = {
		"type": "pie",
		"inRadius": 50,
		"unit": unit,
		"data": arr.map(function(d){
			var name = this.industryKindMap[d.Category];
			return {"name": name, "value":this.GetIndustryValue(d)};
		}.bind(this))
	};
	param.graph = [ratio];
	graph = new SvgGraph(param);
	graph.DrawGraph();
};

WaterUseStatistic.prototype.GetLivingValue = function(d){
	switch(this.livingData.type){
		case "每人每日配水量":
			return d.DistributedWaterQuantityPerPersonPerDay;
		case "每人每日生活總用水量":
			return d.DomesticWaterConsumptionPerPersonPerDay;
		case "自行取水用水人口":
			return d.SelfIntakePopulation;
		case "自行取水年用水量":
			return d.SelfIntakeWaterConsumption;
		case "自行取水每人每日生活用水量":
			return	d.SelfIntakeWaterConsumptionPerPersonPerDay;
		case "自來水年用水量":
			return	d.TapWaterConsumption;
		case "自來水供水人口":
			return d.TapWaterPopulation;
		case "每人每日售水量":
			return d.WaterSalesPerPersonPerDay;
	}
};

WaterUseStatistic.prototype.GetLivingUnit = function(){
	switch(this.livingData.type){
		case "每人每日配水量":
			return "公升/人/每日";
		case "每人每日生活總用水量":
			return 	"公升/人/每日";
		case "自行取水用水人口":
			return "人";
		case "自行取水年用水量":
			return "千立方公尺";
		case "自行取水每人每日生活用水量":
			return "公升/人/每日";
		case "自來水年用水量":
			return "千立方公尺";
		case "自來水供水人口":
			return "人";
		case "每人每日售水量":
			return "公升/人/每日";
	}
};

WaterUseStatistic.prototype.UpdateGraphLiving = function(){
	this.ClearGraph("#livingMap");
	this.ClearGraph("#livingRank");
	var minColor = "#FFB373";
	var maxColor = "#7A5537";
	var DrawData = function(){
		this.minYear = this.livingData.minYear;
		this.maxYear = this.livingData.maxYear;
		this.BoundYear();

		var yearData = d3.nest()
	    .key(function(d){return d.Year;})
	    .key(function(d){return d.County})
	    .rollup(function(arr){
	    	return d3.sum(arr, function(d){
	    		return 	this.GetLivingValue(d);
	    	}.bind(this));
	    }.bind(this))
	    .map(this.livingData.data);

		//compute water consumption
		var data = yearData[this.year];
		var dataArr = [];
		var minValue = Number.MAX_VALUE, maxValue = Number.MIN_VALUE;
		var unit =  this.GetLivingUnit();
		for(var county in data){
			var d = data[county];
			dataArr.push({id: county, "name":this.countyMap[county],"value":d});
			if(d < minValue) minValue = d;
			if(d > maxValue) maxValue = d;
		}
		
		//===================living map===========================
		var param = {};
		param.selector = "#livingMap";
		param.textInfo = "#livingMapText";
		param.axis = {
			minX: 0,
			maxX: maxValue,
			minY: 0,
			maxY: dataArr.length
		};
		var livingMap = {
			"type": "map",
			"unit": unit,
			"data": [
				{
					"name": "縣市統計",
					"color": {
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
					},
					"path": this.county,
					"value": dataArr,
					"clickFn": function(d){
						this.openDetailPanel = true;
						var select = {"id":d.id, "name":d.name};
						this.livingData.select = select;
						this.UpdateLivingDetail();
					}.bind(this)
				}
			]
		};
		param.graph = [livingMap];
		var graph = new SvgGraph(param);
		graph.DrawGraph();

		//===================living rank===========================
		param = {};
		param.selector = "#livingRank";
		param.textInfo = "#livingRankText";
		param.padding = {
			top: 10, bottom: 10, left: 10, right: 10
		}
		param.axis = {
			minX: 0,
			maxX: maxValue,
			minY: 0,
			maxY: dataArr.length
		};
		var livingRank = {
			"type": "rank",
			"unit": unit,
			"data": [
				{
					"name": "用水排名",
					"color": {
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
					},
					"value": dataArr,
					"clickFn": function(d){
						this.openDetailPanel = true;
						var select = {"id":d.id, "name":d.name};
						this.livingData.select = select;
						this.UpdateLivingDetail();
					}.bind(this)
				}
			]
		};
		param.graph = [livingRank];
		graph = new SvgGraph(param);
		graph.DrawGraph();

		this.UpdateLivingDetail();
	}.bind(this);

	if(!this.livingData.data){
		$.get("/statistic/waterUseLiving",function(result){
	        if(result.status != "ok"){
	          return console.log(result.err);
	        }
	        for(var i=0;i<result.data.length;i++){
	        	var d = result.data[i];
	        	d.Year += 1911;
	        }
	        this.livingData.data = result.data;
	        Vue.set(this.livingData, "type", "每人每日配水量");

	        var yearBound = d3.extent(result.data, function(d) { return d.Year; });
	        this.livingData.minYear = yearBound[0];
	        this.livingData.maxYear = yearBound[1];
	        DrawData();
	    }.bind(this));
	}
	else DrawData();
	
};

WaterUseStatistic.prototype.UpdateLivingDetail = function(){
	this.ClearGraph("#monthUse");
	if(!this.livingData.select) return;
	var DrawData = function(){
		var data = this.livingData.monthUse[this.year];
		if(!data) data = [];
		data = data[this.livingData.select.name];
		if(!data) data = [];

		var graphData = [];
		for(var town in data){
			var dataSet = {};
			dataSet.name = town;
			dataSet.value = data[town].map(function(d){
				return {x: d.Month, y:d.TheDailyDomesticConsumptionOfWaterPerPerson};
			});
			graphData.push(dataSet);
		}

		var param = {};
		param.selector = "#monthUse";
		param.textInfo = "#monthUseText";
		param.padding = {
			left: 50,
			right: 20,
			top: 20,
			bottom: 20
		};
		param.axis = {
			minX: 1,
			maxX: 12,
			minY: 0,
			maxY: this.livingData.monthUseExtreme[1],
			draw: true
		};
		
		var monthUse = {
			"type": "line",
			"unitX": "月",
			"unitY": "公升",
			"data": graphData
		};
		param.graph = [monthUse];
		var graph = new SvgGraph(param);
		graph.DrawGraph();
	}.bind(this);

	if(!this.livingData.monthUse){
		$.get("/statistic/monthWaterUse",function(result){
	        if(result.status != "ok"){
	          return console.log(result.err);
	        }
	        for(var i=0;i<result.data.length;i++){
	        	var d = result.data[i];
	        	d.Year += 1911;
	        }
	        this.livingData.monthUseExtreme = d3.extent(result.data, function(d){
	        	return d.TheDailyDomesticConsumptionOfWaterPerPerson;
	        });
	        this.livingData.monthUse = d3.nest()
			    .key(function(d){return d.Year;})
			    .key(function(d){return d.County})
			    .key(function(d){return d.Town})
			    .map(result.data);
	        DrawData();
	    }.bind(this));
	}
	else DrawData();
};

WaterUseStatistic.prototype.GetReservoirValue = function(d){
	switch(this.reservoirData.type){
		case "發電水量回流":
			return d.BackWaterVolumeOfPowerGeneration;
		case "發電水量放流":
			return 	d.DischargeWaterVolumeOfPowerGeneration;
		case "洩洪量":
			return d.FlushingVolume;
		case "農業用水量":
			return d.GrossVolumeOfWaterConsumptionForAgricultureWater;
		case "各標的用水量總計":
			return d.GrossVolumeOfWaterConsumptionForAllPurposes;
		case "生活用水量":
			return d.GrossVolumeOfWaterConsumptionForDomesticWater;
  		case "工業用水量":
			return d.GrossVolumeOfWaterConsumptionForIndustrialWater;
		case "進水量":
			return d.InflowVolume;
		case "損耗水量":
			return d.LeakageVolume;
		case "其他放流量":
			return d.OthersDischargeVolume;
		case "淤積增減量":
			return d.SedimentationVariation;
	}
};

WaterUseStatistic.prototype.GetReservoirUnit = function(){
	return "萬立方公尺";
};

WaterUseStatistic.prototype.UpdateGraphReservoir = function(){
	this.ClearGraph("#reservoirMap");
	this.ClearGraph("#reservoirRank");
	var minColor = "#71D17B";
	var maxColor = "#417846";
	var DrawData = function(){
		this.minYear = this.reservoirData.minYear;
		this.maxYear = this.reservoirData.maxYear;
		this.BoundYear();

		var reservoirHash = {};
		for(var key in g_APP.reservoirData.station){
			var s = g_APP.reservoirData.station[key];
			reservoirHash[s.ReservoirName] = s;
		}

		var yearData = d3.nest()
	    .key(function(d){return d.Year;})
	    .rollup(function(arr){
	    	var result = [];
	    	for(var i=0;i<arr.length;i++){
	    		var d = arr[i];
	    		var s = reservoirHash[d.ReservoirName];
	    		var value = this.GetReservoirValue(d);
	    		if(!s || !value) continue;
	    		result.push({
	    			id: s.id,
	    			lat: s.lat,
		    		lng: s.lng,
		    		name: d.ReservoirName,
		    		value: value,
		    		shape: "circle",
		    		radius: 5
	    		});
	    	}
	    	return result;
	    }.bind(this))
	    .map(this.reservoirData.data);

		var data = yearData[this.year];
		var minValue = Number.MAX_VALUE, maxValue = Number.MIN_VALUE;
		for(var i=0;i<data.length;i++){
			var d = data[i];
			if(d.value < minValue) minValue = d.value;
			if(d.value > maxValue) maxValue = d.value;
		}
		var unit =  this.GetReservoirUnit();

		//===================agriculture map===========================
		var param = {};
		param.selector = "#reservoirMap";
		param.textInfo = "#reservoirMapText";
		param.axis = {
			minX: 0,
			maxX: maxValue,
			minY: 0,
			maxY: Math.min(20,data.length)
		};
		var reservoirMap = {
			"type": "map",
			"unit": unit,
			"data": [
				{
					"name": "水庫位置",
					"color": {
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
					},
					"path": this.county,
					"marker": data,
					/*"clickFn": function(d){
						this.openDetailPanel = true;
						var select = {"id":d.id, "name":d.name};
						this.reservoirData.select = select;
						this.UpdateReservoirDetail();
					}.bind(this)*/
				}
			]
		};
		param.graph = [reservoirMap];
		var graph = new SvgGraph(param);
		graph.DrawGraph();

		//===================agriculture rank===========================
		param = {};
		param.selector = "#reservoirRank";
		param.textInfo = "#reservoirRankText";
		param.padding = {
			top: 10, bottom: 10, left: 10, right: 10
		}
		param.axis = {
			minX: 0,
			maxX: maxValue,
			minY: 0,
			maxY: Math.min(20,data.length)
		};
		var reservoirRank = {
			"type": "rank",
			"unit": unit,
			"data": [
				{
					"name": "用水排名",
					"color": {
						"minValue": minValue,
						"maxValue": maxValue,
						"minColor": minColor,
						"maxColor": maxColor
					},
					"value": data,
					/*"clickFn": function(d){
						this.openDetailPanel = true;
						var select = {"id":d.id, "name":d.name};
						this.reservoirData.select = select;
						this.UpdateReservoirDetail();
					}.bind(this)*/
				}
			]
		};
		param.graph = [reservoirRank];
		graph = new SvgGraph(param);
		graph.DrawGraph();

		this.UpdateReservoirDetail();
	}.bind(this);

	if(!this.reservoirData.data){
		$.get("/statistic/reservoirUse", function(result){
	        if(result.status != "ok"){
	          return console.log(result.err);
	        }
	        for(var i=0;i<result.data.length;i++){
	        	var d = result.data[i];
	        	d.Year += 1911;
	        }
	        this.reservoirData.data = result.data;
	        Vue.set(this.reservoirData, "type", "進水量");

	        var yearBound = d3.extent(result.data, function(d) { return d.Year; });
	        this.reservoirData.minYear = yearBound[0];
	        this.reservoirData.maxYear = yearBound[1];
	        DrawData();
	    }.bind(this));
	}
	else DrawData();
};

WaterUseStatistic.prototype.UpdateReservoirDetail = function(){

};