import "../css/main.scss";

import * as d3 from "d3";

import {postJson} from "./util";

import {draw as scatterplot} from "./scatterplot";
import {draw as drawArea} from "./area";

import {ParallelCoords} from "./parallel_cooridinates";
import {FilterLine} from "./filter_line";
import {MultiAreaPlot} from "./multi_area";
import {WordPlot} from "./wordplot";

window.d3 = d3;

//load data
postJson('/embeddings', {sample_size: 100}).then(data => {
    console.log(data);

    const w = 800;
    const h = 500;
    const padding = 40;
    // let svg = d3.select("#scatterplot")
    //     .append("svg")
    //     .attr("width", w)
    //     .attr("height", h)
    //     .style('border', 'solid 1px red');

    // scatterplot(data.embeddings, svg, w, h, padding);
}).then(() => {
    postJson('/neighbors', {word: 'heaven',topn: 150}).then(data => {
        console.log(data);

        // Sort data
        data.stats.sort((a, b) => a.std - b.std);

        // Set plot size
        const w = 1500;
        const h = 180;

        // Set word plot
        let wordPlot = new WordPlot(data.neighbors);

        // Set the div dimensions for parallel coordinates
        let plContainer = d3.select("#pl-container")
            .style("width", w + 'px')
            .style("height", (h) + 'px');
        
        let parcoords = new ParallelCoords(plContainer, data.vectors, w, h, wordPlot);

        // Draw area charts
        let areaSvg = d3.select("#areaplot")
            .append("svg")
            .attr("width", w)
            .attr("height", h);
        
        let areaGroup = areaSvg.append('g')
            .attr('width', w)
            .attr('height', h);
            // .style('border', 'solid 1px red');
        
        const margin = ({top: 20, right: 30, bottom: 30, left: 30});

        let mulAreaPlot = new MultiAreaPlot(areaGroup, data.stats, w, h, margin, parcoords);

        // Draw std filter line
        let stdFilterLine = new FilterLine(areaGroup, w, h, margin, 'right', 'red', h / 2, 'std', mulAreaPlot);
        
        // Draw mean filter line
        let meanFilterLine = new FilterLine(areaGroup, w, h, margin, 'left', 'green', h / 2.5, 'mean',  mulAreaPlot);
    });
});
