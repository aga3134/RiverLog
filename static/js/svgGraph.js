
function SvgGraph(param){
	//remove all children then append svg
	this.selector = param.selector;
	this.textInfo = param.textInfo;
	var graph = $(this.selector);
	graph.empty();
	this.svg = d3.select(param.selector).append("svg");

	this.graphArr = param.graph;
	this.axis = param.axis;
	this.padding = {left: 20, right: 20, top: 20, bottom: 20};
	if(param.padding) this.padding = param.padding;

	this.w = graph.width();
	this.h = graph.height();
	if(this.w <= 0) this.w = 400;
	if(this.h <= 0) this.h = 300;
	if(this.axis){
		if(this.axis.typeX == "time"){
			this.scaleW = d3.time.scale()
				.domain([this.axis.minX,this.axis.maxX])
				.range([0,this.w-this.padding.left-this.padding.right]);
		}
		else{
			this.scaleW = d3.scale.linear()
				.domain([this.axis.minX,this.axis.maxX])
				.range([0,this.w-this.padding.left-this.padding.right]);
		}
		this.scaleH = d3.scale.linear()
			.domain([this.axis.minY,this.axis.maxY])
			.range([this.h-this.padding.bottom-this.padding.top,0]);
	}
	

	this.palettes = ["#a2b9bc","#b2ad7f", "#878f99", " #6b5b95",
					 "#d6cbd3", "#eca1a6", "#bdcebe", "#ada397",
					 "#d5e1df","#e3eaa7", "#b5e7a0", "#86af49",
					 "#b9936c","#dac292", "#e6e2d3", "#c4b7a6",
					 "#3e4444","#82b74b","#405d27", "#c1946a"];
}

SvgGraph.prototype.DrawGraph = function(){
	this.ClearGraph();
	for(var i=0;i<this.graphArr.length;i++){
		var graph = this.graphArr[i];
		switch(graph.type){
			case "map":
				this.DrawGraphMap(graph);
				break;
			case "line":
				this.DrawGraphLine(graph);
				break;
			case "rank":
				this.DrawGraphRank(graph);
				break;
			case "stack":
				this.DrawGraphStack(graph);
				break;
			case "pie":
				this.DrawGraphPie(graph);
				break;
		}
	}
	this.DrawAxis();
};

SvgGraph.prototype.DrawAxis = function(){
	if(!this.axis || !this.axis.draw) return;
	var xAxis = d3.svg.axis().orient("bottom").scale(this.scaleW);
	if(this.axis.typeX == "time"){
		var format = d3.time.format(this.axis.format);
		xAxis.tickFormat(function(d){return format(d)});
	}
	else xAxis.tickFormat(function(d){return d;});
	
	var yAxis = d3.svg.axis().orient("left").scale(this.scaleH);
	var offsetY = this.axis.alignZero?this.scaleH(0):this.h-this.padding.bottom;

	var xAxisGroup = this.svg.append("g").call(xAxis)
		.attr({
			"font-size": "12px",
			"transform":"translate("+this.padding.left+","+offsetY+")",
			"fill":"black",
			"stroke":"black",
			"stroke-width": 0.5
		});
	xAxisGroup.select('path')
  		.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});
		
	var yAxisGroup = this.svg.append("g").call(yAxis)
		.attr({
			"font-size": "12px",
			"transform":"translate("+this.padding.left+","+this.padding.bottom+")",
			"fill":"black",
			"stroke":"black",
			"stroke-width": 0.5
		});
	yAxisGroup.select('path')
		.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});

	if(this.axis.curX){
		this.svg.append("line")
			.style({
				"stroke":"#33ff33",
				"stroke-width":2
			})
			.attr({
				"x1":this.scaleW(this.axis.curX)+this.padding.left,
				"y1":this.padding.top,
				"x2":this.scaleW(this.axis.curX)+this.padding.left,
				"y2":this.h-this.padding.bottom
			});
	}
};

