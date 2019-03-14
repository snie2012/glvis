import * as d3 from "d3";

class Scatterplot2D {
    constructor(data, svg, w, h, padding, tip) {
        this.data = data;
        this.svg = svg;
        this.w = w;
        this.h = h;
        this.padding = padding;
        this.tip = tip;

        //Set scales
        let xScale = d3.scaleLinear()
            .domain((d3.extent(data, d => d.coords[0])))
            .range([padding, w - padding]);

        let yScale = d3.scaleLinear()
            .domain((d3.extent(data, d => d.coords[1])))
            .range([h - padding, padding]);

        let xAxis = d3.axisBottom().scale(xScale).ticks(10).tickSizeOuter(0);
        let yAxis = d3.axisLeft().scale(yScale).ticks(10).tickSizeOuter(0);

        // Define color scale

        let divergingScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

        this.group = svg.append('g')
                .attr('transform', `translate(${0}, ${0})`)
                .attr('width', [padding, w - padding])
                .attr('height', [h-padding, padding]);

        this.group.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.coords[0]))
            .attr("cy", d => h - yScale(d.coords[1]))
            .attr("r", 3)
            .attr("fill", d => divergingScale(d.prediction['prob']))
            .style("stroke", 'black')
            .attr("stroke-width", 0.1)
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        //X axis
        let gX = svg.append("g")
            .attr("class", "x axis")	
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xAxis);

        //Y axis
        let gY = svg.append("g")
            .attr("class", "y axis")	
            .attr("transform", "translate(" + padding + ", 0)")
            .call(yAxis);
        
        // Bind zoom event
        let zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[0, 0], [w + 20, h + 20]])
            .on("zoom", () => {
                this.group.attr('transform', d3.event.transform);
                gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
                gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));
            }); 
    
        svg.call(zoom);
    }

    resetted() {
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
    }
}


export {Scatterplot2D};

// https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f