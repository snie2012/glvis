import "../css/main.scss";

import * as d3 from "d3";
import d3_tip from "d3-tip";
import 'bootstrap';

import {createDropdownInput} from "./ui_helper";
import {postJson} from "./util";

import {WordCloud} from "./wordcloud";
import {Histogram} from "./histogram";
import {SepHeatmap} from './sep_heatmap';

// Expose d3 to the global scope (used for debugging)
window.d3 = d3;
window.d3_tip = d3_tip;

// Set height for the canvas area to support overflow scroll
d3.select('#canvas')
    .style('height', window.innerHeight * 0.90 + 'px')
    .style('overflow-y', 'scroll');

// Set height for the domain area to support overflow scroll
// d3.select('#domain-area')
//     .style('height', window.innerHeight * 0.9 + 'px')
//     .style('overflow-y', 'scroll');

// Set default values for model name, query method and query term
let model_name = 'bert_mrpc';
let query_method = 'random_sample';
d3.select('#model-name-input').property("value", model_name);
d3.select('#query-method-input').property("value", query_method);
d3.select('#query-input').property("value", 100);

// Bind event to model name selector
d3.selectAll('#model-name-list a').on('click', function() {
    model_name = d3.select(this).html();
    d3.select('#model-name-input').property("value", model_name);
})

// Bind event to query method selector
d3.selectAll('#query-method-list a').on('click', function() {
    query_method = d3.select(this).html();
    d3.select('#query-method-input').property("value", query_method);
})


// Bind query event
d3.select('#query-button').on('click', () => {
    const query_input = d3.select('#query-input').property('value');
    if (!query_input) return;

    console.log(`Model name: ${model_name}`);
    console.log(`Query method: ${query_method}`);
    console.log(`Query method: ${query_input}`);

    let request_data;
    if (query_method == 'random_sample') {
        request_data = {
            'query_method': query_method,
            'sample_size': query_input,
            'model_name': model_name,
            'db_col_name': model_name
        }
    } else if (query_method == 'text_match') {
        request_data = {
            'query_method': query_method,
            'term': query_input,
            'model_name': model_name,
            'db_col_name': model_name
        }
    }
    
    // Retrive subset data from a specified endpoint, then visualize the data
    postJson('/query_model_data', request_data).then(data => {
        console.log(data);
        let newRow = createRow();
        subsetArea(newRow.summary_div, query_input, data);
        dimensionArea(newRow.row_div, newRow.dimension_div, data);
    })
})


function createRow() {
    let rowDiv = d3.select('#canvas').append('div')
        .attr('class', 'row border-bottom border-secondary')
        .style('width', `${window.innerWidth * 0.99}px`)
        .style('height', `${500}px`);
    let summaryDiv = rowDiv.append('div').attr('class', 'col-2 ml-1 pr-0');
    let dimensionDiv = rowDiv.append('div').attr('class', 'col-4 ml-1 p-0');
    return {
        'row_div': rowDiv,
        'summary_div': summaryDiv, 
        'dimension_div': dimensionDiv
    };
}


function subsetArea(parentDiv, input, data) {
    // Create rows to display the query info
    parentDiv.append('div')
        .attr('class', 'row ml-1 p-0 text-center')
        .html(`Model name: <b>${model_name}</b>`);

    parentDiv.append('div')
        .attr('class', 'row ml-1 p-0 text-center')
        .html(`Query method: <b>${query_method}</b>`);

    parentDiv.append('div')
        .attr('class', 'row ml-1 p-0 text-center')
        .html(`Query input: <b>${input}</b>`);

    parentDiv.append('div')
        .attr('class', 'row ml-1 p-0 text-center')
        .html(`Number of instances: <b>${data.vectors.length}</b>`);

    // Create rows for histograms
    let meanRow = parentDiv.append('div').attr('class', 'row m-1 p-0 ');
    let stdRow = parentDiv.append('div').attr('class', 'row m-1 p-0');

    // Set the width and height for each histogram
    const width = parentDiv.node().clientWidth * 0.9, 
          height = parentDiv.node().clientHeight * 0.4;

    // Create a svg for the histogram of mean values
    // and use it to plot histogram for mean values
    let meanSvg = meanRow.append('svg')
        .attr('width', width)
        .attr('height', height);

    let meanHist = new Histogram(data.stats.map(d => d.mean), meanSvg, width, height, '#7fc97f');

    // Create a svg for the histogram of std values
    // and use it to plot histogram for std values
    let stdSvg = stdRow.append('svg')
        .attr('width', width)
        .attr('height', height);

    let stdHist = new Histogram(data.stats.map(d => d.std), stdSvg, width, height, '#fdc086');
}

