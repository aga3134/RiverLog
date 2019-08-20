
Vue.component('info-graph', {
	props: ["value"],
	data: function () {
		return {
			graphID:"",
			infoID:"",
			input: "",
			total: "",
			type: "gender",
			gender:"全部",
			minAge:20,
			maxAge: 100,
			county:"全部",
			living:"全部",
			graphTitle: "",
			graphDesc: "",
			unit: "人",
			header: "",
			isOpen: false,
			mapOption: 1,
			rankPage: 0,
			pageOffset: 10,
			map: "",
			colorArr: g_Util.ColorCategory(20)
		};
	},
	template: '\
		<div class="info-graph half-w">\
			<div class="panel-bt" v-on:click="OpenPanel();">篩選</div>\
			<div class="graph-title">{{graphTitle}}</div>\
			<div v-show="type === \'county\'" class="option-container">\
				<div class="option-bt"\
					v-bind:class="{selected: mapOption === 1}"\
					v-on:click="ChangeMapOption(1);">\
					地圖\
				</div>\
				<div class="option-bt"\
					v-bind:class="{selected: mapOption === 2}"\
					v-on:click="ChangeMapOption(2);">\
					排序\
				</div>\
			</div>\
			<div v-show="type === \'countyRatio\'" class="option-container">\
				<select v-model="rankPage" v-on:change="UpdateGraph();">\
					<option value=\'0\'>第1頁</option>\
					<option value=\'1\'>第2頁</option>\
					<option value=\'2\'>第3頁</option>\
				</select>\
			</div>\
			<svg v-bind:id="graphID"></svg>\
			<div class="center" v-bind:id="infoID">{{graphDesc}}</div>\
			<div class="option-panel" v-bind:class="OpenClass()">\
				<div class="graph-title">篩選</div>\
				<div v-show="type !== \'gender\' && type !== \'genderRatio\'">\
					<div class="label">性別</div>\
					<select v-model="gender" v-on:change="UpdateGraph();">\
						<option value="全部">全部</option>\
						<option v-for="g in header.gender" v-bind:value="g.id">{{g.name}}</option>\
					</select>\
				</div>\
				<div v-show="type !== \'county\' && type !== \'countyRatio\'">\
					<div class="label">縣市</div>\
					<select v-model="county" v-on:change="UpdateGraph();">\
						<option value="全部">全部</option>\
						<option v-for="c in header.county" v-bind:value="c.id">{{c.name}}</option>\
					</select><br>\
				</div>\
				<div v-show="type !== \'age\' && type !== \'ageRatio\'">\
					<div class="label">年齡</div>\
					<select v-model="minAge" v-on:change="UpdateGraph();">\
						<option v-for="a in header.age" v-if="a.minAge>0" v-bind:value="a.minAge">{{a.minAge}}</option>\
					</select> ~ \
					<select v-model="maxAge" v-on:change="UpdateGraph();">\
						<option v-for="a in header.age" v-if="a.maxAge>0" v-bind:value="a.maxAge">{{a.maxAge}}</option>\
					</select><br>\
				</div>\
				<div v-show="type !== \'living\' && type !== \'livingRatio\'">\
					<div class="label">居住</div>\
					<select v-model="living" v-on:change="UpdateGraph();">\
						<option value="全部">全部</option>\
						<option v-for="l in header.living" v-bind:value="l.id">{{l.name}}</option>\
					</select>\
				</div>\
				<div class="bt-container">\
					<div class="bt" v-on:click="ResetValue();">重設</div>\
					<div class="bt" v-on:click="ClosePanel();">確定</div>\
				</div>\
			</div>\
		</div>',
	created: function(){
		this.map = new MapTW();
		this.graphID = "graph_"+this._uid;
		this.infoID = "info_"+this._uid;
		$.get("/static/header.json",function(data){
			this.header = data;
			this.UpdateGraph();
		}.bind(this));
		window.addEventListener('resize', this.UpdateGraph);
	},
	methods: {
		OpenPanel: function(){
			this.isOpen = true;
		},
		ClosePanel: function(){
			this.isOpen = false;
		},
		UpdateGraph: function(){
			if(!this.header || this.header == "") return;
			$("#"+this.infoID).text("");
			switch(this.type){
				case "gender":
					this.DrawGender();
					break;
				case "county":
					this.DrawCounty();
					break;
				case "age":
					this.DrawAge();
					break;
				case "living":
					this.DrawLiving();
					break;
				case "lang":
					this.DrawLang();
					break;
				case "livewith":
					this.DrawLivewith();
					break;
				case "genderRatio":
					this.DrawGenderRatio();
					break;
				case "countyRatio":
					this.DrawCountyRatio();
					break;
				case "ageRatio":
					this.DrawAgeRatio();
					break;
				case "livingRatio":
					this.DrawLivingRatio();
					break;
			}
		},
		FilterData: function(input){
			var gender = this.gender;
			var minAge = this.minAge;
			var maxAge = this.maxAge;
			var county = this.county;
			var living = this.living;
			var header = this.header;
			var arr = input;

			switch(this.type){
				case "gender":
					this.graphTitle = "性別分佈";
					gender = "全部";
					break;
				case "county":
					this.graphTitle = "縣市分佈";
					county = "全部";
					break;
				case "age":
					this.graphTitle = "年齡分佈";
					minAge = 20;
					maxAge = 100;
					break;
				case "living":
					this.graphTitle = "居住型態分佈";
					living = "全部";
					break;
				case "lang":
					this.graphTitle = "語言分佈";
					break;
				case "livewith":
					this.graphTitle = "與誰同住分佈";
					break;
				case "genderRatio":
					this.graphTitle = "選擇/性別 佔比";
					gender = "全部";
					break;
				case "countyRatio":
					this.graphTitle = "選擇/縣市 佔比";
					county = "全部";
					break;
				case "ageRatio":
					this.graphTitle = "選擇/年齡 佔比";
					minAge = 20;
					maxAge = 100;
					break;
				case "livingRatio":
					this.graphTitle = "選擇/居住型態 佔比";
					living = "全部";
					break;
			}

			if(gender != "全部"){
				var gID = parseInt(gender);
				arr = arr.filter(function(d){
					return d.gender == gender;
				});
				this.graphTitle += " - "+header.gender[gID].name;
			}
			if(county != "全部"){
				var cID = parseInt(county);
				arr = arr.filter(function(d){
					return d.county == county;
				});
				this.graphTitle += " - "+header.county[cID].name;
			}
			if(minAge != 20 || maxAge != 100){
				arr = arr.filter(function(d){
					var aID = parseInt(d.age);
					var age = header.age[aID];
					return age.minAge >= minAge && age.maxAge <= maxAge;
				});
				this.graphTitle += " - "+minAge+"歲 ~ "+maxAge+"歲";
			} 
			if(living != "全部"){
				var lID = parseInt(living);
				arr = arr.filter(function(d){
					return d.living == living;
				});
				this.graphTitle += " - "+header.living[lID].name;
			}
			return arr;
		},
		DrawGender: function(){
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);

			var genderGroup = d3.nest()
				.key(function(d) {
					var gID = parseInt(d.gender);
					var gender = header.gender[gID].name;
					return gender;
				})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					});
				})
				.entries(arr);

			var total = d3.sum(genderGroup,function(d){return d.values;});
			for(var i=0;i<genderGroup.length;i++){
				genderGroup[i].ratio = (100*genderGroup[i].values/total).toFixed(1);;
			}

			var param = {};
			param.selector = "#"+this.graphID;
			param.textInfo = "#"+this.infoID;
			param.value = "values";
			param.key = "key";
			param.data = genderGroup;
			param.inRadius = 50;
			param.color = function(i){
				var arr = ["#000000","#A1AFC9","#F47983"];
				return arr[i];
			};
			var unit = this.unit;
			param.infoFn = function(d){
				var num = g_Util.NumberWithCommas(d.data.values.toFixed(0));
				return d.data.key+" "+num+unit+" ("+d.data.ratio+"%)";
			};
			g_SvgGraph.PieChart(param);

		},
		DrawAge: function(){
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);

			var ageGroup = d3.nest()
				.key(function(d) {return d.age;})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					}); 
				})
				.entries(arr);

			var total = d3.sum(ageGroup,function(d){return d.values;});
			for(var i=0;i<ageGroup.length;i++){
				var ageID = parseInt(ageGroup[i].key);
				var age = header.age[ageID];
				ageGroup[i].minAge = age.minAge;
				ageGroup[i].maxAge = age.maxAge;
				ageGroup[i].ratio = (100*ageGroup[i].values/total).toFixed(1);
			}

			var maxV = d3.max(ageGroup,function(d){return d.values;});
			var param = {};
			param.selector = "#"+this.graphID;
			param.keyXMin = "minAge";
			param.keyXMax = "maxAge";
			param.minX = 20;
			param.maxX = 85;
			param.keyY = "values";
			var color = "#d53c3c";
		    param.minColor = d3.rgb(color).brighter(3);
		    param.maxColor = color;
			param.unitX = "歲";
			param.unitY = "人";
			param.textInfo = "#"+this.infoID;
			param.data = ageGroup;
			param.maxValue = maxV;
			param.infoFn = function(d){
				var num = g_Util.NumberWithCommas(d.values.toFixed(0));
				var str = d.minAge+"~"+d.maxAge+"歲 "+num+"人";
				str += " ("+d.ratio+"%)";
				return str;
			};
			g_SvgGraph.Histogram(param);
		},
		DrawCounty: function(){
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);

			var countyGroup = d3.nest()
			.key(function(d) {
				var countyID = parseInt(d.county);
				var county = header.county[countyID].name;
				return county;
			})
			.rollup(function(arr){
				return d3.sum(arr,function(d){
					return d[value].toFixed(0);
				}); 
			})
			.map(arr);

			var total = 0;
			var maxV = 0;
			for(v in countyGroup){
				total += countyGroup[v];
				if(countyGroup[v] > maxV) maxV = countyGroup[v];
			}
			countyGroup["總計"] = total;
			maxV = Math.pow(2,Math.ceil(Math.log2(maxV)));

			var param = {};
			param.map = this.map;
			param.year = 2017;
			param.type = this.mapOption;
			param.selector = "#"+this.graphID;
			param.minBound = maxV>100?10:1;
			param.maxBound = maxV;
			param.minColor = "#FFFFFF";
			param.maxColor = "#DAC4DA";
			param.textInfo = "#"+this.infoID;
			param.data = countyGroup;
			param.unit = "人";
			g_SvgGraph.MapTW(param);
		},
		DrawLiving: function(){
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);

			var livingGroup = d3.nest()
				.key(function(d) {
					var liveID = parseInt(d.living);
					var living = header.living[liveID].name;
					return living;
				})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					}); 
				})
				.entries(arr);
        
			var total = d3.sum(livingGroup,function(d){return d.values;});
			for(var i=0;i<livingGroup.length;i++){
				livingGroup[i].ratio = (100*livingGroup[i].values/total).toFixed(1);
			}

			var param = {};
			param.selector = "#"+this.graphID;
			param.textInfo = "#"+this.infoID;
			param.value = "values";
			param.key = "key";
			param.data = livingGroup;
			param.inRadius = 50;
			param.infoFn = function(d){
				var num = g_Util.NumberWithCommas(d.data.values.toFixed(0));
				return d.data.key+" "+num+"人 ("+d.data.ratio+"%)";
			};
			g_SvgGraph.PieChart(param);
		},
		DrawLang: function(){
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);

			var langGroup = [];
			for(var i=0;i<header.lang.length;i++){
				langGroup.push({key:header.lang[i].name,values:0});
			}
			for(var i=0;i<arr.length;i++){
				langGroup[1].values += arr[i].lang_Mandarin;
				langGroup[2].values += arr[i].lang_Taiwanese;
				langGroup[3].values += arr[i].lang_Hakka;
				langGroup[0].values += arr[i][value] - arr[i].lang_Mandarin - arr[i].lang_Taiwanese - arr[i].lang_Hakka;
			}

			var total = d3.sum(langGroup,function(d){return d.values;});
			for(var i=0;i<langGroup.length;i++){
				langGroup[i].ratio = (100*langGroup[i].values/total).toFixed(1);;
			}

			var param = {};
			param.selector = "#"+this.graphID;
			param.textInfo = "#"+this.infoID;
			param.value = "values";
			param.key = "key";
			param.data = langGroup;
			param.inRadius = 50;
			var unit = this.unit;
			param.infoFn = function(d){
				var num = g_Util.NumberWithCommas(d.data.values.toFixed(0));
				return d.data.key+" "+num+unit+" ("+d.data.ratio+"%)";
			};
			g_SvgGraph.PieChart(param);

		},
		DrawLivewith: function(){
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);

			var livewithGroup = [];
			var total = 0;
			for(var i=0;i<header.livewith.length;i++){
				livewithGroup.push({key:header.livewith[i].name,values:0});
			}
			for(var i=0;i<arr.length;i++){
				livewithGroup[0].values += arr[i].liv_w_parents;
				livewithGroup[1].values += arr[i].liv_w_hw;
				livewithGroup[2].values += arr[i].liv_w_kid;
				livewithGroup[3].values += arr[i].liv_w_grandk;
				livewithGroup[4].values += arr[i].liv_w_others;
				total += arr[i][value];
			}
			
			var maxV = d3.max(livewithGroup,function(d){return d.values;});
			for(var i=0;i<livewithGroup.length;i++){
				livewithGroup[i].ratio = (100*livewithGroup[i].values/total).toFixed(1);;
			}

			var param = {};
	  		param.selector = "#"+this.graphID;
	  		param.textInfo = "#"+this.infoID;
	  		param.key = "key";
	  		param.value = "values";
	  		param.maxValue = maxV;
	  		var color = this.colorArr(4);
	  		param.minColor = color;
	  		param.maxColor = d3.rgb(color).brighter(1);
	  		param.unit = "人";
	  		param.data = livewithGroup;
	  		param.infoFn = function(d){
				var num = g_Util.NumberWithCommas(d.values.toFixed(0));
				var str = d.key+" "+num+"人";
				str += " ("+d.ratio+"%)";
				return str;
			};
	  		g_SvgGraph.SortedBar(param);

		},
		DrawGenderRatio: function(){
			if(!this.total) return;
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);
			var total = this.FilterData(this.total);

			var genderGroup = d3.nest()
				.key(function(d) {
					var gID = parseInt(d.gender);
					var gender = header.gender[gID].name;
					return gender;
				})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					});
				})
				.entries(arr);

			var genderTotal = d3.nest()
				.key(function(d) {
					var gID = parseInt(d.gender);
					var gender = header.gender[gID].name;
					return gender;
				})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					});
				})
				.entries(total);

			for(var i=0;i<genderGroup.length;i++){
				genderGroup[i].total = genderTotal[i].values;
				if(genderTotal[i].values == 0) genderGroup[i].ratio = 0;
				else genderGroup[i].ratio = (100*genderGroup[i].values/genderTotal[i].values);
			}

			var maxV = d3.max(genderGroup,function(d){return d.ratio;});
			var param = {};
		    param.selector = "#"+this.graphID;
		    param.textInfo = "#"+this.infoID;
		    param.key = "key";
		    param.value = "ratio";
		    param.maxValue = maxV;
		    var color = this.colorArr(5);
		    param.minColor = d3.rgb(color).brighter(3);
		    param.maxColor = color;
		    param.unit = "百分比";
		    param.data = genderGroup;
		    param.infoFn = function(d){
		    	var num = g_Util.NumberWithCommas(d.values.toFixed(0));
		    	var total = g_Util.NumberWithCommas(d.total.toFixed(0));
		    	var ratio = d.ratio.toFixed(1);
		        var str = d.key+" 選擇: "+num+"人 總數: "+total+"人 佔比: "+ratio+"%";
		        return str;
		    };
		    g_SvgGraph.SortedBar(param);

		},
		DrawAgeRatio: function(){
			if(!this.total) return;
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);
			var total = this.FilterData(this.total);

			var ageGroup = d3.nest()
				.key(function(d) {return d.age;})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					}); 
				})
				.entries(arr);

			var ageTotal = d3.nest()
				.key(function(d) {return d.age;})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					}); 
				})
				.entries(total);

			for(var i=0;i<ageGroup.length;i++){
				var ageID = parseInt(ageGroup[i].key);
				var age = header.age[ageID];
				ageGroup[i].minAge = age.minAge;
				ageGroup[i].maxAge = age.maxAge;
				ageGroup[i].total = ageTotal[i].values;
				if(ageTotal[i].values == 0) ageGroup[i].ratio = 0;
				else ageGroup[i].ratio = (100*ageGroup[i].values/ageTotal[i].values);
			}

			var maxV = d3.max(ageGroup,function(d){return d.ratio;});
			var param = {};
			param.selector = "#"+this.graphID;
			param.keyXMin = "minAge";
			param.keyXMax = "maxAge";
			param.minX = 20;
			param.maxX = 85;
			param.keyY = "ratio";
			var color = this.colorArr(0);
		    param.minColor = d3.rgb(color).brighter(3);
		    param.maxColor = color;
			param.unitX = "歲";
			param.unitY = "人";
			param.textInfo = "#"+this.infoID;
			param.data = ageGroup;
			param.maxValue = maxV;
			param.infoFn = function(d){
				var num = g_Util.NumberWithCommas(d.values.toFixed(0));
		    	var total = g_Util.NumberWithCommas(d.total.toFixed(0));
		    	var ratio = d.ratio.toFixed(1);
		        var str = d.minAge+"~"+d.maxAge+"歲 "+"選擇: "+num+"人 總數: "+total+"人 佔比: "+ratio+"%";
		        return str;
			};
			g_SvgGraph.Histogram(param);
		},
		DrawCountyRatio: function(){
			if(!this.total) return;
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);
			var total = this.FilterData(this.total);

			var countyGroup = d3.nest()
				.key(function(d) {
					var cID = parseInt(d.county);
					var county = header.county[cID].name;
					return county;
				})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					});
				})
				.entries(arr);

			var countyTotal = d3.nest()
				.key(function(d) {
					var cID = parseInt(d.county);
					var county = header.county[cID].name;
					return county;
				})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					});
				})
				.entries(total);

			for(var i=0;i<countyGroup.length;i++){
				countyGroup[i].total = countyTotal[i].values;
				if(countyTotal[i].values == 0) countyGroup[i].ratio = 0;
				else countyGroup[i].ratio = (100*countyGroup[i].values/countyTotal[i].values);
			}

			var maxV = d3.max(countyGroup,function(d){return d.ratio;});
			var param = {};
		    param.selector = "#"+this.graphID;
		    param.textInfo = "#"+this.infoID;
		    param.key = "key";
		    param.value = "ratio";
		    param.maxValue = maxV;
		    var color = this.colorArr(18);
		    param.minColor = d3.rgb(color).brighter(3);
		    param.maxColor = color;
		    param.unit = "百分比";
		    param.rankOffset = this.rankPage*this.pageOffset;
			param.rankLength = this.pageOffset;
		    param.data = countyGroup;
		    param.infoFn = function(d){
		    	var num = g_Util.NumberWithCommas(d.values.toFixed(0));
		    	var total = g_Util.NumberWithCommas(d.total.toFixed(0));
		    	var ratio = d.ratio.toFixed(1);
		        var str = d.key+" 選擇: "+num+"人 總數: "+total+"人 佔比: "+ratio+"%";
		        return str;
		    };
		    g_SvgGraph.SortedBar(param);

		},
		DrawLivingRatio: function(){
			if(!this.total) return;
			var value = this.value;
			var header = this.header;
			var arr = this.FilterData(this.input);
			var total = this.FilterData(this.total);

			var livingGroup = d3.nest()
				.key(function(d) {
					var lID = parseInt(d.living);
					var living = header.living[lID].name;
					return living;
				})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					});
				})
				.entries(arr);

			var livingTotal = d3.nest()
				.key(function(d) {
					var lID = parseInt(d.living);
					var living = header.living[lID].name;
					return living;
				})
				.rollup(function(arr){
					return d3.sum(arr,function(d){
						return d[value];
					});
				})
				.entries(total);

			for(var i=0;i<livingGroup.length;i++){
				livingGroup[i].total = livingTotal[i].values;
				if(livingTotal[i].values == 0) livingGroup[i].ratio = 0;
				else livingGroup[i].ratio = (100*livingGroup[i].values/livingTotal[i].values);
			}

			var maxV = d3.max(livingGroup,function(d){return d.ratio;});
			var param = {};
		    param.selector = "#"+this.graphID;
		    param.textInfo = "#"+this.infoID;
		    param.key = "key";
		    param.value = "ratio";
		    param.maxValue = maxV;
		    var color = this.colorArr(12);
		    param.minColor = d3.rgb(color).brighter(3);
		    param.maxColor = color;
		    param.unit = "百分比";
		    param.data = livingGroup;
		    param.infoFn = function(d){
		    	var num = g_Util.NumberWithCommas(d.values.toFixed(0));
		    	var total = g_Util.NumberWithCommas(d.total.toFixed(0));
		    	var ratio = d.ratio.toFixed(1);
		        var str = d.key+" 選擇: "+num+"人 總數: "+total+"人 佔比: "+ratio+"%";
		        return str;
		    };
		    g_SvgGraph.SortedBar(param);
		},
		OpenClass: function(){
			return {"open": this.isOpen};
		},
		ChangeMapOption: function(option){
			this.mapOption = option;
			this.UpdateGraph();
		},
		ResetValue: function(){
			this.gender = "全部";
			this.minAge = 20;
			this.maxAge = 100;
			this.county = "全部";
			this.living = "全部";
			this.UpdateGraph();
		}
	}
});