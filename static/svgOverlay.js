
SvgOverlay.prototype = new google.maps.OverlayView();

function SvgOverlay(option) {
	this.map = option.map;
	this.lat = option.lat;
	this.lng = option.lng;
	this.svgID = option.svgID;
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
    if(this.Update) this.Update();
};

SvgOverlay.prototype.onRemove = function() {
	this.div.parentNode.removeChild(this.div);
	this.div = null;
};
