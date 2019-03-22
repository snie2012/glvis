import * as d3 from 'd3';
import * as _ from 'lodash';
import {postJson} from './util';
import {Scatterplot2D} from './scatterplot2d';

class SepHeatmap {
    constructor(data, vectors, request_identifier, svg, width, height, padding, heatmap_tip, scatterplot_tip) {
        this.data = data;
        this.request_identifier = request_identifier;
        this.svg = svg;
        this.heatmap_tip = heatmap_tip;
        this.scatterplot_tip = scatterplot_tip;

        this.width = width;
        this.height = height;
        this.padding = padding;

        this.gap = 0;
        
        this.scatterplots = [];
        
        // Calculate unit length for row and column
        this.unit_width = width / vectors[0].length;
        this.unit_height = height / vectors.length;

        // Draw
        this.reDraw();
    }

    reDraw() {
        if (this.transform_group) this.transform_group.remove();

        // Calculate color scale
        let extents = [];
        extents.push(d3.extent(this.data.dims, d => d.mean));
        this.data.insts.forEach((arr) => {
            extents.push(d3.extent(arr, d => d.mean));
        })
        this.color_scale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(_.flatten(extents)));


        this.transform_group = this.svg.append('g')
            .attr('transform', `translate(${0}, ${10})`);

        this.drawDimensions();
        this.drawInstances();

        this.bindZoom();
        this.bindDimsCellEvent();
        this.bindInstsCellEvent();
    }

    drawDimensions() {
        this.dims_group = this.transform_group.append('g')
            .attr('transform', `translate(${0}, ${0})`);
        
        this.dim_rects = this.dims_group
            .selectAll('rect')
            .data(this.data.dims)
            .enter()
            .append('rect')
            .attr('x', (d, i) => {
                if (i == 0) {
                    return d.x * this.unit_width;
                } else {
                    return d.x * this.unit_width + this.gap;
                }
            })
            .attr('y', 0)
            .attr('width', d => d.w * this.unit_width)
            .attr('height', this.padding * 0.8)
            .style('fill', d => this.color_scale(d.mean));
    }

    drawInstances() {
        this.inst_groups = [];
        this.inst_rects = [];
        for (let count = 0; count < this.data.insts.length; count++) {
            let x_translate = 0;
            if (count != 0) {
                x_translate = count * this.gap + this.unit_width * d3.sum(this.data.dims.slice(0, count), d => d.w);
            }

            let group = this.transform_group.append('g')
                .attr('transform', `translate(${x_translate}, ${this.padding + 10})`);
            
            let rects = group.selectAll('rect')
                .data(this.data.insts[count])
                .enter()
                .append('rect')
                .attr('x', 0)
                .attr('y', d => d.y * this.unit_height)
                .attr('width', this.data.dims[count].w * this.unit_width)
                .attr('height', d => d.h * this.unit_height)
                .style('fill', d => this.color_scale(d.mean));

            this.inst_groups.push(group);
            this.inst_rects.push(rects);
        }
    }

    bindDimsCellEvent() {
        this.dim_rects
            .on('mouseover.tip', this.heatmap_tip.show)
            .on('mouseout.tip', this.heatmap_tip.hide)
            .on('click', (d, i) => {
            })
    }

    bindInstsCellEvent() {
        for (let id = 0; id < this.inst_rects.length; id++) {
            this.inst_rects[id]
                .on('mouseover.tip', this.heatmap_tip.show)
                .on('mouseout.tip', this.heatmap_tip.hide)
                .on('mouseover.highlight', (d) => {
                    if (this.scatterplots.length >= id) {
                        this.scatterplots[id].highlight(d.instances);
                    }
                })
                .on('mouseout.highlight', (d) => {
                    if (this.scatterplots.length >= id) {
                        this.scatterplots[id].resetColor();
                    }
                });
        }
    }

    bindZoom() {
        // Bind zoom event
        let zoom = d3.zoom()
        .scaleExtent([1, 40])
        .translateExtent([[0, 0], [this.width + 30, this.height + 30]])
        .on("zoom", () => {
            this.transform_group.attr('transform', d3.event.transform);
        }); 
        
        this.svg.call(zoom);
    }

    
}

export {SepHeatmap};