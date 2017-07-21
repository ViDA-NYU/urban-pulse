// angular imports
import { ElementRef } from '@angular/core';

// import d3js
import * as d3 from 'd3';

// lodash
import * as _ from 'lodash';

// my services
import { DataService } from './data.class';

export class TseriesChart{
    // margins setup
    private margins: any = {top: 20, right: 50, bottom: 30, left: 20};
    private height: number = 60;
    private padding: number = 50;

    private colorCircles = d3.scaleOrdinal().range(['#FFFFFF','#C7E9C0','#006D2C']);
    private colorLines = d3.scaleOrdinal(d3.schemeCategory10);
    
    private element: any;

    // entire chart size
    private chartWidth: number = 0;
    private chartHeight: number = 0;
    // each matrix size
    private elemWidth: number = 0;
    private elemHeight: number = 0;

    // dom elements
    private div: any;
    private svgTime: any;
    private svgPlot: any;
    private chtTime: any;
    private chtPlot: any;
    private axiX: any;
    private axiY: any;
        
    // axis objects
    private xAxis: any;
    private yAxis: any;
    
    private xRange: any;
    private yRange: any;

    private xScale: any;
    private yScale: any;

    private series: string = 'scalars';
    private res: string = 'HOUR';
    private data: any;
    private cities: any;
    private timeRes: any[];
    
    constructor(element: ElementRef, private dataService : DataService){

        this.cities = dataService.getCities();

        dataService.getFeatures().subscribe((json:any)=>{ 

            this.element = element;
            // sort features
            var features = json.features.sort(function (x: any, y: any) {
                return d3.descending(x.rank, y.rank);
            });
            this.timeRes = Object.keys(features[features.length-1]["resolutions"]);
            this.data = features;
            
            this._buildChart();

            // Adds event listener resize when the window changes size.
            window.addEventListener("resize", () => { this._resize() });
        });
    }

    private _updateRange() {

        var that = this;
        this.yRange = [0, -Infinity];
        this.data.forEach(function(f: any) {

            var v = d3.max(f.resolutions[that.res][that.series]);
            that.yRange[1] = d3.max([that.yRange[1], v]);
        });

        this.xRange = [1, this.data[0].resolutions[this.res][this.series].length];

    }

    private _updateXAxis() {
        var that = this;

        this.xScale = d3.scaleLinear().domain(this.xRange).range([0,this.elemWidth]);
        this.xAxis = d3.axisTop(this.xScale);

        var numTicks = this.data[0].resolutions[this.res][this.series].length;
        var xFormat = d3.format("d");
        this.xAxis
            .ticks(numTicks)
            .tickSize(5)
            .tickFormat(xFormat);

        // data bind
        var axis = this.chtTime.selectAll(".x.axis")
            .data(["time selector"]);

        // update
        this.chtTime.select(".x.axis")
            .attr("transform", "translate("+ 0 +"," + 5 + ")")
            .call(this.xAxis);

        // enter
        axis.enter().append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ 0 +"," + 5 + ")")
            .call(this.xAxis);

        // exit
        axis.exit().remove();

        // add
        this.chtTime.selectAll("circle").remove();
        this.chtTime.selectAll(".tick")
            .append("circle")
            .attr("class","ftype")
            .attr("cx","0")
            .attr("cy","5")
            .attr("r",8);

