import * as d3 from "d3";
import {postJson} from "./util";

class WordPlot {
    constructor(words, vectors, svg, w, h, padding) {
        this.words = words;
        this.vectors = vectors;
        this.svg = svg;
        this.w = w;
        this.h = h;
        this.padding = padding;

        postJson("/tsne", {'vectors': vectors}).then(data => {
            console.log(data);
            this.prepareData(this.words, data.coords);
            this.setup(this.drawData, svg, w, h, padding);
        })
    }

    prepareData(words, coords) {
        this.drawData = words.map((d, i) => {
            return {
                word: d,
                x: coords[i][0],
                y: coords[i][1]
            };
        })
        console.log(this.drawData);
    }

    setup(data, svg, w, h, padding) {
        //Set scales
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.x))
            .range([padding, w - padding * 2]);

        this.yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.y))
            .range([h - padding, padding]);

        this.xAxis = d3.axisBottom().scale(this.xScale).ticks(10);
        this.yAxis = d3.axisLeft().scale(this.yScale).ticks(10);

        this.group = svg.append('g')
                .attr('width', [padding, w - padding * 2])
                .attr('height', [h-padding, padding]);

        this.elms = this.group.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("x", d => this.xScale(d.x))
            .attr("y", d => h - this.yScale(d.y))
            .text(d => d.word)
            .style("font-family", "sans-serif")
            .style("font-size", 15);
    
        //X axis
        this.gX = svg.append("g")
            .attr("class", "x axis")	
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(this.xAxis);

        //Y axis
        this.gY = svg.append("g")
            .attr("class", "y axis")	
            .attr("transform", "translate(" + padding + ", 0)")
            .call(this.yAxis);
        
        // Bind zoom event
        this.zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-100, -100], [w, h]])
            .on("zoom", this.zoomed.bind(this)); 
    
        svg.call(this.zoom);

    }

    zoomed() {
        this.group.attr('transform', d3.event.transform);
        this.gX.call(this.xAxis.scale(d3.event.transform.rescaleX(this.xScale)));
        this.gY.call(this.yAxis.scale(d3.event.transform.rescaleY(this.yScale)));
    }

    resetted() {
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    filter(wordSet) {
        let selected = this.elms.filter(d => wordSet.has(d.word));
        let unselected = this.elms.filter(d => !wordSet.has(d.word));
        
        selected.style("opacity", 1.0);
        unselected.style("opacity", 0.1);
    }


}

export {WordPlot};