import * as d3 from 'd3';

class Histogram {
    constructor(data, svg, width, height, color) {
        this.data = data;
        this.svg = svg;

        const margin = ({top: 10, right: 20, bottom: 30, left: 30});

        let x = d3.scaleLinear()
            .domain(d3.extent(data))
            .nice()
            .range([margin.left, width - margin.right]);
        
        this.bins = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(40))
            (data);
        
        let y = d3.scaleLinear()
            .domain([0, d3.max(this.bins, d => d.length)]).nice()
            .range([height - margin.bottom, margin.top])

        let xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        let yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove());

        this.g = svg.append("g").attr("fill", color);

        this.rects = this.g.selectAll("rect")
            .data(this.bins)
            .enter().append("rect")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", d => y(d.length))
            .attr("height", d => y(0) - y(d.length));
        
        svg.append("g")
            .call(xAxis)
            .selectAll('text')
            .attr("transform", "rotate(60, -5, 18)");
        
        svg.append("g")
            .call(yAxis);
    }
}

export {Histogram};