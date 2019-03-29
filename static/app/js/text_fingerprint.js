import * as d3 from 'd3';
import d3_tip from "d3-tip";


class TextFingerprint {
    // Draw a heatmap for a list of inputs. 
    // Each entry looks like this: {'input': string, 'value': number}
    constructor(data, svg, width, height, padding, extent) {
        this.svg = svg;
        this.data = data;

        const tip = d3_tip().attr('class', 'd3-tip').html(d => d.input);
        this.svg.call(tip);

        const num_per_row = 30;
        const unit_length = (width - padding) / num_per_row;

        const color_scale = d3.scaleSequential(d3.interpolatePurples).domain(extent);

        this.svg.append('g')
            .attr('transform', `translate(${0}, ${0})`)
            .selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', (d, i) => {
                return (i % num_per_row) * unit_length;
            })
            .attr('y', (d, i)  => {
                return Math.floor(i / num_per_row) * unit_length;
            })
            .attr('width', unit_length)
            .attr('height', unit_length)
            .style('fill', d => color_scale(d.value))
            .on('mouseover.tip', tip.show)
            .on('mouseout.tip', tip.hide);
    }
}


export {TextFingerprint};