import * as d3 from 'd3';
import * as _ from 'lodash';
import {postJson} from './util';
import {Scatterplot2D} from './scatterplot2d';


class HeatMap {
    constructor(summary_data, detail_data, request_identifier, svg, width, height, padding, heatmap_tip, scatterplot_tip, mode, row_div) {
        this.summary_data = summary_data;
        this.detail_data = detail_data;
        this.request_identifier = request_identifier;
        this.svg = svg;
        this.heatmap_tip = heatmap_tip;
        this.scatterplot_tip = scatterplot_tip;
        this.mode = mode;
        this.row_div = row_div;

        this.width = width;
        this.height = height;
        this.padding = padding;

        // Flatten summary data
        this.summary_flattend = _.flatten(this.summary_data);

        // Flatten detail data
        this.detail_flattend = _.flatten(this.detail_data);

        // Calculate unit length for row and column
        this.unit_width = width / detail_data[0].length;
        this.unit_height = height / detail_data.length;

        // Define color scale
        this.summary_color_scale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(this.summary_flattend, d => d.mean));
        this.detail_color_scale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(this.detail_flattend));

        // Draw
        this.reDraw();
    }

    reDraw() {
        if (this.transform_group) this.transform_group.remove();

        // Flatten summary data. This is needed because summary_data can be updated
        this.summary_flattend = _.flatten(this.summary_data);

        // Recalculate color scale
        this.summary_color_scale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(this.summary_flattend, d => d.mean));
        this.detail_color_scale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(this.detail_flattend));

        // Define the overall group, apply some transforms
        this.transform_group = this.svg.append('g')
            .attr('transform', `translate(${10}, ${10})`);

        // Draw row group
        this.drawRowGroup();

        // Draw column group
        this.drawColGroup();
       
        // Draw heatmap cells
        this.cell_group = this.transform_group.append('g')
            .attr('transform', `translate(${this.padding}, ${this.padding})`);
        
        this.cells = this.mode == 'Summary' ? this.drawSummaryCells() : this.drawDetailCells();

        // Bind cell events
        this.bindCellEvents();

        // Bind zoom event
        this.bindZoom();
    }

    drawRowGroup() {
         // Draw rects to pruely support interaction along y axis
         this.row_selected = new Set(); // To store which rows are selected

         this.row_group = this.transform_group.append('g')
             .attr('transform', `translate(${0}, ${this.padding})`);
 
         this.row_group
             .selectAll('rect')
             .data(this.summary_data.map(row => row[0]).map((elm) => {elm['row_selected'] = this.row_selected; return elm;}))
             .enter()
             .append('rect')
             .attr('x', d => d.x * this.unit_width)
             .attr('y', d => d.y * this.unit_height)
             .attr('width', this.padding * 0.8)
             .attr('height', d => d.h * this.unit_height)
             .style('stroke', 'black')
             .style('stroke-width', 0.3)
             .style('stroke-dasharray', (d, i) => {
                 if (i == this.summary_data[0].length - 1) return;
                 return (this.padding * 0.8 + d.h * this.unit_height) + ',' + (this.padding * 0.8) + ',' + (d.h * this.unit_height);
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
    }

    drawColGroup() {
        // Draw rects to purely support interaction along x axis
        this.col_selected = new Set(); // To store which columns are selected

        this.col_group = this.transform_group.append('g')
            .attr('transform', `translate(${this.padding}, ${0})`);

        this.col_group
            .selectAll('rect')
            .data(this.summary_data[0].map((elm) => {elm['col_selected'] = this.col_selected; return elm;}))
            .enter()
            .append('rect')
            .attr('x', d => d.x * this.unit_width)
            .attr('y', d => d.y * this.unit_height)
            .attr('width', d => d.w * this.unit_width)
            .attr('height', this.padding * 0.8)
            .style('stroke', 'black')
            .style('stroke-width', 0.3)
            .style('stroke-dasharray', (d, i) => {
                if (i == this.summary_data.length - 1) return;
                return (d.w * this.unit_width) + ',' + (this.padding * 0.8) + ',' + (d.w * this.unit_width + this.padding * 0.8);
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
    }

    drawSummaryCells() {
        return this.cell_group
            .selectAll('rect')
            .data(this.summary_flattend)
            .enter()
            .append('rect')
            .attr('x', d => d.x * this.unit_width)
            .attr('y', d => d.y * this.unit_height)
            .attr('width', d => d.w * this.unit_width)
            .attr('height', d => d.h * this.unit_height)
            .style('fill', d => this.summary_color_scale(d.mean));
    }

    drawDetailCells() {
        return this.cell_group
            .selectAll('rect')
            .data(this.detail_flattend)
            .enter()
            .append('rect')
            .attr('x', (d, i) => {
                return this.unit_width * (i % this.detail_data[0].length);
            })
            .attr('y', (d, i) => {
                return this.unit_height * Math.floor(i / this.detail_data[0].length);
            })
            .attr('width', this.unit_width)
            .attr('height', this.unit_height)
            .style('fill', d => this.detail_color_scale(d));
    }

    bindCellEvents() {
        this.cells.on('mouseover', this.heatmap_tip.show)
            .on('mouseout', this.heatmap_tip.hide)
            .on('click', (d) => {
                if (this.mode == 'Detail') return;
                const request_data = {
                    'request_identifier': this.request_identifier,
                    'instances': d.instances,
                    'dimensions': d.dimensions,
                    'dm_method': 'umap'
                }

                postJson('/dimension_reduction', request_data).then(data => {
                    console.log(data);
                    this.drawScatterplot(data);
                })
            });
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

    drawScatterplot(data) {
        let scatterplotRow = this.row_div.select('#scatterplot2d');
        if (scatterplotRow) scatterplotRow.remove();

        scatterplotRow = this.row_div
            .append('div')
            .attr('class', 'col-3 ml-1 p-0')
            .attr('id', 'scatterplot2d');
        
        const width = scatterplotRow.node().clientWidth, 
              height = scatterplotRow.node().clientHeight, 
              padding = 30;
        let scatterplotSvg = scatterplotRow.append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(this.scatterplot_tip);

        this.scatterplot = new Scatterplot2D(data.tag_type, data.plot_data, scatterplotSvg, width, height, padding, this.scatterplot_tip);
    }

    getSelected() {
        // Draw scatterplot based on selected rows and columns
        this.selected_instances = [];
        this.selected_dimensions = [];

        if (this.row_selected.size == 0 && this.col_selected.size == 0) return;

        if (this.row_selected.size == 0) {
            // No row is selected, use all the rows for the selected columns
            this.col_selected.forEach((col_id) => {
                this.selected_dimensions.push(this.summary_data[0][col_id].dimensions);
            })
        } else if (this.col_selected.size == 0) {
            // No column is selected, use all the columns for the selected rows
            this.row_selected.forEach((row_id) => {
                this.selected_instances.push(this.summary_data[row_id][0].instances);
            })
        } else {
            this.col_selected.forEach((col_id) => {
                this.selected_dimensions.push(this.summary_data[0][col_id].dimensions);
            })

            this.row_selected.forEach((row_id) => {
                this.selected_instances.push(this.summary_data[row_id][0].instances);
            })
        }

        console.log('Selected instances: ', this.selected_instances);
        console.log('Selected dimensions: ', this.selected_dimensions);
    }

    drawSelected() {
        this.getSelected();

        if (this.selected_dimensions.length == 0 && this.selected_instances.length == 0) return;

        const request_data = {
            'request_identifier': this.request_identifier,
            'instances': _.flatten(this.selected_instances),
            'dimensions': _.flatten(this.selected_dimensions),
            'dm_method': 'umap'
        }

        postJson('/dimension_reduction', request_data).then(data => {
            console.log(data);
            this.drawScatterplot(data);
        })
    }
}

export {HeatMap}