SvgGraph.prototype.DrawGraphMap = function(graph){
	var proj = d3.geo.mercator()
   			.center([120.7764642,23.622094])
   			.scale(4500)
   			.translate([this.w*0.5, this.h*0.5]);

    var pathFn = d3.geo.path().projection(proj);
    var textInfo = $(this.textInfo);
	for(var i=0;i<graph.data.length;i++){
		var data = graph.data[i];
		var color = d3.scale.linear()
			.domain([this.axis.minX, this.axis.maxX])
        	.range([data.color.minColor, data.color.maxColor]);
		var bg = this.svg.append("g");
		bg.selectAll("path").data(data.path)
    		.enter().append("path")
    		.attr("data-county", function(d){
    			return d.properties.COUNTYNAME;
    		})
    		.attr("d",pathFn)
    		.attr("fill","none")
    		.attr("stroke","#333333");

    	if(data.value){
    		for(var j=0;j<data.value.length;j++){
    			var d = data.value[j];
    			var clickFn = function(){
    				var value = d;
	    			return function(){
	    				data.clickFn(value);
	    			};
	    		}();
    			bg.selectAll("path[data-county='"+d.name+"']")
    				.style("cursor","pointer")
    				.attr("fill", color(d.value))
    				.attr("data-value", d.value?d.value.toFixed(2):"NaN")
    				.attr("data-name", d.name)
    				.on("mouseover",function(){
						var cur = d3.select(this);
						textInfo.text(cur.attr("data-name")+": "+cur.attr("data-value")+graph.unit);
					})
					.on("mouseout",function(){
						textInfo.text("");
					})
					.on("click",clickFn);
    		}
    	}

    	if(data.marker){
    		var markerGroup = this.svg.append("g");
	    	for(var j=0;j<data.marker.length;j++){
	    		var marker = data.marker[j];
	    		var clickFn = function(){
	    			var d = marker;
	    			return function(){
	    				data.clickFn(d);
	    			};
	    		}();
	    		var pt = proj([marker.lng, marker.lat]);
	    		markerGroup.append('circle')
	    			.style("cursor","pointer")
	    			.attr("fill", color(marker.value))
	    			.attr("stroke","#ffffff")
	            	.attr("cx",pt[0])
	            	.attr("cy", pt[1])
	            	.attr("r", marker.radius)
	            	.attr("data-name", marker.name)
	            	.attr("data-value", marker.value?marker.value.toFixed(2):"NaN")
	            	.on("mouseover",function(){
						var cur = d3.select(this);
						textInfo.text(cur.attr("data-name")+": "+cur.attr("data-value")+graph.unit);
					})
					.on("mouseout",function(){
						textInfo.text("");
					})
					.on("click",clickFn);
	    	}
    	}
    	
	}
};

SvgGraph.prototype.DrawGraphLine = function(graph){
	var line = d3.svg.line()
		.x(function(d){
			return parseInt(this.scaleW(d.x))+this.padding.left;
		}.bind(this))
		.y(function(d){
			return parseInt(this.scaleH(d.y))+this.padding.top;
		}.bind(this));

	var format = null;
	if(this.axis.typeX == "time"){
		format = d3.time.format(this.axis.format);
	}

	var textInfo = $(this.textInfo);
	for(var i=0;i<graph.data.length;i++){
		var data = graph.data[i];
		var color = data.color?data.color:this.palettes[i%this.palettes.length];

		var lineChart = this.svg.append("g");
		lineChart.append("path")
			.attr("fill", "none")
			.attr("stroke", color)
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", line(data.value));

		var circleGroup = this.svg.append("g");
		circleGroup.selectAll("circle").data(data.value)
			.enter().append("circle")
			.style("cursor","pointer")
			.attr("r",10)
			.attr("opacity",0)
			.attr("fill","white")
			.attr("stroke",color)
			.attr("stroke-width",0.5)
			.attr("cx", function(d){
				return this.padding.left+this.scaleW(d.x);
			}.bind(this))
			.attr("cy", function(d){
				return this.padding.top+this.scaleH(d.y);
			}.bind(this))
			.attr("data-name",data.name)
			.on("mouseover",function(d){
				var cur = d3.select(this);
				cur.attr("opacity",0.5);
				var x = d.x;
				if(format){
					x = format(x);
				}
				textInfo.text(x+graph.unitX+" "+cur.attr("data-name")+": "+d.y.toFixed(2)+graph.unitY);
			})
			.on("mouseout",function(d){
				d3.select(this).attr("opacity",0);
				textInfo.text("");
			})
			.on("click",data.clickFn);
	}
};

