import "../css/main.scss";
import "../css/tooltip.css";

import * as d3 from "d3";
import d3_tip from "d3-tip";
import 'bootstrap';

import {createDropdownInput, createMultipleDropdowns} from "./ui_helper";
import {postJson} from "./util";

import {WordCloud} from "./wordcloud";
import {SentenceCloud} from "./sentencecloud";
import {TextFingerprint} from "./text_fingerprint";
import {Histogram} from "./histogram";
import {SepHeatmap} from './sep_heatmap';
import {Scatterplot2D} from './scatterplot2d';
import {StackedBarChart} from './stacked_bar_chart';

// Expose d3 to the global scope (used for debugging)
window.d3 = d3;
window.d3_tip = d3_tip;

// Set up constants
const scplot_width = 300;
const scplot_height = 240;
const wcplot_width = 500;
const wcplot_height = 500;
const fingerprint_width = 300;
const fingerprint_height = 300;

const DEFAULT_DIM_NUM = 2, DEFAULT_INST_COUNT = 2;
const MAX_DIM_NUM = 10, MAX_INST_NUM = 10;


// Set height for the canvas area to support overflow scroll
d3.select('#canvas')
    .style('height', window.innerHeight * 0.945 + 'px')
    .style('overflow-y', 'scroll');


// Set default values for model name, query method and query term
let model_name = 'bert_mrpc';
let cluster_method = 'hier';
let query_method = 'random_sample';
let dm_method = 'umap';
d3.select('#model-name-input').property("value", model_name);
d3.select('#query-method-input').property("value", query_method);
d3.select('#cluster-method-input').property("value", cluster_method);
d3.select('#dm-method-input').property("value", dm_method);
d3.select('#query-input').property("value", 100);

// Bind event to model name selector
d3.selectAll('#model-name-list a').on('click', function() {
    model_name = d3.select(this).html();
    d3.select('#model-name-input').property("value", model_name);
})

// Bind event to cluster method selector
d3.selectAll('#cluster-method-list a').on('click', function() {
    cluster_method = d3.select(this).html();
    d3.select('#cluster-method-input').property("value", cluster_method);
})

// Bind event to query method selector
d3.selectAll('#query-method-list a').on('click', function() {
    query_method = d3.select(this).html();
    d3.select('#query-method-input').property("value", query_method);
})

// Bind event to dm method selector
d3.selectAll('#dm-method-list a').on('click', function() {
    dm_method = d3.select(this).html();
    d3.select('#dm-method-input').property("value", dm_method);
})

// Bind query event
d3.select('#query-button').on('click', () => {
    const query_input = d3.select('#query-input').property('value');
    if (!query_input) return;

    console.log(`Model name: ${model_name}`);
    console.log(`Cluster method: ${cluster_method}`);
    console.log(`Query method: ${query_method}`);
    console.log(`Query input: ${query_input}`);

    const request_data = {
        'cluster_method': cluster_method,
        'query_method': query_method,
        'query_input': query_input,
        'model_name': model_name,
        'db_col_name': model_name
    }
    
    // Retrive subset data from a specified endpoint, then visualize the data
    postJson('/query_model_data', request_data).then(data => {
        console.log(data);
        let row = createRow();
        drawInfoArea(row.info, query_input, data);
        let heatmap = drawSummaryArea(row, data);

        const plot_rows = createDetailRows(row, data.heatmap_data);
        drawDetailArea(plot_rows[0], plot_rows[1], plot_rows[2], data, heatmap);
    })
})


function createRow() {
    let rowDiv = d3.select('#canvas').append('div')
        .attr('class', 'row m-1 border-bottom border-secondary');
    
    let infoDiv = rowDiv.append('div')
        .attr('class', 'row m-1 border-bottom border-secondary')
        .style('width', `${window.innerWidth * 0.99}px`);

    let canvasDiv = rowDiv.append('div')
        .attr('class', 'row')
        .style('width', `${window.innerWidth * 0.99}px`)
        .style('height', `${800}px`);
    
    let summaryDiv = canvasDiv.append('div')
        .attr('class', 'col-3 m-1 pr-0 border-right border-secondary');
        // .style('width', `${contentDiv.node().clientWidth * 0.2}px`);

    return {
        'info': infoDiv,
        'canvas': canvasDiv,
        'summary': summaryDiv
    };
}

