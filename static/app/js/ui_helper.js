// Helper functions for UI

import * as d3 from 'd3';

function createDropdownMenu(parentDiv) {
    const button = parentDiv.append('button')
        .attr('class', 'btn btn-outline-primary btn-sm dropdown-toggle')
        .attr('type', 'button')
        .attr('data-toggle', 'dropdown')
        .attr('aria-haspopup', 'true')
        .attr('aria-expanded', 'false');

    const dropdown = parentDiv.append('div')
        .attr('class', 'dropdown-menu')
        .attr('aria-labelledby', 'dropdownMenuButton');

    return {
        'button': button,
        'dropdown': dropdown
    }
}

function createDropdownInput(parentDiv) {
    const input_group = parentDiv.append('div')
        .attr('class', 'input-group input-group-sm');

    const input_group_prepend = input_group.append('div')
        .attr('class', 'input-group-prepend');
    const button = input_group_prepend.append('button')
        .attr('class', 'btn btn-outline-secondary btn-sm dropdown-toggle')
        .attr('type', 'button')
        .attr('data-toggle', 'dropdown')
        .attr('aria-haspopup', 'true')
        .attr('aria-expanded', 'false');
    const dropdown = input_group_prepend.append('div')
        .attr('class', 'dropdown-menu');

    const input = input_group.append('input')
        .attr('type', 'text')
        .attr('class', 'form-control')
        .attr('aria-label', 'Text input with dropdown button');

    return {
        'button': button,
        'dropdown': dropdown,
        'input': input
    }
}

function createMultipleDropdowns(parentDiv, numOfSelects, numOfOptions, defaultOption, insts_recorder, buttonText) {
    let select_div = parentDiv.append('div').attr('class', 'row m-0 p-0 d-0');

    for (let i = 0; i < numOfSelects; i++) {
        const col = select_div.append('div')
            .attr('class', 'col m-0 p-0 d-0');
        
        const menu = createDropdownInput(col);

        menu.button.html(`D${i+1}`);

        menu.dropdown.selectAll('a')
            .data(d3.range(2, numOfOptions, 1))
            .enter()
            .append('a')
            .attr('class', 'dropdown-item')
            .html(d => d)
            .on('click', (d) => {
                menu.input.attr('value', d);
                insts_recorder[i] = d;
            });
        
        menu.input.attr('value', defaultOption);
    }

    const button = parentDiv.append('div')
        .attr('class', 'row m-0 p-0 d-0')
        .append('button')
        .attr('class', 'btn btn-outline-secondary btn-sm')
        .html(buttonText);

    return button;
}

export {createDropdownMenu, createDropdownInput, createMultipleDropdowns}