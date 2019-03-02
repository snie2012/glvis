import "../css/main.scss";

import * as d3 from "d3";

import {postJson} from "./util";

import {ParallelCoords} from "./parallel_cooridinates";
import {FilterLine} from "./filter_line";
import {MultiAreaPlot} from "./multi_area";
import {WordCloud} from "./word_cloud";
import {Histogram} from "./histogram";

// Expose d3 to the global scope (used for debugging)
window.d3 = d3;


// Set height for the subset area to support overflow scroll
d3.select('#subset-area')
    .style('height', window.innerHeight * 0.9 + 'px')
    .style('overflow-y', 'scroll');

// Bind query event
d3.select('#query-button').on('click', () => {
    const query_term = document.getElementById('query-input').value;
    if (!query_term) return;
    console.log('Query term: ', query_term);

    const endpoint = '/query_db';
    query(endpoint, query_term);
})

// Retrive subset data from a specified endpoint, then visualize the data
function query(endpoint, term) {
    postJson(endpoint, {term: term}).then(data => {
        console.log(data);

        // Sort data
        // data.stats.sort((a, b) => a.mean - b.mean);

        // Create a row for each query
        let subsetRow = d3.select('#subset-area')
                            .append('div')
                            .attr('class', 'row m-1 border-bottom border-secondary');

        // Bind events to subsetRow
        subsetRow.on('mouseenter', function() {
            d3.select(this).attr('class', 'row m-1 border border-primary');
        })

        subsetRow.on('mouseleave', function() {
            d3.select(this).attr('class', 'row m-1 border-bottom border-secondary');
        })

        // Create a row in subsetRow to display the query term
        let termRow = subsetRow.append('div')
                        .attr('class', 'row m-1 text-center')
                        .style('width', subsetRow.node().parentElement.clientWidth * 0.8 + 'px')
                        .html('Query term: <b>' + term + '</b>.  Number of instances: <b>' + data.subset.length + '</b>');

        // Create a row subsetRow to host histograms
        let histRow = subsetRow.append('div')
                        .attr('class', 'row m-1');

        // Create columns inside the row, one column for one histogram
        let meanCol = histRow.append('div').attr('class', 'col p-1 ');
        let stdCol = histRow.append('div').attr('class', 'col p-1');

        // Set the width and height for each histogram
        const width = 200, height = 200;

        // Create a svg for the histogram of mean values
        // and use it to plot histogram for mean values
        let meanSvg = meanCol.append('svg')
                        .attr('width', width)
                        .attr('height', height);

        let meanHist = new Histogram(data.stats.map(d => d.mean), meanSvg, width, height, '#7fc97f');

        // Create a svg for the histogram of std values
        // and use it to plot histogram for std values
        let stdSvg = stdCol.append('svg')
                        .attr('width', width)
                        .attr('height', height);

        let stdHist = new Histogram(data.stats.map(d => d.std), stdSvg, width, height, '#fdc086');
    })
}
