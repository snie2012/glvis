import * as d3 from 'd3';
import * as _ from "lodash";

class Scatterplot1D {
    constructor(svg, data, sentiments, width, height, color, wordCloud) {
        this.svg = svg;
        this.data = data;
        this.wordCloud = wordCloud;

        const margin = ({top: 10, right: 20, bottom: 10, left: 30});

        this.x = d3.scaleLinear()
            .domain(d3.extent(data))
            .nice()
            .range([margin.left, width - margin.right]);

        // Render circles for datapoints
        this.g = svg.append("g")
            .attr('transform', `translate(0, ${height - 3 * margin.bottom})`);
        
        let divergingScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);
        let schemeScale = d3.schemeCategory10;
        this.g.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", d => this.x(d))
            .attr("cy", 5)
            .attr('r', 4)
            .style('stroke', (d, i) => {
                // const confidence = sentiments[i]['sentiment'] == 'POSITIVE' ? sentiments[i]['confidence'] : -sentiments[i]['confidence'];
                const prediction = sentiments[i]['sentiment'] == 'POSITIVE' ? 0 : 3;
                return schemeScale[prediction];
            })
            .style('fill', 'none');
        
        // Render xAxis
        svg.append("g")
            .attr('transform', `translate(0, ${height - 2 * margin.bottom})`)
            .call(d3.axisBottom(this.x).tickSizeOuter(0));

        // Bind brush event
        this.bindBrush(svg, width, height, margin)
    }

    bindBrush(group, w, h, margin) {
        // Add brush event
        let brush = d3.brushX()
            .extent([[0, 0], [w, h - 2 * margin.bottom]])
            .on("brush end", this.brushed.bind(this));

        group.append("g")
            .attr("class", "brush")
            .call(brush);
    }

    brushed() {
        let s = d3.event.selection;
        // If nothing is selected, return
        if (!s) return;

        // Calculate the selected range of value
        const range = s.map(this.x.invert, this.x);

        // Get the selected instances
        let selectedElms = [];
        _.forEach(this.data, (value, idx) => {
            if (value >= range[0] && value <= range[1]) selectedElms.push(idx);
        });

        if (selectedElms.length == 0) return;

        // Plot domain visualizations with selected elements
        this.wordCloud.setData(selectedElms);
    }
}

export {Scatterplot1D}