import * as d3 from 'd3';
import {postJson} from './util';
import {Scatterplot2D} from './scatterplot2d';


class HeatMap {
    constructor(data, request_identifier, svg, width, height, num_of_instances, num_of_dims, tip) {
        this.data = data;
        this.request_identifier = request_identifier;
        this.svg = svg;
        this.tip = tip;

        this.width = width;
        this.height = height;

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
            .on('mouseout', tip.hide)
            .on('click', (d, i) => {
                const request_data = {
                    'request_identifier': this.request_identifier,
                    'instances': d.instances,
                    'dimensions': d.dimensions
                }

                postJson('/tsne', request_data).then(data => {
                    console.log(data);

                    let scatterplotRow = d3.select('#scatterplot2d');
                    if (scatterplotRow) scatterplotRow.remove();

                    scatterplotRow = d3.select('#dimension-area')
                        .append('div')
                        .attr('class', 'row')
                        .attr('id', 'scatterplot2d')
                        .style('height', window.innerHeight * 0.5 + 'px')
                        .style('overflow-y', 'scroll');
                    
                    let scatterplotSvg = scatterplotRow.append('svg')
                        .attr('width', 300)
                        .attr('height', 300);
    
                    this.scatterplot = new Scatterplot2D(data.coords, scatterplotSvg, 300, 300, 10);
                })
            });

    }
}

export {HeatMap}