function createDetailRows(row_div, heatmap_data) {
    // Redraw detail area
    if (row_div.detail) row_div.detail.remove();
    row_div.detail = row_div.canvas.append('div')
        .attr('class', 'col ml-1 p-0 border-bottom border-secondary')
        .style('height', `${row_div.canvas.node().clientHeight}px`)
        .style('overflow-y', 'scroll');

    let scp_row = row_div.detail.append('div')
        .attr('class', 'row ml-1 p-0 border-bottom border-secondary')
        .style('width', `${scplot_width * heatmap_data.dims.length + 100}px`)
        .style('height', `${scplot_height}px`);

    let stack_row = row_div.detail.append('div')
        .attr('class', 'row ml-1 p-0 border-bottom border-secondary')
        .style('width', `${scplot_width * heatmap_data.dims.length + 100}px`)
        .style('height', `${scplot_height}px`);

    let wc_rows = [];
    for (let w = 0; w < heatmap_data.dims.length; w++) {
        const w_row = row_div.detail.append('div')
            .attr('class', 'row ml-1 p-0 border-bottom border-secondary')
            .style('width', `${wcplot_width * heatmap_data.insts[w].length + 100}px`)
            .style('height', `${wcplot_height}px`);
            wc_rows.push(w_row);
    }

    return [scp_row, stack_row, wc_rows];
}

function drawInfoArea(parentDiv, input, data) {
    // Create rows to display the query info
    parentDiv.append('div')
        .attr('class', 'col ml-1 p-0 text-center')
        .html(`Model name: <b>${model_name}</b>`);

    parentDiv.append('div')
        .attr('class', 'col ml-1 p-0 text-center')
        .html(`Query method: <b>${query_method}</b>`);
    
    parentDiv.append('div')
        .attr('class', 'col ml-1 p-0 text-center')
        .html(`Cluster method: <b>${cluster_method}</b>`);

    parentDiv.append('div')
        .attr('class', 'col ml-1 p-0 text-center')
        .html(`Query input: <b>${input}</b>`);

    parentDiv.append('div')
        .attr('class', 'col ml-1 p-0 text-center')
        .html(`Number of instances: <b>${data.num_of_inputs}</b>`);

}


