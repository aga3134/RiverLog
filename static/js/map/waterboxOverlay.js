class WaterboxOverlay extends SvgOverlay{
    constructor(option){
        super(option);
        this.value = option.value;
        this.opacity = option.opacity||1;

        this.color = option.color;
    }
    Update(option){
        if(option){
            if(option.size != null) this.size = option.size;
            if(option.value != null) this.value = option.value;
            if(option.opacity != null) this.opacity = option.opacity;
            if(option.map != null) this.map = option.map;
        }

        this.UpdateDivSize();

        var svg = d3.select("#"+this.svgID);
        svg.selectAll("*").remove();

        svg.append('circle').attr({
            "cx": this.size*0.5,
            "cy": this.size*0.5,
            "r": this.size*0.5,
            "stroke":"#ffffff",
            "stroke-width":"1",
            "fill-opacity":this.opacity,
            "fill":this.color(this.value)
        });

        svg.append('text').attr({
            "x": this.size*0.5,
            "y": this.size*0.5,
            "text-anchor": "middle",
            "alignment-baseline":"middle",
            "font-size": (this.size*0.3)+"px",
            "fill":"#ffffff"
        }).text(this.value);
        
    }
}
