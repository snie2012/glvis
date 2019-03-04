import * as d3 from 'd3';

class Scatterplot1D {
    constructor(svg, data, width, height, color) {
        this.svg = svg;
        this.data = data;

        const margin = ({top: 10, right: 20, bottom: 10, left: 30});

        let x = d3.scaleLinear()
            .domain(d3.extent(data))
            .nice()
            .range([margin.left, width - margin.right]);

        // Render circles for datapoints
        this.g = svg.append("g")
            .attr('transform', `translate(0, ${height - 3 * margin.bottom})`);
        
        this.g.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", d => x(d))
            .attr("cy", 5)
            .attr('r', 4)
            .style('stroke', color)
            .style('fill', 'none');
        
        // Render xAxis
        svg.append("g")
            .attr('transform', `translate(0, ${height - 2 * margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        // Bind brush event
        this.bindBrush(svg, width, height, margin)
    }

    bindBrush(group, w, h, margin) {
        // Add brush event
        let brush = d3.brushX()
            .extent([[-2, 0], [w + 2, h - 2 * margin.bottom]])
            .on("brush end", this.brushed.bind(this));

        group.append("g")
            .attr("class", "brush")
            .call(brush);
    }

    brushed() {
        console.log('brush ended');
    }
}

export {Scatterplot1D}