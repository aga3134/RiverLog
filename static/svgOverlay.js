
SvgOverlay.prototype = new google.maps.OverlayView();

function SvgOverlay(option) {
	this.map = option.map;
	this.lat = option.lat;
	this.lng = option.lng;
	this.size = option.size;
	this.svgID = option.svgID;
	this.percent = option.percent;
	this.opacity = option.opacity||1;
	this.div = null;
	this.setMap(this.map);
}

SvgOverlay.prototype.onAdd = function() {
	var div = document.createElement('div');
    div.style.borderStyle = 'none';
    div.style.borderWidth = '0px';
    div.style.position = 'absolute';

	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.id = this.svgID;
	svg.style.width = '100%';
	svg.style.height = '100%';
	svg.style.position = 'absolute';
	div.appendChild(svg);

	this.div = div;

	var panes = this.getPanes();
	panes.overlayMouseTarget.appendChild(div);

	google.maps.event.addDomListener(div, 'click', function() {
	    google.maps.event.trigger(this, 'click');
	}.bind(this));

};

SvgOverlay.prototype.draw = function() {
    this.Update();
};

SvgOverlay.prototype.onRemove = function() {
	this.div.parentNode.removeChild(this.div);
	this.div = null;
};

SvgOverlay.prototype.Update = function(option){
	if(option){
		if(option.size) this.size = option.size;
		if(option.percent) this.percent = option.percent;
		if(option.opacity) this.opacity = option.opacity;
	}

	var overlayProjection = this.getProjection();
	var pos = new google.maps.LatLng(this.lat, this.lng);
	var center = overlayProjection.fromLatLngToDivPixel(pos);
	var halfSize = this.size*0.5;
	var div = this.div;
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