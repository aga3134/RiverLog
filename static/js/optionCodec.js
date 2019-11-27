
var g_OptionCodec = function(){
	var Encode = function(arr){
		var str = "";
    var encodeBit = 5;
    var bitValue = 0, bitPos = 0;
    //console.log("======================");
    for(var i=0;i<arr.length;i++){
      var value = arr[i].value;
      var bitNum = arr[i].bitNum;
      //console.log("value:"+value+" bitNum:"+bitNum);
      var bitMask = (1<<bitNum)-1;
      value = value & bitMask;
      while(bitNum > 0){
        //console.log("init bit:"+bitNum);
        if(bitPos + bitNum >= encodeBit){ //bit數已滿，輸出新字元後buffer歸零
          var useBit = encodeBit-bitPos;
          //console.log("use bit: "+useBit);
          var useMask = (1<<useBit)-1;
          var useValue = (value & useMask)<<bitPos;
          var encodeValue = bitValue + useValue;
          str = NumberToChar(encodeValue)+str;
          value = value >> useBit;
          bitNum -= useBit;
          //console.log("str: "+str);
          //console.log("remain bit:"+bitNum);
          //console.log("remain value:"+value);
          bitValue = 0;
          bitPos = 0;
        }
        else{ //bit數未滿，更新buffer
          //console.log("residual bit:"+bitNum);
          var useMask = (1<<bitNum)-1;
          var useValue = (value & useMask)<<bitPos;
          bitValue += useValue;
          bitPos += bitNum;
          bitNum = 0;
          //console.log("residual value:"+bitValue);
          //console.log("residual pos:"+bitPos);
        }
        
      }
    }
    if(bitPos > 0){
      str = NumberToChar(bitValue)+str;
    }
    return str;
	};

	var Decode = function(str,bitNumArr){
		var encodeBit = 5;
    //console.log("str: "+str);
    var valueHash = {};
    var bitArr = "";
    for(var i=str.length-1;i>=0;i--){
      var ch = str[i];
      bitArr = CharToBit(ch,encodeBit)+bitArr;
    }
    //console.log("bitArr: "+bitArr);
    var index = bitArr.length-1;
    for(var i=0;i<bitNumArr.length;i++){
      var bitNum = bitNumArr[i].bitNum;
      var valueName = bitNumArr[i].name;
      var binaryValue = bitArr.substr(index-bitNum+1,index);
      //console.log("binary value:"+binaryValue);
      var value = 0;
      for(var j=0;j<bitNum;j++){
        value = (value<<1)+parseInt(binaryValue[j]);
      }
      valueHash[valueName] = value;
      index-=bitNum;
    }
    return valueHash;
	};

	var OpValueToIndex = function(opArr, value){
    for(var i=0;i<opArr.length;i++){
      var op = opArr[i];
      if(value == op.value){
        return i;
      }
    }
    return 0;
  };

  var NumberToChar = function(number){  //5bit number only
    var chArr = [];
    for(var i=0;i<10;i++){  //0~10
      var ch = String.fromCharCode(48+i);
      chArr.push(ch);
    }
    for(var i=10;i<32;i++){  //a~z
      var ch = String.fromCharCode(97+i-10);
      chArr.push(ch);
    }
    if(number < 0 || number >= chArr.length) return "";
    else return chArr[number];
  }

  var CharToBit = function(ch,encodeBit){
    var code = ch.charCodeAt(0);
    var value = 0;
    if(code >= 48 && code < 58) value = code-48;
    else if(code >= 97 && code < 97+26) value = code+10-97;
    return g_Util.PadLeft(value.toString(2),encodeBit);
  }

	return {
		Encode: Encode,
		Decode: Decode,
		OpValueToIndex: OpValueToIndex
	};
}();
