import * as d3 from 'd3';

class StackedBarChart {
    constructor(data, keys, svg, width, height) {
        let xScale = d3.scaleBand()
            .rangeRound([0, width])
            .paddingInner(0.05)
            .align(0.1);

        let yScale = d3.scaleLinear().rangeRound([height, 0]);

        xScale.domain(data.map(d => d.group_id));
        console.log(xScale.domain());
        yScale.domain([0, d3.max(data, d => d.total)]).nice();

        let colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        svg.append("g")
            .selectAll("g")
            .data(d3.stack().keys(keys)(data))
            .enter()
            .append("g")
            .attr("fill", function(d) { return colorScale(d.key); })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", function(d) { 
                console.log(d);
                return xScale(d.data.group_id); 
            })
            .attr("y", function(d) { return yScale(d[1]); })
            .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
            .attr("width", xScale.bandwidth());
    }
}

export {StackedBarChart};