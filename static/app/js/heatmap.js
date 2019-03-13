import * as d3 from 'd3';


class HeatMap {
    constructor(data, svg, width, height, num_of_instances, num_of_dims, tip) {
        this.data = data;
        this.svg = svg;
        this.tip = tip;

        // Calculate unit length for row and column
        const unit_width = width / num_of_dims;
        const unit_height = height / num_of_instances;

        // Define color scale
        let divergingScale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(data, d => d.mean));

        this.g = this.svg.append('g')
            .attr('transform', `translate(${10}, ${10})`);

        this.g
            .selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => d.x * unit_width)
            .attr('y', d => d.y * unit_height)
            .attr('width', d => d.w * unit_width)
            .attr('height', d => d.h * unit_height)
            .style('fill', d => divergingScale(d.mean))
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

    }
}

export {HeatMap}