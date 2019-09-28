class ReservoirOverlay extends SvgOverlay{
    constructor(option){
        super(option);
        this.percent = option.percent;
        this.opacity = option.opacity||1;
    }

    Update(option){
        if(option){
            if(option.size) this.size = option.size;
            if(option.percent) this.percent = option.percent;
            if(option.opacity) this.opacity = option.opacity;
        }

        this.UpdateDivSize();

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
        var svg = $("#"+this.svgID);
        if(svg.length > 0){
            svg.html("");
            loadLiquidFillGauge(this.svgID, this.percent, config);
        }
    }
}