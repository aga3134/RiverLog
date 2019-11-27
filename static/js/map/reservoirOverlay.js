class ReservoirOverlay extends SvgOverlay{
    constructor(option){
        super(option);
        this.percent = option.percent;
        this.opacity = option.opacity||1;
        this.color = option.color;
    }

    Update(option){
        if(option){
            if(option.size) this.size = option.size;
            if(option.percent) this.percent = option.percent;
            if(option.opacity) this.opacity = option.opacity;
            if(option.map) this.map = option.map;
            if(option.color) this.color = option.color;
        }

        this.UpdateDivSize();

        var circleColor = "#dddddd";
        var textColor = "#ffffff";
        var waveTextColor = "#eeeeee";
        var waveColor = "rgba(0,0,0,0)";
        var backgroundColor = "rgba(150,150,150,"+this.opacity+")";
        if(this.percent < 25){
            waveColor = "rgba(255,50,50,"+this.opacity+")";
            textColor = "rgb(255,0,0)";
            circleColor = "rgb(255,0,0)";
            backgroundColor = "rgba(255,200,200,"+this.opacity+")";
        }
        else if(this.percent < 50){
            waveColor = "rgba(245,151,111,"+this.opacity+")";
            textColor = "rgb(255,230,150)";
            circleColor = "rgb(255,230,150)";
            backgroundColor = "rgba(150,150,150,"+this.opacity+")";
        }
        if(this.color){
            var rgb = g_Util.HexToRGB(this.color);
            waveColor = "rgba("+rgb.r+","+rgb.g+","+rgb.b+","+this.opacity+")";
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
        var svg = $("#"+this.svgID);
        if(svg.length > 0){
            svg.html("");
            loadLiquidFillGauge(this.svgID, this.percent, config);
        }
    }
}
