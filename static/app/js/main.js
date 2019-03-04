import "../css/main.scss";

import * as d3 from "d3";

import {postJson} from "./util";

import {ParallelCoords} from "./parallel_cooridinates";
import {FilterLine} from "./filter_line";
import {MultiAreaPlot} from "./multi_area";
import {WordCloud} from "./wordcloud";
import {Histogram} from "./histogram";
import {Scatterplot1D} from './scatterplot1d';

// Expose d3 to the global scope (used for debugging)
window.d3 = d3;

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
    const query_term = document.getElementById('query-input').value;
    if (!query_term) return;
    console.log('Query term: ', query_term);

    const endpoint = '/query_db';
    query(endpoint, query_term);
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

function dimensionArea(term, data) {
    // Show selected subset's information
    let infoRow = d3.select('#selected-subset-info')
        .attr('class', 'row m-1 text-center');

    infoRow
        .style('width', infoRow.node().parentElement.clientWidth * 0.8 + 'px')
        .html('Query term: <b>' + term + '</b>.  Number of instances: <b>' + data.sentences.length + '</b>');

    // Draw d1-scatterplot for dimensions sorted by standard deviations

    // Sort data based on standard deviations, from large to small
    data.stats.sort((a, b) => a.std - b.std);

    // Clear dimension draw area if it already exists
    // Set height for the dimension area to support overflow scroll
    if (dimensionDrawArea) dimensionDrawArea.remove();
    dimensionDrawArea = d3.select('#dimension-area')
        .append('div')
        .attr('class', 'row')
        .style('height', window.innerHeight * 0.9 + 'px')
        .style('overflow-y', 'scroll');

    // Create a row for each dimension
    // Inside a row, create a svg to draw 1D-scatterplot
    const numOfDims = 20; // set number of dimensions to display
    const width = infoRow.node().parentElement.clientWidth * 0.8, 
          height = 50; // width and height for svg
    
    // Create a wordcloud to be evoked in scatterplots events
    let cloudSvg = d3.select('#domain-area').append('svg');
    let wordCloud = new WordCloud(data.words, cloudSvg, 500, 500, 10);

    for (let i = 0; i < numOfDims; i++) {
        let dimRow = dimensionDrawArea.append('div')
            .attr('class', 'row m-1');

        let dimSvg = dimRow.append('svg')
            .attr('width', width)
            .attr('height', height);

        let dimScatterPlot = new Scatterplot1D(dimSvg, data.vectors[data.stats[i]['dim']], data.sentiments, width, height, 'black', wordCloud);
    }
}

// Retrive subset data from a specified endpoint, then visualize the data
function query(endpoint, term) {
    postJson(endpoint, {term: term}).then(data => {
        console.log(data);

        subsetArea(term, data);
    })
}
