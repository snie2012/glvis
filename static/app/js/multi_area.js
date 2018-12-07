import * as d3 from "d3";

import {draw as parcoords} from "./parallel_cooridinates";

function draw(group, data, plContainer, plData, w, h, margin) {
    var w =w, h = h;

    let xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d['dim']))
        .range([margin.left, w - margin.right]);
    
    // const yExtent = d3.extent(d3.merge([d3.extent(data, d => d['mean']), d3.extent(data, d => d['std'])]));
    let yMeanScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d['mean']))
        .range([h - margin.bottom, margin.top]);
    
    let yStdScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d['std']))
        .range([h - margin.bottom, margin.top]);

    let xAxis = g => g
        .attr("transform", `translate(0,${h - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(w/20));

    let yMeanAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yMeanScale))
        .call(g => g.select(".domain").remove());
        
    let yStdAxis = g => g
        .attr("transform", `translate(${w - margin.right},0)`)
        .call(d3.axisRight(yStdScale))
        .call(g => g.select(".domain").remove());

    // draw mean
    // let line = d3.line()
    //     .x((d, i) => xScale(i))
    //     .y(d => yScale(d['mean']));
    
    let meanArea = d3.area()
        .x((d, i) => xScale(i))
        .y0(d => yMeanScale(d3.min(data, d => d['mean'])))
        .y1(d => yMeanScale(d['mean']));

    group.append("path")
        .datum(data)
        .attr('d', meanArea)
        // .attr('stroke', 'red')
        .attr('fill', 'lightgray');

    // draw std
    let stdArea = d3.area()
        .x((d, i) => xScale(i))
        .y0(d => yStdScale(d3.min(data, d => d['std'])))
        .y1(d => yStdScale(d['std']));

    group.append("path")
        .datum(data)
        .attr('d', stdArea)
        // .attr('stroke', 'black')
        // .attr('stroke-width', 0.5)
        .attr('fill-opacity', 0.5)
        .attr('fill', 'steelblue');
    
    group.append("g")
        .call(xAxis);
    
    group.append("g")
        .call(yMeanAxis);

    group.append("g")
        .call(yStdAxis);

    
    // Add brush event
    let brush = d3.brushX()
        .extent([[margin.left, margin.top], [w - margin.right, h - margin.bottom]])
        .on("brush end", brushed);
    
    group.append("g")
        .attr("class", "brush")
        .call(brush);

    var plDiv = null;

    function brushed() {
        // if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        
        // x.domain(s.map(x2.invert, x2));
        // focus.select(".area").attr("d", area);
        // focus.select(".axis--x").call(xAxis);
        // svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
        //     .scale(width / (s[1] - s[0]))
        //     .translate(-s[0], 0));
        if (plDiv) plDiv.remove();
        plDiv = plContainer.append("div")
            .attr('class', 'parcoords')
            .attr('id', 'pl')
            .style("width", w + 'px')
            .style("height", (h) + 'px');

        // prepare data for parallel coordinates
        let s = d3.event.selection;
        if (!s) return;

        const range = s.map(xScale.invert, xScale);
        let visibleData = [];
        for (let i = Math.ceil(range[0]); i <= Math.floor(range[1]); i++) {
            const dim = data[i].dim;
            visibleData.push(plData[dim]);
        }

        // console.log(visibleData);
        
        parcoords(d3.transpose(visibleData), '#pl');
    }
}

export {draw};