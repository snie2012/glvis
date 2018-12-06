import * as d3 from "d3";

function draw(group, data, w, h, margin) {
    let xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[0]))
        .range([margin.left, w - margin.right]);

    let yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[1])).nice()
        .range([h - margin.bottom, margin.top]);

    let xAxis = g => g
        .attr("transform", `translate(0,${h - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(w/20));

    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .call(g => g.select(".domain").remove());

    let line = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));

    group.append("path")
        .datum(data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'red');
    
    group.append("g")
        .call(xAxis);
    
    group.append("g")
        .call(yAxis);
}

export {draw};