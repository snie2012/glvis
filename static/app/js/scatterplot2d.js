import * as d3 from "d3";

class Scatterplot2D {
    constructor(data, svg, w, h, padding) {
        this.data = data;
        this.svg = svg;
        this.w = w;
        this.h = h;
        this.padding = padding;

        //Set scales
        this.xScale = d3.scaleLinear()
            .domain((d3.extent(data, d => d[0])))
            .range([padding, w - padding * 2]);

        this.yScale = d3.scaleLinear()
            .domain((d3.extent(data, d => d[1])))
            .range([h - padding, padding]);

        this.xAxis = d3.axisBottom().scale(this.xScale).ticks(10);
        this.yAxis = d3.axisLeft().scale(this.yScale).ticks(10);

        this.group = svg.append('g')
                .attr('width', [padding, w - padding * 2])
                .attr('height', [h-padding, padding]);

        this.group.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => this.xScale(d[0]))
            .attr("cy", d => h - this.yScale(d[1]))
            .attr("r", 2)
            .attr("fill", "lightgray")
            .style("stroke", 'black')
            .attr("stroke-width", 0.5);

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
}


export {Scatterplot2D};

// https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f