import "../css/main.scss";

import * as d3 from "d3";

import {postJson} from "./post";

import {draw as scatterplot} from "./scatterplot";
import {draw as parcoords} from "./parallel_cooridinates";
import {draw as drawLine} from "./line";
import {draw as drawArea} from "./area";
import {draw as drawMulAreas} from "./multi_area";

window.d3 = d3;

//load data
postJson('/embeddings', {sample_size: 100}).then(data => {
    console.log(data);

    const w = 800;
    const h = 500;
    const padding = 40;
    let svg = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .style('border', 'solid 1px red');

    scatterplot(data.embeddings, svg, w, h, padding);
}).then(() => {
    postJson('/neighbors', {word: 'heaven'}).then(data => {
        console.log(data);

        // sort data
        data.stats.sort((a, b) => a.mean - b.mean);

        const w = 1500;
        const h = 180;
        let svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", 2 * h);
        
        let lineGroup = svg.append('g')
            .attr('width', w)
            .attr('height', h);
            // .style('border', 'solid 1px red');
        
        const margin = ({top: 20, right: 30, bottom: 30, left: 30});

        drawMulAreas(lineGroup, data.stats, w, h, margin);

        // let lineGroup = svg.append('g')
        //     .attr('width', w)
        //     .attr('height', h);
        //     // .style('border', 'solid 1px red');
        
        // const margin = ({top: 20, right: 20, bottom: 30, left: 30});

        // drawLine(lineGroup, data.stats, w, h, margin);

        // let areaGroup = svg.append('g')
        //     .attr('width', w)
        //     .attr('height', h)
        //     .attr("transform", `translate(0,${h/2 + margin.bottom + margin.top})`);

        // drawArea(areaGroup, data.stats, w, h, margin);
    });
});