function drawSummaryArea(row_div, data) {
    // Set default values
    let cur_dim_num = DEFAULT_DIM_NUM;
    let cur_insts_recorder = _.fill(Array(DEFAULT_DIM_NUM), DEFAULT_INST_COUNT);

    // Create dropdown lists to control the number of clusters of the heatmap
    let dims_div =  row_div.summary.append('div')
        .attr('class', 'row m-1');
    
    let dims_menu = createDropdownInput(dims_div);
    dims_menu.button.html('Dims');
    dims_menu.input.attr('value', cur_dim_num);

    let dims_items = dims_menu.dropdown.selectAll('a')
        .data(d3.range(1, MAX_DIM_NUM, 1))
        .enter()
        .append('a')
        .attr('class', 'dropdown-item')
        .html(d => d);
    
    // Menu for instances
    let insts_parent_div =  row_div.summary.append('div')
        .attr('class', 'row m-1');
    
    let insts_div = insts_parent_div.append('div')
        .attr('class', 'row m-1');

    let recfg_button = createMultipleDropdowns(insts_div, DEFAULT_DIM_NUM, MAX_INST_NUM, DEFAULT_INST_COUNT, cur_insts_recorder, 'Reconfigure');
    
    // Draw heatmap for the selected subset

    // Clear dimension draw area if it already exists
    // Set height for the dimension area to support overflow scroll
    let heatmapDrawArea = row_div.summary.append('div')
        .attr('class', 'row m-3')
        .style('height', 500 + 'px');

    // width, height and padding for scatterplot svg
    const width = heatmapDrawArea.node().clientWidth - 100;
    const height = heatmapDrawArea.node().clientHeight - 100; 
    const padding = 20;

    let svg = heatmapDrawArea.append('svg')
                        .attr('width', width + 50)
                        .attr('height', height + 50);
    
    let heatMap = new SepHeatmap(data, svg, width, height, padding);

    // Bind event to dropdown menus
    dims_items.on('click', (d) => {
        // Ignore if the same row is selected
        if (d == cur_dim_num) return;

        // Set current selecte value
        cur_dim_num = d;
        dims_menu.input.attr('value', cur_dim_num);

        // Recreate dropdown menus for subset selection
        cur_insts_recorder = _.fill(Array(cur_dim_num), DEFAULT_INST_COUNT);

        if (insts_div) insts_div.remove();
        insts_div =  insts_parent_div.append('div')
            .attr('class', 'row m-1');

        let recreated_button = createMultipleDropdowns(insts_div, cur_dim_num, MAX_INST_NUM, DEFAULT_INST_COUNT, cur_insts_recorder, 'Reconfigure');

        recreated_button.on('click', () => {
            reDrawAll(row_div, data, cur_dim_num, cur_insts_recorder, heatMap);
        })
    });

    recfg_button.on('click', () => {
        reDrawAll(row_div, data, cur_dim_num, cur_insts_recorder, heatMap);
    })

    return heatMap;
}


function reDrawAll(row_div, data, cur_dim_num, cur_insts_recorder, heatmap) {
    const request_data = {
        'request_identifier': heatmap.request_identifier,
        'dim_num': cur_dim_num,
        'insts_nums': cur_insts_recorder
    }
    
    postJson('/heatmap_data', request_data).then(d => {
        data.heatmap_data = d.heatmap_data;
        
        heatmap.reDraw(d.heatmap_data);

        const plot_rows = createDetailRows(row_div, d.heatmap_data);
        drawDetailArea(plot_rows[0], plot_rows[1], plot_rows[2], data, heatmap);
    })
}


let counter = 0;
function drawDetailArea(scp_row, stack_row, wc_rows, data, heatmap) {
    let dims_data = data.heatmap_data.dims;
    let insts_data = data.heatmap_data.insts;
    if (counter == dims_data.length) {
        counter = 0;
        return;
    }

    // Prepare data to be used in following plots
    const instances = insts_data[counter].map(d => d.instances);
    let plot_data = [];
    instances.forEach((inst_group, group_id) => {
        inst_group.forEach((inst_id) => {
            let td = {};
            td.instance_id = inst_id;
            td.input = data.inputs[inst_id];
            td.group_id = group_id;

            if (data.tag_type == 'no_tag') {
                // pass;
            } else if (data.tag_type == 'binary') {
                const pred = data.predictions[inst_id];
                const argmax = pred[0] > pred[1] ? 0 : 1;
                const prob = argmax == 0 ? pred[argmax] : -pred[argmax];
                td.prediction = {'class': argmax, 'prob': prob};
            } else if (data.tag_type == 'multiclass') {
                const pred = data.predictions[inst_id];
                td.tag = pred;
                td.prediction = data.tag_dict[pred];
            }

            plot_data.push(td);
        })
    })


    // Request data
    const request_data = {
        'request_identifier': data.request_identifier,
        'dm_method': dm_method,
        'dimensions': dims_data[counter].dimensions
    }

    postJson('/dimension_reduction', request_data).then((dm_data) => {
        console.log(dm_data);

        const scp_data = plot_data.map((d) => {
            d['coords'] = dm_data.coords[d['instance_id']];
            return d;
        });

        // Draw scatterplots
        const scplot = drawScplots(data, scp_data, scp_row);

        heatmap.scatterplots.push(scplot);

        // Draw stacked bars
        drawStackedBars(instances, data, scp_data, scplot, stack_row);

        // Draw word clouds for one set of dimensions
        // drawWordClouds(counter, data, wc_rows);
        drawTextFingerprints(counter, data, wc_rows);

        // Increment counter and do a recursive call
        counter++;

        drawDetailArea(scp_row, stack_row, wc_rows, data, heatmap);
    })
}