SvgGraph.prototype.DrawGraphRank = function(graph){
	var textInfo = $(this.textInfo);
	var rectH = this.scaleH(0)-this.scaleH(1);

	for(var i=0;i<graph.data.length;i++){
		var data = graph.data[i];
		data.value = data.value.sort(function(a,b){
			return b.value - a.value;
		});
		var color = d3.scale.linear()
			.domain([data.color.minValue, data.color.maxValue])
        	.range([data.color.minColor, data.color.maxColor]);
		
		var rankGroup = this.svg.append("g");
		rankGroup.selectAll("rect").data(data.value)
    		.enter().append("rect")
    		.style("cursor","pointer")
    		.attr("x",this.padding.left)
    		.attr("y",function(d,i){
    			return this.padding.top+rectH*i;
    		}.bind(this))
    		.attr("width",function(d){
    			return this.scaleW(d.value);
    		}.bind(this))
    		.attr("height",rectH)
    		.attr("fill",function(d){
    			return color(d.value);
    		})
    		.attr("stroke","#ffffff")
    		.on("mouseover",function(d){
				var cur = d3.select(this);
				textInfo.text(d.name+": "+d.value.toFixed(2)+graph.unit);
			})
			.on("mouseout",function(d){
				textInfo.text("");
			})
			.on("click",data.clickFn);

    	var textGroup = this.svg.append("g");
		textGroup.selectAll("text").data(data.value)
    		.enter().append("text")
    		.style("cursor","pointer")
    		.attr("x",this.padding.left+10)
    		.attr("y",function(d,i){
    			return this.padding.top+rectH*(i+0.5);
    		}.bind(this))
    		.attr("fill","#ffffff")
    		.attr("font-size","12px")
    		.attr("alignment-baseline","middle")
    		.text(function(d){
    			return d.name;
    		})
    		.on("mouseover",function(d){
				var cur = d3.select(this);
				textInfo.text(d.name+": "+d.value.toFixed(2)+graph.unit);
			})
			.on("mouseout",function(d){
				textInfo.text("");
			})
			.on("click",data.clickFn);
	}
};

SvgGraph.prototype.DrawGraphStack = function(graph){
	var stack = d3.layout.stack();
	var dataArr = [];
	var sum = {};
	for(var i=0;i<graph.data.length;i++){
		var data = graph.data[i];
		dataArr.push(data.value);
		if(graph.data.length > 1){
			for(var j=0;j<data.value.length;j++){
				var key = data.value[j].x;
				if(key in sum){
					sum[key] += data.value[j].y;
				}
				else{
					sum[key] = data.value[j].y;
				}
			}
		}
	}
	var stackData = stack(dataArr);

	var rectW = (this.scaleW(1)-this.scaleW(0))*0.5;
	var textInfo = $(this.textInfo);
	for(var i=0;i<graph.data.length;i++){
		var stackChart = this.svg.append("g");
		var data = graph.data[i];
		var color = data.color?data.color:this.palettes[i%this.palettes.length];
		stackChart.selectAll("rect").data(stackData[i])
			.enter().append("rect")
			.style("cursor","pointer")
			.attr("fill", color)
			.attr("stroke", "#ffff00")
			.attr("stroke-width", 0)
			.attr("x", function(d){
				return this.padding.left+this.scaleW(d.x)-0.5*rectW;
			}.bind(this))
			.attr("y", function(d){
				return this.padding.top+this.scaleH(d.y+d.y0);
			}.bind(this))
			.attr("height", function(d){
				return this.scaleH(d.y0) - this.scaleH(d.y + d.y0);
			}.bind(this))
			.attr("data-name", data.name)
			.attr("width", rectW)
			.on("mouseover",function(d){
				var cur = d3.select(this);
				cur.style("stroke-width",2);
				
				var str = d.x+graph.unitX+" "+cur.attr("data-name")+": "+d.y.toFixed(2)+graph.unitY;
				if(d.x in sum){
					var ratio = (d.y/sum[d.x]*100).toFixed(2);
					str += "("+ratio+"%)";
				}
				textInfo.text(str);
			})
			.on("mouseout",function(d){
				d3.select(this).style("stroke-width",0);
				textInfo.text("");
			})
			.on("click",data.clickFn);
	}
};

SvgGraph.prototype.DrawGraphPie = function(graph){
	var inRadius = graph.inRadius||0;
	var radius = Math.min(this.w,this.h)*0.5;
	var arc = d3.svg.arc()
	    .outerRadius(radius)
	    .innerRadius(inRadius);

	var pie = d3.layout.pie()
	    .sort(null)
	    .value(function(d){return d.value;});

	var textInfo = $(this.textInfo);
	var pieGroup = this.svg.append("g")
		.attr("transform", "translate(" + this.w*0.5 + "," + this.h*0.5 + ")");
	pieGroup.selectAll("path").data(pie(graph.data)).enter()
		.append("path")
		.attr("d", arc)
		.attr("stroke","#ffffff")
		.attr("stroke-width",0)
		.attr("fill", function(d,i){
			if(d.color) return d.color;
			else return this.palettes[i%this.palettes.length];
		}.bind(this))
		.on("mouseover",function(d){
			var cur = d3.select(this);
			cur.style("stroke-width",2);
			var percent = (100*(d.endAngle-d.startAngle)/(2*Math.PI)).toFixed(2)
			var str = d.data.name+": "+d.data.value.toFixed(2)+graph.unit+"("+percent+"%)";
			textInfo.text(str);
		})
		.on("mouseout",function(d){
			var cur = d3.select(this);
			cur.style("stroke-width",0);
			textInfo.text("");
		})
		.on("click",function(d){

		});
	
};

