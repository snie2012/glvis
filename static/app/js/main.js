import "../css/main.scss";

import * as d3 from "d3";
import d3_tip from "d3-tip";

import {postJson} from "./util";

import {ParallelCoords} from "./parallel_cooridinates";
import {FilterLine} from "./filter_line";
import {MultiAreaPlot} from "./multi_area";
import {WordCloud} from "./wordcloud";
import {Histogram} from "./histogram";
import {Scatterplot1D} from './scatterplot1d';
import {HeatMap} from './heatmap';

// Expose d3 to the global scope (used for debugging)
window.d3 = d3;
window.d3_tip = d3_tip;

// Set height for the subset area to support overflow scroll
d3.select('#subset-area')
    .style('height', window.innerHeight * 0.9 + 'px')
    .style('overflow-y', 'scroll');

// Set height for the domain area to support overflow scroll
d3.select('#domain-area')
    .style('height', window.innerHeight * 0.9 + 'px')
    .style('overflow-y', 'scroll');

// Bind query event
d3.select('#query-button').on('click', () => {
    const sample_size = document.getElementById('query-input').value;
    if (!sample_size) return;
    console.log('Sample size: ', sample_size);

    const endpoint = '/query_bert_mrpc';
    query(endpoint, sample_size);
})

// Designate the previously selected row
let preSelected;

// Logic for the histogram area
// Create a row for each query
function subsetArea(term, data) {
    let subsetRow = d3.select('#subset-area')
        .append('div')
        .attr('class', 'row m-1 border-bottom border-secondary');

    // Bind mouse events to subsetRow to facilitte browsing
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
        .html('Query term: <b>' + term + '</b>.  Number of instances: <b>' + data.sentences.length + '</b>');

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


    // Bind click event to subsetRow to trigger the plot of Scatterplot1D
    subsetRow.on('click', function() {
        let curSelected = d3.select(this);

        // Prevent repetative click on the same row
        if (preSelected && preSelected.node() == curSelected.node()) return;

        // Recover the preselected row to its unselected state
        if (preSelected) {
            preSelected.attr('class', 'row m-1 border-bottom border-secondary');

            preSelected.on('mouseenter', function() {
                d3.select(this).attr('class', 'row m-1 border border-primary');
            });

            preSelected.on('mouseleave', function() {
                d3.select(this).attr('class', 'row m-1 border-bottom border-secondary');
            });
        }

        // Set the current row to the selected state
        curSelected.attr('class', 'row m-1 border border-danger');
        curSelected.on('mouseenter', null);
        curSelected.on('mouseleave', null);

        // Set the new preselected row
        preSelected = curSelected;

        // Draw 1D-scatterplots for the currently selected subset
        dimensionArea(term, data);
    })
}


// Designate the area to draw dimensions
let dimensionDrawArea;

// Tooltip for heatmap
let tip = d3_tip().attr('class', 'd3-tip').html(function(d) { return d.mean; });

function dimensionArea(term, data) {
    // Show selected subset's information
    let infoRow = d3.select('#selected-subset-info')
        .attr('class', 'row m-1 text-center');

    infoRow
        .style('width', infoRow.node().parentElement.clientWidth * 0.8 + 'px')
        .html('Query term: <b>' + term + '</b>.  Number of instances: <b>' + data.sentences.length + '</b>');

    // Draw heatmap for the selected subset

    // Clear dimension draw area if it already exists
    // Set height for the dimension area to support overflow scroll
    if (dimensionDrawArea) dimensionDrawArea.remove();
    dimensionDrawArea = d3.select('#dimension-area')
        .append('div')
        .attr('class', 'row')
        .style('height', window.innerHeight * 0.9 + 'px')
        .style('overflow-y', 'scroll');

    const width = infoRow.node().parentElement.clientWidth * 0.5, 
          height = 300; // width and height for svg

    let heatmapSvg = dimensionDrawArea.append('svg')
                        .attr('width', width + 20)
                        .attr('height', height + 20)
                        .call(tip);
    
    let heatmap = new HeatMap(data.heatmap_data, heatmapSvg, width, height, data.vectors.length, data.vectors[0].length, tip);
}

// Retrive subset data from a specified endpoint, then visualize the data
function query(endpoint, size) {
    postJson(endpoint, {'size': size}).then(data => {
        console.log(data);

        subsetArea(size, data);
    })
}
