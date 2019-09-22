
ReservoirOverlay.prototype = SvgOverlay.prototype;
ReservoirOverlay.prototype.constructor = ReservoirOverlay;

function ReservoirOverlay(option) {
    SvgOverlay.call(this,option);
	this.size = option.size;
	this.percent = option.percent;
	this.opacity = option.opacity||1;
}

ReservoirOverlay.prototype.Update = function(option){
	if(option){
		if(option.size) this.size = option.size;
		if(option.percent) this.percent = option.percent;
		if(option.opacity) this.opacity = option.opacity;
	}

	var overlayProjection = this.getProjection();
	if(!overlayProjection) return;
	var pos = new google.maps.LatLng(this.lat, this.lng);
	var center = overlayProjection.fromLatLngToDivPixel(pos);
	var halfSize = this.size*0.5;
	var div = this.div;
	if(!this.div) return;
    div.style.left = (center.x-halfSize) + 'px';
    div.style.top = (center.y-halfSize) + 'px';
    div.style.width = this.size + 'px';
    div.style.height = this.size + 'px';

    var circleColor = "#dddddd";
    var textColor = "#ffffff";
    var waveTextColor = "#eeeeee";
    var waveColor = "rgba(23,139,202,"+this.opacity+")";
    var backgroundColor = "rgba(150,150,150,"+this.opacity+")";
    if(this.percent < 25){
        waveColor = "rgba(255,50,50,"+this.opacity+")";
        textColor = "rgb(255,0,0)";
        circleColor = "rgb(255,0,0)";
        backgroundColor = "rgba(255,200,200,"+this.opacity+")";
    }
    else if(this.percent < 50){
        waveColor = "rgba(245,151,111,"+this.opacity+")";
        textColor = "rgb(255,100,100)";
        circleColor = "rgb(255,100,100)";
        backgroundColor = "rgba(255,230,230,"+this.opacity+")";
    }

	var config = {
        minValue: 0, maxValue: 100,
        circleThickness: 0.05, circleFillGap: 0,
        circleColor: circleColor,
        waveHeight: 0.1, waveCount: 1,
        waveRiseTime: 1000, waveAnimateTime: 5000,
        waveRise: false,
        waveHeightScaling: true, waveAnimate: false, 
        waveColor: waveColor, waveOffset: 0,
        textVertPosition: .5, textSize: 1,
        valueCountUp: false, displayPercent: true,
        textColor: textColor, waveTextColor: waveTextColor,
        backgroundColor: backgroundColor
    };
    $("#"+this.svgID).html("");
    loadLiquidFillGauge(this.svgID, this.percent, config);
};