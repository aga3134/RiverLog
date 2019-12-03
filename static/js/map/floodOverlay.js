class FloodOverlay extends SvgOverlay{
    constructor(option){
        super(option);
        this.value = option.value;
        this.opacity = option.opacity||1;

        this.color = option.color;
    }
    Update(option){
        if(option){
            if(option.size) this.size = option.size;
            if(option.value) this.value = option.value;
            if(option.opacity) this.opacity = option.opacity;
            if(option.map) this.map = option.map;
        }

        this.UpdateDivSize();

        var svg = d3.select("#"+this.svgID);
        svg.selectAll("*").remove();
        if(this.value == 0) return;

        var DrawHumanShape = function(headR,bodyW,bodyH,legW,legH,padT){
            var halfSize = this.size*0.5;
            var d = [
                "M", halfSize, padT, 
                "A", headR, headR, 0, 0, 0, halfSize, headR*2+padT,
                "H", halfSize-bodyW*0.4,
                "A", bodyW*0.1, bodyW*0.1, 0, 0, 0, halfSize-bodyW*0.5, padT+headR*2+bodyW*0.1,
                "V", padT+headR*2+bodyH*0.9,
                "A", bodyW*0.1, bodyW*0.1, 0, 0, 0, halfSize-bodyW*0.4, padT+headR*2+bodyH,
                "H", halfSize-legW*0.5,
                "V", padT+headR*2+bodyH+legH*0.9,
                "A", legW*0.1, legW*0.1, 0, 0, 0, halfSize-legW*0.4, padT+headR*2+bodyH+legH,
                "H", halfSize+legW*0.4,
                "A", legW*0.1, legW*0.1, 0, 0, 0, halfSize+legW*0.5, padT+headR*2+bodyH+legH*0.9,
                "V", padT+headR*2+bodyH,
                "H", halfSize+bodyW*0.4,
                "A", bodyW*0.1, bodyW*0.1, 0, 0, 0, halfSize+bodyW*0.5, padT+headR*2+bodyH*0.9,
                "V", padT+headR*2+bodyH*0.1,
                "A", bodyW*0.1, bodyW*0.1, 0, 0, 0, halfSize+bodyW*0.4, padT+headR*2,
                "H", halfSize,
                "A", headR, headR, 0, 0, 0, halfSize, padT,
            ].join(" ");

            var clipID = this.svgID+"_clipPath"
            svg.append("clipPath").attr({
                id: clipID
            }).append("path").attr({
                d: d
            });

            var fillH = this.size-(this.size-padT)*Math.min(1,this.value/180.0);
            svg.append("rect").attr({
                x: 0,
                y: 0,
                width: this.size,
                height: fillH,
                "clip-path":"url(#"+clipID+")",
                fill: "#888888",
                opacity: this.opacity
            });

            svg.append("rect").attr({
                x: 0,
                y: fillH,
                width: this.size,
                height: this.size,
                "clip-path":"url(#"+clipID+")",
                fill: this.color(this.value),
                opacity: this.opacity
            });

            var strokeColor = (this.value>=50?"#3333ff":"#333333");
            var strokeWidth = (this.value>=50?2:1)
            svg.append("path").attr({
                d: d,
                stroke: strokeColor,
                "stroke-width": strokeWidth,
                fill: "None"
            });
        }.bind(this);

        /*if(this.value >= 50){
            for(var i=-1;i<2;i++){
                svg.append("text").attr({
                    "x": this.size*(0.5+i*0.1),
                    "y": 0,
                    "fill": "#ff0000",
                    "text-anchor":"middle",
                    "alignment-baseline": "hanging"
                }).style({
                    "font-size": this.size*0.2,
                    "font-weight": "bold",
                    "transform-origin": "50% 50%",
                    "transform": "rotate("+15*i+"deg)"
                }).text("!");
            }
        }*/

        var headR = this.size*0.12;
        var bodyW = this.size*0.42;
        var bodyH = this.size*0.3;
        var legW = this.size*0.25;
        var legH = this.size*0.25;
        var padT = this.size*0.2;
        DrawHumanShape(headR,bodyW,bodyH,legW,legH,padT);
        
    }
}
