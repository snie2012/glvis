import * as d3 from "d3";

function draw(group, w, h, margin) {
    let line = group.append("line")
        .attr('x1', margin.left)
        .attr('x2', w - margin.right)
        .attr('y1', h / 2)
        .attr('y2', h / 2)
        .attr('fill', 'none')
        .attr('stroke', 'red');
    
    let circle = group.append('circle')
        .attr('cx', w - margin.right)
        .attr('cy', h / 2)
        .attr('r', 10)
        .style('fill', 'white')
        .style('stroke', 'green')
        .style('stroke-width', 4)
        // bind dragging behavior
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    
    
    function dragstarted(d) {
        // d3.select(this).raise().classed("active", true);
    }
    
    function dragged(d) {
        d3.select(this).attr("cy", d3.event.y);
        line.attr('y1', d3.event.y).attr('y2', d3.event.y);
    }
    
    function dragended(d) {
        // d3.select(this).classed("active", false);
        console.log(d3.event.y);
    }
}

export {draw};