import "../css/main.scss";

import * as d3 from "d3";
import {draw as scatterplot} from "./scatterplot";
import {draw as parcoords} from "./parallel_cooridinates";

import 'parcoord-es/dist/parcoords.css';
import ParCoords from 'parcoord-es';


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
        word: 'hello'
    }),
    headers: {
        "Content-type": "application/json"
    },
    mode: "cors"
  })
  .then(response => {
    console.log(response);
    parcoords(response.vectors, '#pl');
  });

