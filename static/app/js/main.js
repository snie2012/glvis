import "../css/main.scss";

import * as d3 from "d3";
import {draw as scatterplot} from "./scatterplot";
import {draw as parcoords} from "./parallel_cooridinates";

import 'parcoord-es/dist/parcoords.css';
import ParCoords from 'parcoord-es';

window.d3 = d3;


//width and height
const w = 600;
const h = 400;
const padding = 40;

//load data
// d3.json('/embeddings').then(function(d){
//     console.log(d);

//     const w = 600;
//     const h = 400;
//     const padding = 40;
//     let svg = d3.select("body")
//         .append("svg")
//         .attr("width", w)
//         .attr("height", h)
//         .style('border', 'solid 1px red');

//     scatterplot(d.embeddings, svg, w, h, padding);
// })

d3.json('/neighbors', {
    method:"POST",
    body: JSON.stringify({
        word: 'heaven'
    }),
    headers: {
        "Content-type": "application/json"
    },
    mode: "cors"
  })
  .then(response => {
      // parcoords(response.vectors, '#pl');
    console.log(response);

    // prepare data for area drawing
    const data = response.line_data;

    const w = 1200;
    const h = 100;
    const padding = 40;
    let svg = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .style('border', 'solid 1px red');

    const margin = ({top: 20, right: 20, bottom: 30, left: 30});

    let x = d3.scaleLinear()
        .domain(d3.extent(data, d => d[0]))
        .range([margin.left, w - margin.right]);

    let y = d3.scaleLinear()
        .domain(
            [0, d3.max(data, d => d[1])])
            .nice()
        .range([h - margin.bottom, margin.top]);

    let xAxis = g => g
        .attr("transform", `translate(0,${h - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(w/20));
    
    let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove());
    
    console.log(y.domain(), y.range());

    let area = d3.area()
        .x(d => x(d[0]))
        .y0(d => y(0))
        .y1(d => y(d[1]));
        
    svg.append("path")
        .datum(data)
        .attr("fill", "steelblue")
        .attr("d", area);

    svg.append("g")
        .call(xAxis);
    
    svg.append("g")
        .call(yAxis);;
  });

