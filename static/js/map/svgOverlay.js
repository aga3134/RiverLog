
class SvgOverlay extends google.maps.OverlayView {
    constructor(option){
        super();
        this.map = option.map;
        this.lat = option.lat;
        this.lng = option.lng;
        this.svgID = option.svgID;
        this.size = option.size;
        this.div = null;
        this.setMap(this.map);
    }

    onAdd(){
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

        google.maps.event.addDomListener(div, 'click', function(event) {
            event.stopPropagation();
            google.maps.event.trigger(this, 'click');
        }.bind(this));

	this.Update();
    }

    UpdateDivSize(){
        if(!this.div) return this.setMap(this.map);
        var overlayProjection = this.getProjection();
        if(!overlayProjection) return;
        var pos = new google.maps.LatLng(this.lat, this.lng);
        var center = overlayProjection.fromLatLngToDivPixel(pos);
        var halfSize = this.size*0.5;
        var div = this.div;
        div.style.left = (center.x-halfSize) + 'px';
        div.style.top = (center.y-halfSize) + 'px';
        div.style.width = this.size + 'px';
        div.style.height = this.size + 'px';
    }

    draw(){
        if(this.Update) this.Update();
    }

    onRemove(){
        this.div.parentNode.removeChild(this.div);
        this.div = null;
    }
}
