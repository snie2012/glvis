import * as d3 from 'd3';

class StackedBarChart {
    constructor(data, keys, svg, width, height, padding) {
        this.data = data;
        this.svg = svg;
        this.keys = keys;
        this.width = width;
        this.height = height;
        this.padding = padding;

        let xScale = d3.scaleBand()
            .rangeRound([padding, width-padding])
            .paddingInner(0.05)
            .align(0.1);

        let yScale = d3.scaleLinear().rangeRound([height - padding, padding]);

        xScale.domain(data.map(d => d.group_id));
        console.log(xScale.domain());
        yScale.domain([0, d3.max(data, d => d.total)]).nice();

        let colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(keys);

        svg.append("g")
            .selectAll("g")
            .data(d3.stack().keys(keys)(data))
            .enter()
            .append("g")
            .attr("fill", d => colorScale(d.key))
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", d => xScale(d.data.group_id))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => (yScale(d[0]) - yScale(d[1])))
            .attr("width", xScale.bandwidth());
    }
}

export {StackedBarChart};