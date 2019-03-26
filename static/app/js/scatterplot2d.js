import * as d3 from "d3";
import d3_tip from "d3-tip";

class Scatterplot2D {
    constructor(tag_type, data, svg, w, h, padding) {
        this.tag_type = tag_type;
        this.svg = svg;
        this.w = w;
        this.h = h;
        this.padding = padding;

        const formatter = d3.format('.3f');
        this.tip = d3_tip().attr('class', 'd3-tip').html((d) => {
            let tip_text;
            if (d.tag_type == 'no_tag') {
                tip_text = `input: ${d.input}`;
            } else if (d.tag_type == 'binary') {
                tip_text = `input: ${d.input}<br>prediction: ${d.prediction['class']}<br>probability: ${formatter(d.prediction['prob'])}`;
            } else if (d.tag_type == 'multiclass') {
                tip_text = `input: ${d.input}<br>prediction: ${d.tag}`;
            }
            return tip_text; 
        });
        this.svg.call(this.tip);

        data = data.map((d) => {d.tag_type = tag_type; return d;});
        this.data = data;

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
        this.colorScale = null;
        if (this.tag_type == 'binary') {
            this.colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);
        } else if (this.tag_type == 'multiclass') {
            this.colorScale = d3.scaleOrdinal(d3.schemeDark2);
        }

        this.groupColorScale = d3.scaleOrdinal(d3.schemeDark2);

        // Bind brush events before the creation of groups and circles to allow tooltip to show
        this.bindBrush();

        // Define transform group
        this.transformGroup = svg.append('g')
            .attr('transform', `translate(${5}, ${0})`)

        this.group = this.transformGroup.append('g')
                // .attr('transform', `translate(${0}, ${0})`)
                .attr('width', [padding, w - padding])
                .attr('height', [h-padding, padding]);

        this.circles = this.group.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => this.xScale(d.coords[0]))
            .attr("cy", d => h - this.yScale(d.coords[1]))
            .attr("r", 2)
            .attr("fill", (d) => {
                // if (this.tag_type == 'binary') {
                //     return this.colorScale(d.prediction['prob'])
                // } else if (this.tag_type == 'multiclass') {
                //     return this.colorScale(d.prediction);
                // } else if (this.tag_type == 'no_tag') {
                //     return '#beaed4';
                // }
                return this.groupColorScale(d.group_id);
                    
            })
            // .style("stroke", 'black')
            // .attr("stroke-width", 0.1)
            .on('mouseover.tip', this.tip.show)
            .on('mouseout.tip', this.tip.hide)
            .on('mouseover.enlarge', function(d) {
                d3.select(this).attr('r', 5);
            })
            .on('mouseout.enlarge', function() {
                d3.select(this).attr('r', 2);
            });

        //X axis
        this.gX = this.transformGroup.append("g")
            .attr("class", "x axis")	
            .attr("transform", "translate(0," + (h - padding + 6) + ")")
            .call(this.xAxis);

        //Y axis
        this.gY = this.transformGroup.append("g")
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
                this.svg.select("g.brush").raise();
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
        // let scatterplotRow = this.row_div.select('#scatterplot2d');
        // if (!scatterplotRow) scatterplotRow.remove();

        // scatterplotRow = this.row_div
        //     .append('div')
        //     .attr('class', 'col-3 ml-1 p-0')
        //     .attr('id', 'domain');
        
        // const width = scatterplotRow.node().clientWidth, 
        //       height = scatterplotRow.node().clientHeight, 
        //       padding = 30;
        // let scatterplotSvg = scatterplotRow.append('svg')
        //     .attr('width', width)
        //     .attr('height', height)
        //     .call(this.scatterplot_tip);
        
    }

    // Highlight the corresponding instances in the heatmap cell
    heatmapHighlight(instances) {
        const inst_set = new Set(instances);
        this.circles.attr('fill', (d) => {
            if (inst_set.has(d.instance_id)) {
                return "red";
            }
        })
    }

    stackHighlight(instances, color_scale) {
        const inst_set = new Set(instances);
        this.circles.each(function(d) {
            if (inst_set.has(d.instance_id)) {
                let c;
                if (d.tag_type == 'binary') {
                    c = color_scale(d.prediction.class);
                } else if (d.tag_type == 'multiclass') {
                    c = color_scale(d.tag);
                }
                d3.select(this).attr('visibility', 'visible');
                d3.select(this).attr('fill', c);
            } else {
                d3.select(this).attr('visibility', 'hidden');
            }
        })
    }

    // Reset color if no highlight
    resetColor() {
        this.circles.attr('visibility', 'visible');
        this.circles.attr("fill", (d) => {
            // if (this.tag_type == 'binary') {
            //     return this.colorScale(d.prediction['prob'])
            // } else if (this.tag_type == 'multiclass') {
            //     return this.colorScale(d.prediction);
            // } else if (this.tag_type == 'no_tag') {
            //     return '#beaed4';
            // }
            return this.groupColorScale(d.group_id);
        })
    }
}


export {Scatterplot2D};

// https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f