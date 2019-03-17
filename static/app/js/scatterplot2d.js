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
        this.xScale = d3.scaleLinear()
            .domain((d3.extent(data, d => d.coords[0])))
            .range([padding, w - padding]);
        this.xRescale = this.xScale.copy();

        this.yScale = d3.scaleLinear()
            .domain((d3.extent(data, d => d.coords[1])))
            .range([h - padding, padding]);
        this.yRescale = this.yScale.copy();

        this.xAxis = d3.axisBottom().scale(this.xScale).ticks(10);
        this.yAxis = d3.axisLeft().scale(this.yScale).ticks(10);

        // Define color scale
        let divergingScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

        // Bind brush events before the creation of groups and circles to allow tooltip to show
        this.bindBrush();

        // Define transform group
        let transformGroup = svg.append('g')
            .attr('transform', `translate(${5}, ${0})`)

        this.group = transformGroup.append('g')
                // .attr('transform', `translate(${0}, ${0})`)
                .attr('width', [padding, w - padding])
                .attr('height', [h-padding, padding]);

        this.group.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => this.xScale(d.coords[0]))
            .attr("cy", d => h - this.yScale(d.coords[1]))
            .attr("r", 4)
            .attr("fill", d => divergingScale(d.prediction['prob']))
            // .style("stroke", 'black')
            // .attr("stroke-width", 0.1)
            .on('mouseover.tip', tip.show)
            .on('mouseout.tip', tip.hide);

        //X axis
        this.gX = transformGroup.append("g")
            .attr("class", "x axis")	
            .attr("transform", "translate(0," + (h - padding + 6) + ")")
            .call(this.xAxis);

        //Y axis
        this.gY = transformGroup.append("g")
            .attr("class", "y axis")	
            .attr("transform", "translate(" + (padding - 6) + ", 0)")
            .call(this.yAxis);
        
        // Bind zoom event
        this.bindZoom();
    }

    bindZoom() {
        // Bind zoom event
        let zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[0, 0], [this.w, this.h]])
            .on("zoom", () => {
                this.group.attr('transform', d3.event.transform);
                this.xRescale = d3.event.transform.rescaleX(this.xScale);
                this.yRescale = d3.event.transform.rescaleY(this.yScale);

                this.gX.call(this.xAxis.scale(this.xRescale));
                this.gY.call(this.yAxis.scale(this.yRescale));
            }); 

        this.svg.call(zoom);
    }

    resetZoom() {
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    bindBrush() {
        // Bind brush event
        let brush = d3.brush()
            .extent([[0, 0], [this.w, this.h]])
            .on('start', () => {
                d3.select("#scatterplot2d svg g.brush").raise();
            })
            .on("brush end", this.brushEnd.bind(this));

        let group = this.svg.append("g")
            .attr("class", "brush")
            .call(brush);
        
        // group.selectAll(".overlay")
        //     .on("mouseup touchend", () => {
        //         if (d3.select("#scatterplot2d svg g.brush rect.selection").style('display') == 'none') {
        //             d3.select("#scatterplot2d svg g.brush").lower();
        //         }
        //     }, true);
    }

    brushEnd() {
        // Get current selection
        let s = d3.event.selection;
        if (!s) return;

        const xRange = [s[0][0], s[1][0]],
              yRange = [s[1][1], s[0][1]];
        
        const xDomain = xRange.map(this.xRescale.invert),
              yDomain = yRange.map(this.yRescale.invert);

        // console.log(xDomain, yDomain);
        
        // If nothing is selected, return
        // if (!selected) return;

        // // Calculate the selected range of value
        // const range = selected.map(this.xScale.invert, this.xScale);

        // // Get the selected instances
        // let selectedElms = [];
        // _.forEach(this.data, (value, idx) => {
        //     if (value >= range[0] && value <= range[1]) {
        //         selectedElms.push(idx);
        //     }
        // });

        // if (selectedElms.length == 0) return;

        // Plot domain visualizations with selected elements
        
    }
}


export {Scatterplot2D};

// https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f