SvgGraph.prototype.ClearGraph = function(){
	this.svg.selectAll("*").remove();
};


var g_SvgGraph = function(){
	

	function MapTW(param){
		var map = param.map;
		var color = d3.scale.log().domain([param.minBound,param.maxBound]).range([param.minColor,param.maxColor]);
		var textInfo = $(param.textInfo);
		map.SetData(param.data,color,param.hoverColor,param.selectColor);
	  	map.OnHover(function(){
	  		if(map.GetHoverKey() != ""){
	  			var num = g_Util.NumberWithCommas(map.GetHoverValue());
	  			textInfo.text(map.GetHoverKey()+": "+num+param.unit);
	  		}
	  		else if(map.GetSelectKey() != ""){
	  			var num = g_Util.NumberWithCommas(map.GetSelectValue());
	  			textInfo.text(map.GetSelectKey()+": "+num+param.unit);
	  		}
	  		else{
	  			textInfo.text(param.unit);
	  		}
	  	});
	  	map.OnHoverOut(function(){
	  		if(map.GetSelectKey() != ""){
	  			var num = g_Util.NumberWithCommas(map.GetSelectValue());
	  			textInfo.text(map.GetSelectKey()+": "+num+param.unit);
	  		}
	  		else{
	  			textInfo.text(param.unit);
	  		}
	  	});
	  	map.OnClick(function(){
	  		if(param.clickFn) param.clickFn(map);
	  	});
	  	switch(param.type){
	  		case 1: map.DrawMapTW(param.selector,param.year); break;
	  		case 2: map.DrawSortBar(param.selector,param.maxBound); break;
	  	}
	  	
	  	if(map.GetSelectKey() != ""){
	  		var num = g_Util.NumberWithCommas(map.GetSelectValue());
	  		textInfo.text(map.GetSelectKey()+": "+num+param.unit);
	  	}
  	}

	var PopulationPyramid = function(param){
		if(param.data == null) return;

		var graph = $(param.selector);
		var w = graph.width(), h = graph.height();
		var svg = d3.select(param.selector);
		svg.selectAll("*").remove();
		var scaleW = d3.scale.linear().domain([0,param.pyramidScale]).range([0,w*0.5]);
		var scaleH = d3.scale.linear().domain([0,100]).range([0,h]);

		function HoverFn(item){
			if(item.empty()) return;
			hoverRect
				.attr("x",item.attr("x"))
				.attr("y",item.attr("y"))
				.attr("width",item.attr("width"))
				.attr("height",item.attr("height"));
			$(param.textInfo).text(item.attr("data-info"));
			if(param.hoverFn) param.hoverFn(item);
		}

		//console.log(param.data["男"]);
		var maleGroup = svg.append("g");
		maleGroup.selectAll("rect").data(param.data["男"])
			.enter().append("rect")
			.attr("data-hover", function(d){
				var str = d.minAge+"~"+d.maxAge+"-男";
				return str;
			})
			.attr("data-info",function(d){
				var num = g_Util.NumberWithCommas(d.count);
				if(d.minAge == d.maxAge) return d.minAge+"歲 男: "+num+" 人";
				else return d.minAge+"~"+d.maxAge+"歲 男: "+num+" 人";
			})
			.attr("width", function(d){return scaleW(d.count);})
			.attr("height", function(d){return scaleH(d.maxAge-d.minAge+1);})
			.attr("stroke","#ffffff")
			.attr("fill","#A1AFC9")
			.attr("x", function(d){return w*0.5-scaleW(d.count);})
			.attr("y", function(d){return h-scaleH(d.maxAge+1);})
			.on("mouseover",function(){
				HoverFn(d3.select(this));
			});

		var femaleGroup = svg.append("g");
		femaleGroup.selectAll("rect").data(param.data["女"])
			.enter().append("rect")
			.attr("data-hover", function(d){
				var str = d.minAge+"~"+d.maxAge+"-女";
				return str;
			})
			.attr("data-info",function(d){
				var num = g_Util.NumberWithCommas(d.count);
				if(d.minAge == d.maxAge) return d.minAge+"歲 女: "+num+" 人";
				else return d.minAge+"~"+d.maxAge+"歲 女: "+num+" 人";
			})
			.attr("width", function(d){return scaleW(d.count);})
			.attr("height", function(d){return scaleH(d.maxAge-d.minAge+1);})
			.attr("stroke","#ffffff")
			.attr("fill","#F47983")
			.attr("x", function(d){return w*0.5;})
			.attr("y", function(d){return h-scaleH(d.maxAge+1);})
			.on("mouseover",function(){
				HoverFn(d3.select(this));
			});

		var hoverRect = svg.append("rect").attr("class","hoverRect")
			.attr("stroke","#FFAA0D")
			.attr("stroke-width",2)
			.attr("fill","none");

		if(param.hover){
			var item = svg.select("rect[data-hover='"+param.hover+"']");
			HoverFn(item);
		}
	};

	var TimeLine = function(param){
		console.log(param);
		if(param.data == null) return;

		//compute scale
		var graph = $(param.selector);
		var w = graph.width(), h = graph.height();
		var svg = d3.select(param.selector);
		svg.selectAll("*").remove();
		var padL = param.padL||30,padR = param.padR||20,padT = param.padT||20,padB = param.padB||30;
		var scaleW = d3.scale.linear().domain([param.minTime,param.maxTime]).range([0,w-padL-padR]);
		var scaleH = d3.scale.linear().domain([param.maxValue,param.minValue]).range([0,h-padT-padB]);

		var line = d3.svg.line()
			.x(function(d) {return parseInt(scaleW(d[param.axisX]))+padL;})
			.y(function(d) {return parseInt(scaleH(d[param.axisY]))+padT;});

		//draw axis
		var xAxis = d3.svg.axis().orient("bottom").scale(scaleW).ticks(w/75)
			.tickFormat(function(d,i){
				if(i==0) return "";
				else return d;
			});
		var yAxis = d3.svg.axis().orient("left").scale(scaleH).ticks(10);
		var offsetY = param.alignZero?padT+scaleH(0):h-padB;
		var xAxisGroup = svg.append("g").call(xAxis)
			.attr({
				"font-size": "12px",
				"transform":"translate("+padL+","+offsetY+")",
  				"fill":"black",
  				"stroke":"black",
  				"stroke-width": 0.5
  			});
		xAxisGroup.select('path')
  			.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});
		var yAxisGroup = svg.append("g").call(yAxis)
			.attr({
				"font-size": "12px",
				"transform":"translate("+padL+","+padT+")",
  				"fill":"black",
  				"stroke":"black",
  				"stroke-width": 0.5
  			});
		yAxisGroup.select('path')
  			.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});

  		//time line & hover text
  		var timeLine = svg.append("line").attr("class","timeLine")
  			.attr("stroke","#cccccc")
  			.attr("x1",scaleW(param.time)+padL)
  			.attr("y1",padT)
  			.attr("x2",scaleW(param.time)+padL)
  			.attr("y2",h-padB);

		//draw data
		var lineStep = 15;
		var index = 0;
		//draw label
  		for(var key in param.data){
  			var curData = param.data[key];
  			var curColor = param.color[key];
  			//var offsetY = h-padB-index*lineStep-20;
			var offsetY = padT+index*lineStep;
			svg.append("line")
				.attr("x1",w-10)
				.attr("y1",offsetY)
				.attr("x2",w)
				.attr("y2",offsetY)
				.attr("stroke-width",3)
				.attr("stroke",curColor);
			svg.append("text")
				.attr("x",w-20)
				.attr("y",offsetY)
				.attr("text-anchor","end ")
				.attr("alignment-baseline","middle ")
				.attr("font-size","14px")
				.text(key);
			index++;
  		}
  		index = 0;
  		for(var key in param.data){
  			var curData = param.data[key];
  			var curColor = param.color[key];
  			//console.log(curData);
  			//console.log(line(curData));

  			var lineChart = svg.append("g");
			lineChart.append("path")
				.attr("fill", "none")
				.attr("stroke", curColor)
				.attr("stroke-linejoin", "round")
				.attr("stroke-linecap", "round")
				.attr("stroke-width", 1.5)
				.attr("d", line(curData));

			var circleGroup = svg.append("g").attr("class","circle"+key);
			circleGroup.selectAll("circle").data(curData)
				.enter().append("circle")
				.attr("data-info",param.infoFn)
				.attr("r",10)
				.attr("opacity",0)
				.attr("fill","white")
				.attr("stroke",curColor)
				.attr("stroke-width",0.5)
				.attr("cx", function(d){return padL+scaleW(d[param.axisX]);})
				.attr("cy", function(d){return padT+scaleH(d[param.axisY]);})
				.on("mouseover",function(){
					var cur = d3.select(this);
					cur.attr("opacity",0.5);
					$(param.textInfo).text(cur.attr("data-info"));
				})
				.on("mouseout",function(){
					d3.select(this).attr("opacity",0);
				});
			index++;
  		}
  		$(param.textInfo).text("單位 X軸:"+param.unitX+" Y軸:"+param.unitY);
	};

	var PieChart = function(param){
		if(param.data == null) return;
		var selectKey = "";
		//compute scale
		var graph = $(param.selector);
		var w = graph.width(), h = graph.height();
		var svg = d3.select(param.selector);
		svg.selectAll("*").remove();

		var g = svg.append("g")
			.attr("class","group")
    		.attr("transform", "translate(" + w*0.5 + "," + h*0.5 + ")");

    	function ClickFn(item){
    		if(param.clickFn){
	    		var pre = g.select("path[data-select='"+selectKey+"']");
	    		pre.attr("stroke","#FFAA0D").attr("stroke-width",0);

	    		var select = item.attr("data-select");
				item.attr("stroke","#FFFFFF").attr("stroke-width",2);
				$(param.textInfo).text(item.attr("data-info"));

				selectKey = select;
				g.selectAll("path").sort(function (a, b) {
					if (a.data[param.key] != select) return -1;
					else return 1;
				});
				param.clickFn(item);
			}
		}
	
		var inRadius = param.inRadius?param.inRadius:0;
		var radius = Math.min(w,h)*0.5;
		var arc = d3.svg.arc()
		    .outerRadius(radius - 10)
		    .innerRadius(inRadius);

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return d[param.value]; });
		var color = param.color?param.color:g_Util.ColorCategory(param.data.length);

		g.selectAll("path")
			.data(pie(param.data)).enter()
			.append("path")
			.attr("data-info",param.infoFn)
			.attr("data-select",function(d){return d.data[param.key];})
			.attr("d", arc)
			.attr("stroke","#FFAA0D")
			.attr("stroke-width",0)
			.attr("fill", function(d,i) { return color(i); })
			.on("mouseover",function(d){
				var cur = d3.select(this);
				var curSelect = cur.attr("data-select");
				$(param.textInfo).text(cur.attr("data-info"));
				if(curSelect == selectKey) return;

				cur.attr("stroke-width",2);
				//move hovered object up
				g.selectAll("path").sort(function (a, b) {
					//selected在最上面，其次hover
					if(a.data[param.key] == selectKey) return 1;
					else if(b.data[param.key] == selectKey) return -1;
					else if (a.data[param.key] != d.data[param.key]) return -1;
					else return 1;
				});
			})
			.on("mouseout",function(){
				var cur = d3.select(this);
				var curSelect = cur.attr("data-select");
				if(curSelect == selectKey) return;
				cur.attr("stroke-width",0);

				var selectItem = g.select("path[data-select='"+selectKey+"']");
				if(!selectItem.empty()){
					$(param.textInfo).text(selectItem.attr("data-info"));
				}
			})
			.on("click",function(){ClickFn(d3.select(this));});

		if(param.select){
			var item = g.select("path[data-select='"+param.select+"']");
			if(!item.empty()) ClickFn(item);
		}
	};

	var Histogram = function(param){
		if(param.data == null) return;
		//compute scale
		var graph = $(param.selector);
		var w = graph.width(), h = graph.height();
		var svg = d3.select(param.selector);
		svg.selectAll("*").remove();
		var padL = param.padL||50,padR = param.padR||10,padT = param.padT||20,padB = param.padB||30;
		var scaleW = d3.scale.linear().domain([param.minX,param.maxX]).range([0,w-padL-padR]);
		var scaleH = d3.scale.linear().domain([param.maxValue,0]).range([0,h-padT-padB]);
		var color = d3.scale.linear().domain([param.maxValue*0.1,param.maxValue]).range([param.minColor,param.maxColor]);

		//draw axis
		var xAxis = d3.svg.axis().orient("bottom").scale(scaleW).ticks(w/75)
			.tickFormat(param.formatAxisX||function(d){return d;});
		var yAxis = d3.svg.axis().orient("left").scale(scaleH).ticks(10)
			.tickFormat(param.formatAxisY||function(d){return d;});
		var xAxisGroup = svg.append("g").call(xAxis)
			.attr({
				"font-size": "12px",
				"transform":"translate("+padL+","+(h-padB)+")",
  				"fill":"black",
  				"stroke":"black",
  				"stroke-width": 0.5
  			});
		xAxisGroup.select('path')
  			.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});
		var yAxisGroup = svg.append("g").call(yAxis)
			.attr({
				"font-size": "12px",
				"transform":"translate("+padL+","+padT+")",
  				"fill":"black",
  				"stroke":"black",
  				"stroke-width": 0.5
  			});
		yAxisGroup.select('path')
  			.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});

  		var g = svg.append("g").attr("class","histGroup");
  		g.selectAll("rect")
			.data(param.data).enter()
			.append("rect")
			.attr("data-info",param.infoFn)
			.attr("x",function(d){return scaleW(d[param.keyXMin])+padL;})
			.attr("y",function(d){return h-padB-scaleH(param.maxValue-d[param.keyY]);})
			.attr("width",function(d){return scaleW(d[param.keyXMax]-d[param.keyXMin]+param.minX+1);})
			.attr("height",function(d){return scaleH(param.maxValue-d[param.keyY]);})
			.attr("stroke","#FFAA0D")
			.attr("stroke-width",0)
			.attr("fill", function(d) {return color(d[param.keyY]);})
			.on("mouseover",function(d){
				var cur = d3.select(this);
				cur.attr("stroke-width",2);
				$(param.textInfo).text(cur.attr("data-info"));
				//move hovered object up
				g.selectAll("rect").sort(function (a, b) {
					if (a[param.keyXMin] != d[param.keyXMin]) return -1;
					else return 1;
				});
			})
			.on("mouseout",function(){
				d3.select(this).attr("stroke-width",0);
			});
		$(param.textInfo).text("單位 X軸:"+param.unitX+" Y軸:"+param.unitY);
	}

	var CategoryHistogram = function(param){
		if(param.data == null) return;
		//compute scale
		var graph = $(param.selector);
		var w = graph.width(), h = graph.height();
		var svg = d3.select(param.selector);
		svg.selectAll("*").remove();
		var padL = param.padL||50,padR = param.padR||10,padT = param.padT||20,padB = param.padB||30;
		var stepX = (w-padL-padR)/param.data.length;
		var scaleH = d3.scale.linear().domain([param.maxValue,0]).range([0,h-padT-padB]);
		var color = d3.scale.linear().domain([param.maxValue*0.1,param.maxValue]).range([param.minColor,param.maxColor]);

		//draw axis
		svg.append("line").attr({
			"x1":padL,
			"y1":h-padB,
			"x2":w-padR,
			"y2":h-padB,
			"fill":"black",
  			"stroke":"black",
  			"stroke-width": 2
		});
		var yAxis = d3.svg.axis().orient("left").scale(scaleH).ticks(10)
			.tickFormat(function(d){return d;});
		var yAxisGroup = svg.append("g").call(yAxis)
			.attr({
				"font-size": "12px",
				"transform":"translate("+padL+","+padT+")",
  				"fill":"black",
  				"stroke":"black",
  				"stroke-width": 0.5
  			});
		yAxisGroup.select('path')
  			.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});

  		var g = svg.append("g").attr("class","histGroup");
  		g.selectAll("rect")
			.data(param.data).enter()
			.append("rect")
			.attr("data-info",param.infoFn)
			.attr("x",function(d,i){return i*stepX+padL;})
			.attr("y",function(d){return h-padB-scaleH(param.maxValue-d[param.keyY]);})
			.attr("width",stepX)
			.attr("height",function(d){return scaleH(param.maxValue-d[param.keyY]);})
			.attr("stroke","#FFAA0D")
			.attr("stroke-width",0)
			.attr("fill", function(d) {return color(d[param.keyY]);})
			.on("mouseover",function(d){
				var cur = d3.select(this);
				cur.attr("stroke-width",2);
				$(param.textInfo).text(cur.attr("data-info"));
				//move hovered object up
				g.selectAll("rect").sort(function (a, b) {
					if (a[param.keyX] != d[param.keyX]) return -1;
					else return 1;
				});
			})
			.on("mouseout",function(){
				d3.select(this).attr("stroke-width",0);
			});

		g.selectAll("text")
			.data(param.data).enter()
			.append("text")
			.attr("x",function(d,i){return (i+0.5)*stepX+padL;})
			.attr("y",h-padB-10)
			.attr("text-anchor","end")
			.attr("alignment-baseline","middle")
			.attr("writing-mode","tb")
			.attr("font-size","12px")
			.text(function(d){return d[param.keyX];})

		$(param.textInfo).text("單位: "+param.unit);
	}

	var SortedBar = function(param){
		if(param.data == null) return;
		var selectKey = "";

		function ClickFn(item){
    		if(param.clickFn){
	    		var pre = g.select("rect[data-select='"+selectKey+"']");
	    		pre.attr("stroke","black").attr("stroke-width",0.5);

	    		var select = item.attr("data-select");
	    		var rect = g.select("rect[data-select='"+select+"']");
				rect.attr("stroke","#FF3333").attr("stroke-width",2);

				$(param.textInfo).text(rect.attr("data-info"));

				selectKey = select;
				g.selectAll("rect").sort(function (a, b) {
					if (a[param.key] != select) return -1;
					else return 1;
				});
				param.clickFn(rect);
			}
		}
		function HoverIn(item,d){
			var curSelect = item.attr("data-select");
			if(curSelect == selectKey) return;

			var rect = g.select("rect[data-select='"+curSelect+"']");
			rect.attr("stroke",param.hoverColor?param.hoverColor:"#FFAA0D")
				.attr("stroke-width",2);
			$(param.textInfo).text(rect.attr("data-info"));
			//move hovered object up
			g.selectAll("rect").sort(function (a, b) {
				//selected在最上面，其次hover
				if(a[param.key] == selectKey) return 1;
				else if(b[param.key] == selectKey) return -1;
				else if (a[param.key] != d[param.key]) return -1;
				else return 1;
			});
		}
		function HoverOut(item){
			var curSelect = item.attr("data-select");
			if(curSelect == selectKey) return;

			var rect = g.select("rect[data-select='"+curSelect+"']");
			rect.attr("stroke","black")
				.attr("stroke-width",0.5);

			var selectItem = g.select("rect[data-select='"+selectKey+"']");
			if(!selectItem.empty()){
				$(param.textInfo).text(selectItem.attr("data-info"));
			}
		}

		var sortData = param.data.sort(function(a,b){
			return b[param.value]-a[param.value];
		});
		var rankOffset = param.rankOffset||0;
		var rankLength = param.rankLength||sortData.length;
		sortData = sortData.slice(rankOffset,rankOffset+rankLength);

		//compute scale
		var graph = $(param.selector);
		var w = graph.width(), h = graph.height();
		var svg = d3.select(param.selector);
		svg.selectAll("*").remove();
		var padL = param.padL||20,padR = param.padR||10,padT = param.padT||20,padB = param.padB||30;
		var stepY = (h-padT-padB)/sortData.length;
		var scaleW = d3.scale.linear().domain([0,param.maxValue]).range([0,w-padL-padR]);
		var color = d3.scale.linear().domain([param.maxValue*0.1,param.maxValue]).range([param.minColor,param.maxColor]);

		var xAxis = d3.svg.axis().orient("top").scale(scaleW).ticks(w/75);
		var xAxisGroup = svg.append("g").call(xAxis)
			.attr({
				"font-size": "12px",
				"transform":"translate("+padL+","+padT+")",
  				"fill":"black",
  				"stroke":"black",
  				"stroke-width": 0.5
  			});
		xAxisGroup.select('path')
  			.style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});

  		svg.append("line").attr({
  			"x1":padL,
  			"y1":padT,
  			"x2":padL,
  			"y2":h-padB,
  			"fill":"black",
  			"stroke":"black",
  			"stroke-width": 2
  		});

  		var g = svg.append("g").attr("class","barGroup");
  		g.selectAll("rect")
			.data(sortData).enter()
			.append("rect")
			.attr("data-select",function(d){return d[param.key];})
			.attr("data-info",param.infoFn)
			.attr("x",padL)
			.attr("y",function(d,i){return padT+stepY*i;})
			.attr("width",function(d){return scaleW(d[param.value]);})
			.attr("height",stepY)
			.attr("stroke","black")
			.attr("stroke-width",0.5)
			.attr("fill", function(d) {return color(d[param.value]);})
			.on("mouseover",function(d){HoverIn(d3.select(this),d);})
			.on("mouseout",function(){HoverOut(d3.select(this));})
			.on("click",function(){ClickFn(d3.select(this));});

		g.selectAll("text")
			.data(sortData).enter()
			.append("text")
			.attr("data-select",function(d){return d[param.key];})
			.attr("x",padL+20)
			.attr("y",function(d,i){return padT+stepY*(i+0.5);})
			.attr("text-anchor","start")
			.attr("alignment-baseline","middle")
			.attr("writing-mode","rl")
			.attr("font-size","12px")
			.attr("fill",param.textColor?param.textColor:"black")
			.text(function(d){return d[param.key];})
			.on("mouseover",function(d){HoverIn(d3.select(this),d);})
			.on("mouseout",function(){HoverOut(d3.select(this));	})
			.on("click",function(){ClickFn(d3.select(this));});

		$(param.textInfo).text("單位: "+param.unit);

		if(!param.select || param.select == ""){
			if(param.data[0]){
				var firstKey = param.data[0][param.key];
				item = g.select("rect[data-select='"+firstKey+"']");
				if(!item.empty()) ClickFn(item);
			}
		}
		else{
			var item = g.select("rect[data-select='"+param.select+"']");
			if(!item.empty()) ClickFn(item);
		}
	};

	return {
		MapTW: MapTW,
		PopulationPyramid: PopulationPyramid,
		TimeLine: TimeLine,
		PieChart: PieChart,
		Histogram: Histogram,
		CategoryHistogram: CategoryHistogram,
		SortedBar: SortedBar
	}
}();