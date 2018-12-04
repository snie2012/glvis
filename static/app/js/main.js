import * as d3 from "d3";
import {draw as scatterplot} from "./scatterplot";

//width and height
const w = 600;
const h = 400;
const padding = 40;

//load data
d3.json('/embeddings').then(function(d){
    console.log(d);

    const w = 600;
    const h = 400;
    const padding = 40;
    let svg = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .style('border', 'solid 1px red');

    scatterplot(d.embeddings, svg, w, h, padding);
})