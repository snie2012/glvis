import * as d3 from "d3";

function draw(dataset, svg, w, h, padding) {
    const zoom = d3.zoom()
        .scaleExtent([1, 40])
        .translateExtent([[-100, -100], [w, h]])
        .on("zoom", zoomed);

    //scale function
    var xScale = d3.scaleLinear()
        .domain([
            d3.min(dataset, function(d) { return d[0]; }) - 5, 
            d3.max(dataset, function(d) { return d[0]; })])
        .range([padding, w - padding * 2]);

    var yScale = d3.scaleLinear()
        .domain([
            d3.min(dataset, function(d) { return d[1]; }) - 5, 
            d3.max(dataset, function(d) { return d[1]; })])
        .range([h - padding, padding]);

    var xAxis = d3.axisBottom().scale(xScale).ticks(10);
    var yAxis = d3.axisLeft().scale(yScale).ticks(10);

    let group = svg.append('g')
                .attr('width', [padding, w - padding * 2])
                .attr('height', [h-padding, padding]);
            
    group.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d[0]);
        })
        .attr("cy", function(d) {
            return h - yScale(d[1]);
        })
        .attr("r", 1)
        .attr("fill", "lightgray")
        .style("stroke", 'gray');

    //x axis
    let gX = svg.append("g")
        .attr("class", "x axis")	
        .attr("transform", "translate(0," + (h - padding) + ")")
        .call(xAxis);

    //y axis
    let gY = svg.append("g")
        .attr("class", "y axis")	
        .attr("transform", "translate(" + padding + ", 0)")
        .call(yAxis);
    
    function zoomed() {
        group.attr('transform', d3.event.transform);
        gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
        gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));
    }

    function resetted() {
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
      }      

    svg.call(zoom);
}

export {draw};

// https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f