        // callback
        this.chtTime.selectAll(".tick")
            .on("click", function(d: any){
                // var self = d3.select(this).select("circle");

                // var minClass = self.classed("min");
                // var maxClass = self.classed("max");
                // var saxClass = self.classed("sax");

                // var cls = -1;
                // if(!minClass && !maxClass && !saxClass){
                //     self.classed("min", true);
                //     cls =  0;
                // }
                // else if(minClass && !maxClass && !saxClass){
                //     self.classed("min", false);
                //     self.classed("max", true);
                //     cls =  1;
                // }
                // else if(!minClass && maxClass && !saxClass){
                //     self.classed("max", false);
                //     self.classed("sax", true);
                //     cls =  2;
                // }
                // else if(!minClass && !maxClass && saxClass){
                //     self.classed("sax", false);
                //     cls = -1;
                // }

                // pulse.pulsePlot.timeSelect(d-1,cls);
            });

    }

    private _updateYAxis() {
        var that = this;

        this.yScale = d3.scaleLinear().domain(this.yRange).range([this.height,0]);
        this.yAxis = d3.axisLeft(this.yScale);

        var numTicks = 3;
        var yFormat = d3.format("d");
        this.yAxis
            .ticks(numTicks)
            .tickSize(-this.elemWidth)
            .tickFormat(yFormat);
    }

    private _buildDomElems()
    {
        // element div
        this.div = d3.select(this.element.nativeElement);
        
        // chart size definition
        this.chartWidth  = this.div.node().getBoundingClientRect().width;
        this.chartHeight = this.div.node().getBoundingClientRect().height;

        // small chart size
        this.elemWidth  = this.chartWidth - this.margins.left - this.margins.right;
        this.elemHeight = this.chartHeight - this.margins.top  - this.margins.bottom ;
        
        // create the svg if not defined
        if(typeof this.svgTime === "undefined") {
            this.svgTime = this.div.append('svg');
        }

        if(typeof this.svgPlot === "undefined") {
            this.svgPlot = this.div.append('svg');
        }

        // update the sizes
        this.svgTime.attr("width", this.chartWidth).attr("height", 37);
        this.svgPlot.attr("width", this.chartWidth).attr("height", (this.height+this.padding) * this.data.length);
        
        // create the chart group if not defined
        if(typeof this.chtTime === "undefined") {
            this.chtTime = this.svgTime.append('g');
        }
        if(typeof this.chtPlot === "undefined") {
            this.chtPlot = this.svgPlot.append('g');
        }
        
        // update the sizes
        this.chtTime.attr("width", this.elemWidth).attr("transform", "translate(" + this.margins.left + "," + this.margins.top + ")");
        this.chtPlot.attr("width", this.elemWidth).attr("transform", "translate(" + this.margins.left + "," + 0 + ")");     
    }

    private _getBeatTypes(feature: any) {
        var beats = [];
        var maxTime = feature.resolutions[this.res]["maxTime"];
        var sigMaxTime = feature.resolutions[this.res]["sigMaxTime"];
        for(var i=0; i<maxTime.length; i++) {
            var b = (maxTime[i]?(sigMaxTime[i]?2:1):0);
            beats.push(b);
        }
        return beats;
    }

    private _plot() {

        var that = this;

        this.colorLines.domain(this.cities);
        this.colorCircles.domain(<any>[0,1,2]);

        var line = d3.line()
            .curve(d3.curveLinear)
            .x(function(d: any,i: any) { return that.xScale(i+1); })
            .y(function(d: any)   { return that.yScale(d); });

        this.chtPlot.attr("height", this.data.length?(this.data.length+1)*(this.height + this.padding):10 );

        // panels
        var panels = this.chtPlot.selectAll(".pulsePanel")
            .data(this.data);
        panels.select(".feature")
            .select("path")
            .attr("d", function(d: any) { return line(d.resolutions[that.res][that.series]); })
            .style("stroke", function(d: any) { return "orange"; });
        panels.select(".y.axis")
            .call(this.yAxis);
        var enter = panels.enter()
            .append("g")
            .attr("class", "pulsePanel")
            .attr("transform", function(d: any, i: any){
                return "translate(" + 0 + "," + i*(that.height + that.padding) + ")";
            });
        enter.append("g")
          .attr("class", "y axis")
          .attr("transform", function() { return "translate(0,0)"; })
          .call(this.yAxis);

        enter.append("g")
          .attr("class", "feature")
          .append("path")
          .attr("class", "line")
          .attr("d", function(d: any) { return line(d.resolutions[that.res][that.series]); })
          .style("stroke", function(d: any) { return "orange" });


        var circles = enter.append("g").selectAll(".circle")
            .data( function(d: any){ return that._getBeatTypes(d);} );

        circles.enter()
            .append("circle")
            .attr("class", "circle")
            .attr("cx", function(d: any, i: any){
                return that.xScale(i+1);
            })
            .attr("cy", this.height + 20)
            .attr("r", 8)
            .attr("fill", function(d: any) { return that.colorCircles(d); });

        panels.selectAll(".circle")
            .attr("cx", function(d: any, i: any){
                return that.xScale(i+1);
            })
            .attr("cy", this.height + 20)
            .attr("r", 8)
            .attr("fill", function(d: any) { return that.colorCircles(d); });

        circles.exit().remove();

    }

    private _buildChart() {
        var that = this;

        this._buildDomElems();
        this._updateRange();
        this._updateXAxis();
        this._updateYAxis();
        this._plot();

        // this.div = d3.select(this.element.nativeElement);
        // this.div.select('svg').remove();

        // this.chartWidth  = this.div.node().getBoundingClientRect().width;
        // this.chartWidth -= this.margins.left + this.margins.right;
        // this.chartHeight  = this.div.node().getBoundingClientRect().height;
        // this.chartHeight -= this.margins.top + this.margins.bottom;

        // // scale
        // this.xScale = d3.scaleLinear().domain(this.xRange).range([0,this.chartWidth / 3]);
        // this.yScale = d3.scaleLinear().domain(this.yRange).range([this.chartHeight,0]);

        // // axis
        // this.xAxis = d3.axisBottom(this.xScale);
        // this.yAxis = d3.axisLeft(this.yScale);

        // var numTicks = isSearch?5:5;
        // this.xAxis
        //     .ticks(numTicks)
        //     .tickSize( this.chartHeight )
        //     .tickFormat(d3.format(".1f"));

        // var yFormat = !isSearch?d3.format(".1f"):d3.format("f");
        // this.yAxis
        //     .ticks(numTicks)
        //     .tickSize(-this.chartWidth * this.timeRes.length, 0)
        //     .tickFormat(yFormat);

        

        // this.svg = this.div.append('svg')
        //     .attr("width",  this.chartWidth)
        //     .attr("height", this.chartHeight)
        //     .append("g")
        //     .attr("transform", "translate(" + this.margins.left + "," + this.margins.top + ")");

        // this.svg.selectAll(".x.axis")
        //     .data(this.timeRes)
        //     .enter().append("g")
        //     .attr("class", "x axis")
        //     .attr("transform", function(d: any, i: any) {
        //         var pos = isSearch?0:i;
        //         return "translate(" + (pos * that.chartWidth / that.timeRes.length) + "," + 0 + ")";
        //     })
        //     .each(function(d: any) {
        //         that.xScale.domain(that.xRange);
        //         d3.select(this).call(that.xAxis);
        //     });

        // this.svg.selectAll(".y.axis")
        //     .data(["func"])
        //     .enter()
        //     .append("g")
        //     .attr("class", "y axis")
        //     .attr("transform", function(d: any, i: any) {
        //         var pos = isSearch?0:i;
        //         return "translate("+ (pos*(that.chartWidth / that.timeRes.length)) +", 0)";
        //     })
        //     .each(function() {
        //         that.yScale.domain(that.yRange);
        //         d3.select(this).call(that.yAxis);
        //     });

        // this.svg.selectAll('.cell')
        //     .data(this.timeRes)
        //     .enter()
        //     .append('g')
        //     .attr('class', 'cell')
        //     .attr('transform', function(d: any, i: any) {
        //         var pos = isSearch?0:i;
        //         return "translate(" + (pos*(that.chartWidth / that.timeRes.length)) + ", 0)";
        //     })
        //     .each(function(d: any) {
        //         var cell = d3.select(this);
        //         var data = that.data[d];

        //         cell.append("rect")
        //             .attr("class", "frame")
        //             .attr("x", 0)
        //             .attr("y", 0)
        //             .attr("width",  that.chartWidth / that.timeRes.length)
        //             .attr("height", that.chartHeight );

        //         var circles = cell.selectAll("circle")
        //             .data(data);

        //         circles.enter().append("circle")
        //                 .attr("cx", function(d: any) { return that.xScale(d.x); })
        //                 .attr("cy", function(d: any) { return that.yScale(d.y); })
        //                 .attr("r", 4)
        //                 .style("fill", function(d: any) { return "blue"; });

        //         circles.exit().remove();
        //     });

    }

    private _resize(){
        this._buildChart();    
    }
}