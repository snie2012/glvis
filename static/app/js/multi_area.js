import * as d3 from "d3";

import {draw as parcoords} from "./parallel_cooridinates";

class MultiAreaPlot {
    constructor (group, data, plContainer, plData, w, h, margin) {
        this.group = group;
        this.data = data;
        this.plContainer = plContainer;
        this.plData = plData;
        this.w = w;
        this.h = h;
        this.margin = margin;

        this.plDiv = null;

        this.setup();
        this.draw();
        this.bindBrush();
    }

    setup() {
        let data = this.data, margin = this.margin, w = this.w, h = this.h;
        // Scales
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d['dim']))
            .range([margin.left, w - margin.right]);

        this.yMeanScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d['mean']))
            .range([h - margin.bottom, margin.top]);
        
        this.yStdScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d['std']))
            .range([h - margin.bottom, margin.top]);

        // Axes
        this.xAxis = g => g
            .attr("transform", `translate(0,${h - margin.bottom})`)
            .call(d3.axisBottom(this.xScale).ticks(w/20));

        this.yMeanAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(this.yMeanScale))
            .call(g => g.select(".domain").remove());
            
        this.yStdAxis = g => g
            .attr("transform", `translate(${w - margin.right},0)`)
            .call(d3.axisRight(this.yStdScale))
            .call(g => g.select(".domain").remove());
    }

    draw() {
        // draw mean
        let meanArea = d3.area()
            .x((d, i) => this.xScale(i))
            .y0(d => this.yMeanScale(d3.min(this.data, d => d['mean'])))
            .y1(d => this.yMeanScale(d['mean']));

        this.group.append("path")
            .datum(this.data)
            .attr('d', meanArea)
            // .attr('stroke', 'red')
            .attr('fill', 'lightgray');

        // draw std
        let stdArea = d3.area()
            .x((d, i) => this.xScale(i))
            .y0(d => this.yStdScale(d3.min(this.data, d => d['std'])))
            .y1(d => this.yStdScale(d['std']));

        this.group.append("path")
            .datum(this.data)
            .attr('d', stdArea)
            // .attr('stroke', 'black')
            // .attr('stroke-width', 0.5)
            .attr('fill-opacity', 0.5)
            .attr('fill', 'steelblue');
        
        this.group.append("g")
            .call(this.xAxis);
        
        this.group.append("g")
            .call(this.yMeanAxis);

        this.group.append("g")
            .call(this.yStdAxis);
    }

    bindBrush() {
        // Add brush event
        let margin = this.margin, w = this.w, h = this.h;
        let brush = d3.brushX()
            .extent([[margin.left, margin.top], [w - margin.right, h - margin.bottom]])
            .on("brush end", this.brushed.bind(this));

        this.group.append("g")
            .attr("class", "brush")
            .call(brush);
    }

    brushed() {
        if (this.plDiv) this.plDiv.remove();
        this.plDiv = this.plContainer.append("div")
            .attr('class', 'parcoords')
            .attr('id', 'pl')
            .style("width", this.w + 'px')
            .style("height", this.h + 'px');

        // prepare data for parallel coordinates
        let s = d3.event.selection;
        if (!s) return;

        const range = s.map(this.xScale.invert, this.xScale);
        let visibleData = [];
        for (let i = Math.ceil(range[0]); i <= Math.floor(range[1]); i++) {
            const dim = this.data[i].dim;
            visibleData.push(this.plData[dim]);
        }

        // console.log(visibleData);
        
        parcoords(d3.transpose(visibleData), '#pl');
    }
}

export {MultiAreaPlot};