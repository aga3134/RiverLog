var g_WaterUse = new Vue({
  el: "#waterUse",
  data: {
    waterUse: null,
    openOption: false,
    openAbout: false,
    openSponsor: false,
    url: "/waterUse",
    opUrl: [
      {name: "水事件地圖", url:"/"},
      {name: "用水統計", url:"/waterUse"},
    ],
    loading: true
  },
  created: function () {
    this.waterUse = new WaterUseStatistic();
    
    var param = g_Util.GetUrlHash();
    if(param.option && param.v){
      this.DecodeOptionString(param.option,param.v);
    }
    this.waterUse.InitMap();
    this.loading = false;
  },
  methods: {
    ChangeUrl: function(){
      window.location.href = this.url;
    },
    SwitchPanel: function(type){
      this.openOption = false;
      this.openAbout = false;
      this.openSponsor = false;
      switch(type){ 
        case "option":
          this.openOption = true;
          break;
        case "about":
          this.openAbout = true;
          break;
        case "sponsor":
          this.openSponsor = true;
          break;
      }
    },
    UpdateUrl: function(){
      var version = 1;
      var hash = "#v="+version;
      hash += "&option="+this.EncodeOptionString();
      history.replaceState(undefined, undefined, hash);
    },
    Update: function(){
      this.waterUse.UpdateGraph();
    },
    EncodeOptionString: function(){
      var waterUse = this.waterUse;
      var arr = [];
      arr.push({value: g_OptionCodec.OpValueToIndex(waterUse.opType, waterUse.type), bitNum: 4});
      arr.push({value: g_OptionCodec.OpValueToIndex(waterUse.opAgricultureType, waterUse.agricultureData.type), bitNum: 4});
      arr.push({value: g_OptionCodec.OpValueToIndex(waterUse.opCultivationType, waterUse.cultivationData.type), bitNum: 4});
      arr.push({value: g_OptionCodec.OpValueToIndex(waterUse.opLivestockType, waterUse.livestockData.type), bitNum: 4});
      arr.push({value: g_OptionCodec.OpValueToIndex(waterUse.opIndustryType, waterUse.industryData.type), bitNum: 4});
      arr.push({value: g_OptionCodec.OpValueToIndex(waterUse.opLivingType, waterUse.livingData.type), bitNum: 4});
      arr.push({value: g_OptionCodec.OpValueToIndex(waterUse.opReservoirType, waterUse.reservoirData.type), bitNum: 4});
      arr.push({value: (waterUse.year-1911), bitNum: 8});
      arr.push({value: waterUse.playSpeed, bitNum: 8});
      
      return g_OptionCodec.Encode(arr);
    },
    DecodeOptionString: function(option,version){
      switch(version){
        case "1":
          var bitNumArr = this.GetBitNumV1();
          var valueArr = g_OptionCodec.Decode(option,bitNumArr);
          this.ApplyOptionV1(valueArr);
          break;
      }
    },
    GetBitNumV1: function(){
      var bitNumArr = [];
      bitNumArr.push({name:"waterUseType",bitNum:4});
      bitNumArr.push({name:"waterUseAgricultureType",bitNum:4});
      bitNumArr.push({name:"waterUseCultivationType",bitNum:4});
      bitNumArr.push({name:"waterUseLivestockType",bitNum:4});
      bitNumArr.push({name:"waterUseIndustryType",bitNum:4});
      bitNumArr.push({name:"waterUseLivingType",bitNum:4});
      bitNumArr.push({name:"waterUseReservoirType",bitNum:4});
      bitNumArr.push({name:"waterUseYear",bitNum:8});
      bitNumArr.push({name:"waterUsePlaySpeed",bitNum:8});

      return bitNumArr;
    },
    ApplyOptionV1: function(valueArr){
      var waterUse = this.waterUse;
      waterUse.type = waterUse.opType[valueArr["waterUseType"]].value;
      waterUse.agricultureData.type = waterUse.opAgricultureType[valueArr["waterUseAgricultureType"]].value;
      waterUse.cultivationData.type = waterUse.opCultivationType[valueArr["waterUseCultivationType"]].value;
      waterUse.livestockData.type = waterUse.opLivestockType[valueArr["waterUseLivestockType"]].value;
      waterUse.industryData.type = waterUse.opIndustryType[valueArr["waterUseIndustryType"]].value;
      waterUse.livingData.type = waterUse.opLivingType[valueArr["waterUseLivingType"]].value;
      waterUse.reservoirData.type = waterUse.opReservoirType[valueArr["waterUseReservoirType"]].value;
      waterUse.year = valueArr["waterUseYear"] + 1911;
      waterUse.playSpeed = valueArr["waterUsePlaySpeed"];
      waterUse.UpdateGraph();
    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  g_WaterUse.Update();
});