function drawScplots(data, scp_data, row) {
    // Draw scatterplots
    const width = scplot_width, 
          height = scplot_height, 
          padding = 30;

    let svg = row.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', `translate(${5}, ${0})`);

    return new Scatterplot2D(data.tag_type, scp_data, svg, width, height, padding);
}


function drawStackedBars(instances, data, scp_data, scplot, row) {
    // Draw stacked bars
    // Process scp_data to be used for stacked bars
    if (data.tag_type == 'no_tag') return;

    let cur_len = 0;
    let psum = [0];
    for (let i = 0; i < instances.length; i++) {
        cur_len += instances[i].length;
        psum.push(cur_len);
    }

    let stacked_data = [];
    for (let gid = 0; gid < psum.length - 1; gid++) {
        let td = {};
        td.group_id = gid;
        td.total = instances[gid].length;
        td.instances = instances[gid];

        if (data.tag_type == 'binary') {
            td['0'] = 0;
            td['1'] = 0;
        } else if (data.tag_type == 'multiclass') {
            for (let tag in data.tag_dict) {
                td[tag] = 0;
            }
        }

        for (let si = psum[gid]; si < psum[gid+1]; si++) {
            const d = scp_data[si];
            if (data.tag_type == 'binary') {
                td[d.prediction.class] += 1;
            } else if (data.tag_type == 'multiclass') {
                td[d.tag] += 1;
            }
        }

        stacked_data.push(td);
    }

    const width = scplot_width, 
          height = scplot_height, 
          padding = 20;

    let svg = row.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', `translate(${5}, ${0})`);
    
    let tag_keys = data.tag_type == 'binary' ? [0, 1] : Object.keys(data.tag_dict);

    let has_legend = false;
    if (counter == 0) has_legend = true;
    let stacked_chart = new StackedBarChart(stacked_data, tag_keys, svg, width, height, padding, scplot, has_legend);
}


function drawWordClouds(counter, data, rows) {
    // Draw word clouds for one set of dimensions
    const row = rows[counter];
    const width = wcplot_width, 
          height = wcplot_height, 
          padding = 20;
    const cur_insts = data.heatmap_data.insts[counter];
    for (let w = 0; w < cur_insts.length; w++) {
        let svg = row.append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('transform', `translate(${5}, ${0})`);

        if (data.input_type == 'word') {
            const words = cur_insts[w].instances.map(idx => data.inputs[idx]);
            let wc = new WordCloud(words, svg, width, height, padding);
        } else if (data.input_type == 'sentence') {
            const cleaned_sentences = cur_insts[w].instances.map(idx => data.cleaned_inputs[idx]);
            let wc = new SentenceCloud(cleaned_sentences, svg, width, height, padding);
        }
    }
}


function drawTextFingerprints(counter, data, rows) {
    const row = rows[counter];
    const width = fingerprint_width, 
          height = fingerprint_height, 
          padding = 20;
    
    const extent = [-1, d3.extent(data.inputs_length)[1]];

    const cur_insts = data.heatmap_data.insts[counter];
    for (let w = 0; w < cur_insts.length; w++) {
        let svg = row.append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('transform', `translate(${5}, ${5})`);

        const stats = cur_insts[w].instances.map((idx) => {
            return {
                'input': data.inputs[idx],
                'value': data.inputs_length[idx]
            }
        });

        let fingerprint = new TextFingerprint(stats, svg, width, height, padding, extent);
    }
}