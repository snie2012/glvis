import * as d3 from "d3";

class FilterLine {
    constructor(group, w, h, margin, knobPos, color, height, dataAttr, mulAreaPlot) {
        this.group = group;
        this.w = w;
        this.h = h;
        this.margin = margin;
        this.knobPos = knobPos;
        this.color = color;
        this.height = height;
        this.dataAttr = dataAttr;
        this.mulAreaPlot = mulAreaPlot;

        this.line = group.append("line")
            .attr('x1', margin.left)
            .attr('x2', w - margin.right)
            .attr('y1', height)
            .attr('y2', height)
            .attr('fill', 'none')
            .attr('stroke', color);
        
        this.circle = group.append('circle')
            .attr('cx', () => this.knobPos == 'left' ? margin.left : w - margin.right)
            .attr('cy', height)
            .attr('r', 10)
            .style('fill', 'white')
            .style('stroke', 'green')
            .style('stroke-width', 4)
            // bind dragging behavior
            .call(d3.drag()
                .on("start", this._dragstarted.bind(this))
                .on("drag", this._dragged.bind(this))
                .on("end", this._dragended.bind(this)));
    }

    _dragstarted(d) {}

    _dragged(d) {
        this.circle.attr("cy", d3.event.y);
        this.line.attr('y1', d3.event.y).attr('y2', d3.event.y);
    }

    _dragended(d) {
        let threshold = this.dataAttr == 'mean' ?  this.mulAreaPlot.yMeanScale.invert(d3.event.y) : this.mulAreaPlot.yStdScale.invert(d3.event.y);

        this.threshold = threshold;
        console.log(this.dataAttr + ' threshold: ', threshold);

        if (this.dataAttr == 'mean') {
            this.filterDims = this.mulAreaPlot.data.filter(d => d[this.dataAttr] > threshold).map(d => d.dim);
        } else {
            this.filterDims = this.mulAreaPlot.data.filter(d => d[this.dataAttr] < threshold).map(d => d.dim);
        }

        let visibleData = [];
        for (let dim of this.filterDims) {
            visibleData.push(this.mulAreaPlot.parcoords.data[dim]);
        }

        const plData = d3.transpose(visibleData).map((d, i) => {d['id'] = i; return d;});
        this.mulAreaPlot.parcoords.draw(plData);
    }
}


export {FilterLine};