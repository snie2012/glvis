import * as d3 from 'd3';
import d3_tip from "d3-tip";
import d3_legend from 'd3-svg-legend';

class StackedBarChart {
    constructor(data, keys, svg, width, height, padding, scp, has_legend) {
        this.data = data;
        this.svg = svg;
        this.keys = keys;
        this.width = width;
        this.height = height;
        this.padding = padding;
        this.scp = scp;

        this.tip = d3_tip().attr('class', 'd3-tip')
            .direction('e')
            .html(function() {
                return d3.select(this.parentNode).datum().key;
            });
        this.svg.call(this.tip);

        this.xScale = d3.scaleBand()
            .rangeRound([padding, width-padding])
            .paddingInner(0.05)
            .align(0.1);

        this.yScale = d3.scaleLinear().rangeRound([height - padding, padding]);

        this.xScale.domain(data.map(d => d.group_id));
        this.yScale.domain([0, d3.max(data, d => d.total)]).nice();

        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(keys);

        const stack_data = d3.stack().keys(keys)(data);
        this.rects = svg.append("g")
            .selectAll("g")
            .data(stack_data)
            .enter()
            .append("g")
            .attr("fill", d => d.fill = this.colorScale(d.key))
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", d => this.xScale(d.data.group_id))
            .attr("y", d => this.yScale(d[1]))
            .attr("height", d => (this.yScale(d[0]) - this.yScale(d[1])))
            .attr("width", this.xScale.bandwidth())
            .on('mouseover.tip', this.tip.show)
            .on('mouseout.tip', this.tip.hide)
            .on('mouseover.scp', d => this.scp.stackHighlight(d.data.instances, this.colorScale))
            .on('mouseout.scp', () => this.scp.resetColor());
        
        if (has_legend) this.drawLegend();
    }

    drawLegend() {
        const legend = d3_legend.legendColor()
            .shapePadding(1)
            .ascending(true)
            .scale(this.colorScale);

        this.svg.append('g')
            .attr('transform', `translate(${0}, ${5})`)
            .call(legend);
    }
}

export {StackedBarChart};