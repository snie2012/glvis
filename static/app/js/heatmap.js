import * as d3 from 'd3';
import * as _ from 'lodash';
import {postJson} from './util';
import {Scatterplot2D} from './scatterplot2d';


class HeatMap {
    constructor(summary_data, detail_data, request_identifier, svg, width, height, padding, heatmap_tip, scatterplot_tip, mode) {
        this.summary_data = summary_data;
        this.detail_data = detail_data;
        this.request_identifier = request_identifier;
        this.svg = svg;
        this.heatmap_tip = heatmap_tip;
        this.scatterplot_tip = scatterplot_tip;
        this.mode = mode;

        this.width = width;
        this.height = height;

        // Calculate unit length for row and column
        const unit_width = width / detail_data[0].length;
        const unit_height = height / detail_data.length;

        // Flatten data
        this.summary_flattend = _.flatten(summary_data);
        this.detail_flattend = _.flatten(detail_data);

        // Define color scale
        this.summary_color_scale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(this.summary_flattend, d => d.mean));
        this.detail_color_scale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(this.detail_flattend));

        // Define the overall group, apply some transforms
        this.transform_group = this.svg.append('g')
            .attr('transform', `translate(${10}, ${10})`);

        // Draw rects to purely support interaction along x axis
        this.col_selected = new Set(); // To store which columns are selected

        this.col_group = this.transform_group.append('g')
            .attr('transform', `translate(${padding}, ${0})`);

        this.col_group
            .selectAll('rect')
            .data(summary_data[0].map((elm) => {elm['col_selected'] = this.col_selected; return elm;}))
            .enter()
            .append('rect')
            .attr('x', d => d.x * unit_width)
            .attr('y', d => d.y * unit_height)
            .attr('width', d => d.w * unit_width)
            .attr('height', padding * 0.8)
            .style('stroke', 'black')
            .style('stroke-width', 0.3)
            .style('stroke-dasharray', (d, i) => {
                if (i == summary_data.length - 1) return;
                return (d.w * unit_width) + ',' + (padding * 0.8) + ',' + (d.w * unit_width + padding * 0.8);
            })
            .style('fill', 'white')
            .on('click', function(d, i) {
                const cur_fill = d3.select(this).style('fill');
                const to_fill = cur_fill == 'white' ? '#1b9e77' : 'white';
                d3.select(this).style('fill', to_fill);

                if (to_fill == 'white') {
                    // Remove row from selected
                    d.col_selected.delete(i);
                } else {
                    // Add row to selected
                    d.col_selected.add(i);
                }

                console.log('Selected columns: ', d.col_selected);
            });


        // Draw rects to pruely support interaction along y axis
        this.row_selected = new Set(); // To store which rows are selected

        this.row_group = this.transform_group.append('g')
            .attr('transform', `translate(${0}, ${padding})`);

        this.row_group
            .selectAll('rect')
            .data(summary_data.map(row => row[0]).map((elm) => {elm['row_selected'] = this.row_selected; return elm;}))
            .enter()
            .append('rect')
            .attr('x', d => d.x * unit_width)
            .attr('y', d => d.y * unit_height)
            .attr('width', padding * 0.8)
            .attr('height', d => d.h * unit_height)
            .style('stroke', 'black')
            .style('stroke-width', 0.3)
            .style('stroke-dasharray', (d, i) => {
                if (i == summary_data[0].length - 1) return;
                return (padding * 0.8 + d.h * unit_height) + ',' + (padding * 0.8) + ',' + (d.h * unit_height);
            })
            .style('fill', 'white')
            .on('click', function(d, i) {
                const cur_fill = d3.select(this).style('fill');
                const to_fill = cur_fill == 'white' ? '#1b9e77' : 'white';
                d3.select(this).style('fill', to_fill);

                if (to_fill == 'white') {
                    // Remove row from selected
                    d.row_selected.delete(i);
                } else {
                    // Add row to selected
                    d.row_selected.add(i);
                }

                console.log('Selected rows', d.row_selected);
            });

        // Draw heatmap cells
        this.cell_group = this.transform_group.append('g')
            .attr('transform', `translate(${padding}, ${padding})`);
        
        this.cells = mode == 'Summary' ? this.drawSummaryCells(unit_width, unit_height) : this.drawDetailCells(unit_width, unit_height);
            
        this.cells.on('mouseover', heatmap_tip.show)
            .on('mouseout', heatmap_tip.hide)
            .on('click', (d) => {
                if (this.mode == 'Detail') return;
                const request_data = {
                    'request_identifier': this.request_identifier,
                    'selection_mode': 'Cell_Selected',
                    'instances': d.instances,
                    'dimensions': d.dimensions
                }

                postJson('/tsne', request_data).then(data => {
                    console.log(data);
                    this.drawScatterplot(data);
                })
            });

        
        // Bind zoom event
        let zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[0, 0], [width + 30, height + 30]])
            .on("zoom", () => {
                this.transform_group.attr('transform', d3.event.transform);
            }); 
    
        this.svg.call(zoom);
    }

    drawSummaryCells(unit_width, unit_height) {
        return this.cell_group
            .selectAll('rect')
            .data(this.summary_flattend)
            .enter()
            .append('rect')
            .attr('x', d => d.x * unit_width)
            .attr('y', d => d.y * unit_height)
            .attr('width', d => d.w * unit_width)
            .attr('height', d => d.h * unit_height)
            .style('fill', d => this.summary_color_scale(d.mean));
    }

    drawDetailCells(unit_width, unit_height) {
        return this.cell_group
            .selectAll('rect')
            .data(this.detail_flattend)
            .enter()
            .append('rect')
            .attr('x', (d, i) => {
                return unit_width * (i % this.detail_data[0].length);
            })
            .attr('y', (d, i) => {
                return unit_height * Math.floor(i / this.detail_data[0].length);
            })
            .attr('width', unit_width)
            .attr('height', unit_height)
            .style('fill', d => this.detail_color_scale(d));
    }

    drawScatterplot(data) {
        let scatterplotRow = d3.select('#scatterplot2d');
        if (scatterplotRow) scatterplotRow.remove();

        scatterplotRow = d3.select('#scatterplot-area')
            .append('div')
            .attr('class', 'row m-1')
            .attr('id', 'scatterplot2d')
            .style('height', window.innerHeight * 0.45 + 'px');
        
        const width = scatterplotRow.node().parentElement.clientWidth, 
              height = scatterplotRow.node().parentElement.clientHeight * 0.95, 
              padding = 30;
        let scatterplotSvg = scatterplotRow.append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(this.scatterplot_tip);

        this.scatterplot = new Scatterplot2D(data.plot_data, scatterplotSvg, width, height, padding, this.scatterplot_tip);
    }

    drawSelected() {
        // Draw scatterplot based on selected rows and columns
        let selected_instances = [],
            selected_dimensions = [];

        if (this.row_selected.size == 0 && this.col_selected.size == 0) return;

        let selection_mode;

        if (this.row_selected.size == 0) {
            // No row is selected, use all the rows for the selected columns
            selection_mode = 'Dimensions_Only';
            this.col_selected.forEach((col_id) => {
                selected_dimensions.push(this.summary_data[0][col_id].dimensions);
            })
        } else if (this.col_selected.size == 0) {
            // No column is selected, use all the columns for the selected rows
            selection_mode = 'Instances_Only';
            this.row_selected.forEach((row_id) => {
                selected_instances.push(this.summary_data[row_id][0].instances);
            })
        } else {
            selection_mode = 'Both_Instances_and_Dimensions';
            this.col_selected.forEach((col_id) => {
                selected_dimensions.push(this.summary_data[0][col_id].dimensions);
            })

            this.row_selected.forEach((row_id) => {
                selected_instances.push(this.summary_data[row_id][0].instances);
            })
        }

        console.log('Selected instances: ', selected_instances);
        console.log('Selected dimensions: ', selected_dimensions);

        const request_data = {
            'request_identifier': this.request_identifier,
            'selection_mode': selection_mode,
            'instances': selected_instances,
            'dimensions': selected_dimensions
        }

        postJson('/tsne', request_data).then(data => {
            console.log(data);
            this.drawScatterplot(data);
        })
    }
}

export {HeatMap}