// Set up constants for the dimension area
const RowNum = 2, ColNum = 3;
let curRowNum = RowNum, curColNum = ColNum;
const maxClusterNum = 31;

// Tooltip for heatmap
let heatmap_tip = d3_tip().attr('class', 'd3-tip').html(function(d) { return d.mean ? d.mean : d; });
let scatterplot_tip = d3_tip().attr('class', 'd3-tip').html(function(d) {
    let tip_text;
    if (d.tag_type == 'no_tag') {
        tip_text = `input: ${d.input}`;
    } else if (d.tag_type == 'binary') {
        tip_text = `input: ${d.input}<br>prediction: ${d.prediction['class']}<br>probability: ${d.prediction['prob']}`;
    } else if (d.tag_type == 'multiclass') {
        tip_text = `input: ${d.input}<br>prediction: ${d.tag}`;
    }
    return tip_text; 
});

function dimensionArea(parentRow, parentDiv, data) {
    // 1. Create row for controller items
    let controllerDiv = parentDiv.append('div')
        .attr('class', 'row m-1 p-0');
    
    // 2. Create dropdown lists to control the number of clusters of the heatmap
    let rowDiv = controllerDiv.append('div')
        .attr('class', 'col');
    
    let rowMenu = createDropdownInput(rowDiv);
    rowMenu.button.html('Rows');

    const rowNum = data.vectors.length < maxClusterNum ? data.vectors.length : maxClusterNum;
    let rowItems = rowMenu.dropdown.selectAll('a')
        .data(d3.range(2, rowNum, 1))
        .enter()
        .append('a')
        .attr('class', 'dropdown-item')
        .html(d => d);
    
    let colDiv = controllerDiv.append('div')
        .attr('class', 'col');
    
    let colMenu = createDropdownInput(colDiv);
    colMenu.button.html('Columns');
    
    const colNum = data.vectors[0].length < maxClusterNum ? data.vectors[0].length : maxClusterNum;
    let colItems = colMenu.dropdown.selectAll('a')
        .data(d3.range(2, colNum, 1))
        .enter()
        .append('a')
        .attr('class', 'dropdown-item')
        .html(d => d);

    // 3. Create button to draw scatterplot
    let scpButton = controllerDiv.append('div')
        .attr('class', 'col')
        .append('button')
        .attr('type', 'button')
        .attr('class', 'btn btn-outline-primary btn-sm')
        .html('Scatterplot');

    // 4. Draw heatmap for the selected subset

    // Clear dimension draw area if it already exists
    // Set height for the dimension area to support overflow scroll
    let heatmapDrawArea = parentDiv.append('div')
        .attr('class', 'row ml-1 p-0')
        .style('height', window.innerHeight * 0.45 + 'px');

    // width, height and padding for scatterplot svg
    const width = heatmapDrawArea.node().parentElement.clientWidth - 100, 
          height = heatmapDrawArea.node().parentElement.clientHeight - 100; 
    const padding = 20;

    let heatmapSvg = heatmapDrawArea.append('svg')
                        .attr('width', width + 50)
                        .attr('height', height + 50)
                        .call(heatmap_tip);
    
    let heatMap = new SepHeatmap(data.heatmap_data, data.vectors, data.request_identifier, heatmapSvg, width, height, padding, heatmap_tip, scatterplot_tip, parentRow);

    // Bind event to scatterplot button
    scpButton.on('click', () => heatMap.drawSelected());

    // Bind event to dropdown menus
    // first reset rowNum and colNum
    curRowNum = RowNum;
    curColNum = ColNum;

    rowMenu.input.attr('value', curRowNum);
    colMenu.input.attr('value', curColNum);

    rowItems.on('click', (d) => {
        if (d == curRowNum) return; // Ignore if the same row is selected
        curRowNum = d;
        rowMenu.input.attr('value', curRowNum);

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

    colItems.on('click', (d) => {
        if (d == curColNum) return; // Ignore if the same column is selected
        curColNum = d;
        colMenu.input.attr('value', curColNum);

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
