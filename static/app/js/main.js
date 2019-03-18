import "../css/main.scss";

import * as d3 from "d3";
import d3_tip from "d3-tip";
import 'bootstrap';

import {postJson} from "./util";

import {WordCloud} from "./wordcloud";
import {Histogram} from "./histogram";
import {HeatMap} from './heatmap';

// Expose d3 to the global scope (used for debugging)
window.d3 = d3;
window.d3_tip = d3_tip;

// Set height for the subset area to support overflow scroll
d3.select('#subset-area')
    .style('height', window.innerHeight * 0.85 + 'px')
    .style('overflow-y', 'scroll');

// Set height for the domain area to support overflow scroll
// d3.select('#domain-area')
//     .style('height', window.innerHeight * 0.9 + 'px')
//     .style('overflow-y', 'scroll');

let modelName = 'bert_mrpc';

// Bind event to model name selector
d3.selectAll('#model-name-list a').on('click', function() {
    modelName = d3.select(this).html();
    document.getElementById('model-name-input').setAttribute("value", modelName);
})


// Bind query event
d3.select('#query-button').on('click', () => {
    const sample_size = document.getElementById('query-input').value;
    if (!sample_size) return;
    console.log('Sample size: ', sample_size);
    
    // Retrive subset data from a specified endpoint, then visualize the data
    const request_data = {
        'sample_size': sample_size,
        'model_name': modelName,
        'db_col_name': modelName
    }
    
    postJson('/query_model_data', request_data).then(data => {
        console.log(data);
        subsetArea(sample_size, data);
    })
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
    const width = histRow.node().parentElement.clientWidth * 0.5, 
          height = 200;

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
let heatmapDrawArea;
let scatterplotButton;
const RowNum = 2, ColNum = 3;
let curRowNum = RowNum, curColNum = ColNum;
const maxClusterNum = 31;

// Tooltip for heatmap
let heatmap_tip = d3_tip().attr('class', 'd3-tip').html(function(d) { return d.mean ? d.mean : d; });
let scatterplot_tip = d3_tip().attr('class', 'd3-tip').html(function(d) { 
    return "prediction: " + d.prediction['class'] + '</br>' + 'probability: ' + d.prediction['prob']; 
});

function dimensionArea(term, data) {
    // Show selected subset's information
    let infoRow = d3.select('#selected-subset-info');

    infoRow.html('Query term: <b>' + term + '</b>.  Number of instances: <b>' + data.sentences.length + '</b>');

    // Draw heatmap for the selected subset

    // Clear dimension draw area if it already exists
    // Set height for the dimension area to support overflow scroll
    if (heatmapDrawArea) heatmapDrawArea.remove();
    heatmapDrawArea = d3.select('#heatmap-area')
        .append('div')
        .attr('class', 'row m-1')
        .style('height', window.innerHeight * 0.45 + 'px');

    // width, height and padding for scatterplot svg
    const width = heatmapDrawArea.node().parentElement.clientWidth - 50, 
          height = heatmapDrawArea.node().parentElement.clientHeight * 0.85; 
    const padding = 20;

    let heatmapSvg = heatmapDrawArea.append('svg')
                        .attr('width', width + 50)
                        .attr('height', height + 50)
                        .call(heatmap_tip);
    
    let heatMap = new HeatMap(data.heatmap_data, data.vectors, data.request_identifier, heatmapSvg, width, height, padding, heatmap_tip, scatterplot_tip, 'Summary');


    // Pop information to row and column cluster dropdown menus

    // First reset rowNum and colNum
    curRowNum = RowNum;
    curColNum = ColNum;

    let rowMenu = d3.select('#row-menu');
    
    let rowButton = rowMenu.select('button');
    if (rowButton) rowButton.remove();
    rowMenu.append('button')
        .attr('class', 'btn btn-secondary dropdown-toggle')
        .attr('type', 'button')
        .attr('id', 'dropdownMenuButton')
        .attr('data-toggle', 'dropdown')
        .attr('aria-haspopup', 'true')
        .attr('aria-expanded', 'false')
        .html('Rows');

    let rowDropDown = rowMenu.select('div');
    if (rowDropDown) rowDropDown.remove();
    rowDropDown = rowMenu.append('div')
        .attr('class', 'dropdown-menu')
        .attr('aria-labelledby', 'dropdownMenuButton');
    const rowNum = data.vectors.length < maxClusterNum ? data.vectors.length : maxClusterNum;
    for (let i = 2; i < rowNum; i++) {
        rowDropDown.append('a')
            .attr('class', 'dropdown-item')
            .html(i)
            .on('click', function() {
                if (i == curRowNum) return; // Ignore if the same row is selected
                curRowNum = i;

                // Request new heatmap data and redraw the corresponding heatmap
                const request_data = {
                    'request_identifier': heatMap.request_identifier,
                    'row_num': curRowNum,
                    'col_num': curColNum
                }
                
                postJson('/heatmap_data', request_data).then(data => {
                    heatMap.summary_data = data.heatmap_data;
                    heatMap.reDraw();
                })
            });
    }

    let colMenu = d3.select('#col-menu');

    let colButton = colMenu.select('button');
    if (colButton) colButton.remove();
    colMenu.append('button')
        .attr('class', 'btn btn-secondary dropdown-toggle')
        .attr('type', 'button')
        .attr('id', 'dropdownMenuButton')
        .attr('data-toggle', 'dropdown')
        .attr('aria-haspopup', 'true')
        .attr('aria-expanded', 'false')
        .html('Columns');

    let colDropDown = colMenu.select('div');
    if (colDropDown) colDropDown.remove();
    colDropDown = colMenu.append('div')
        .attr('class', 'dropdown-menu')
        .attr('aria-labelledby', 'dropdownMenuButton');
    const colNum = data.vectors[0].length < maxClusterNum ? data.vectors[0].length : maxClusterNum;
    for (let i = 2; i < colNum; i++) {
        colDropDown.append('a')
            .attr('class', 'dropdown-item')
            .html(i)
            .on('click', function() {
                if (i == curColNum) return; // Ignore if the same column is selected
                curColNum = i;

                // Request new heatmap data and redraw the corresponding heatmap
                const request_data = {
                    'request_identifier': heatMap.request_identifier,
                    'row_num': curRowNum,
                    'col_num': curColNum
                }

                postJson('/heatmap_data', request_data).then(data => {
                    heatMap.summary_data = data.heatmap_data;
                    heatMap.reDraw();
                })
            });
    }

    // Create scatterplotting button and bind event
    if (scatterplotButton) scatterplotButton.remove();
    scatterplotButton = d3.select('#button-area').append('button')
        .attr('type', 'button')
        .attr('class', 'btn btn-primary')
        .html('Scatterplot')
        .on('click', () => heatMap.drawSelected());
}
