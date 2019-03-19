// Helper functions for UI

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

export {createDropdownMenu, createDropdownInput}