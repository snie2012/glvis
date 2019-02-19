import * as d3 from "d3";


class MultiAreaPlot {
    constructor (group, data, w, h, margin, parcoords) {
        this.group = group;
        this.data = data;
        this.w = w;
        this.h = h;
        this.margin = margin;
        
        this.parcoords = parcoords;

        this.plDiv = null;

        this.setup(data, w, h, margin);
        this.draw(group, data);
        this.bindBrush(group, w, h, margin);
    }

    setup(data, w, h, margin) {
        // Scales
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d['dim']))
            .range([margin.left, w - margin.right]);

        this.yMeanScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d['mean']))
            .range([h - margin.bottom, margin.top]);
        
        this.yStdScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d['std']))
            .range([h - margin.bottom, margin.top]);

        // Axes
        this.xAxis = g => g
            .attr("transform", `translate(0,${h - margin.bottom})`)
            .call(d3.axisBottom(this.xScale).ticks(data.length, '.0f'));

        this.yMeanAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(this.yMeanScale))
            .call(g => g.select(".domain").remove());
            
        this.yStdAxis = g => g
            .attr("transform", `translate(${w - margin.right},0)`)
            .call(d3.axisRight(this.yStdScale))
            .call(g => g.select(".domain").remove());
    }

    draw(group, data) {
        // draw mean
        let meanArea = d3.area()
            .x((d, i) => this.xScale(i))
            .y0(d => this.yMeanScale(d3.min(data, d => d['mean'])))
            .y1(d => this.yMeanScale(d['mean']));

        group.append("path")
            .datum(data)
            .attr('d', meanArea)
            // .attr('stroke', 'red')
            .attr('fill', 'lightgray');

        // draw std
        let stdArea = d3.area()
            .x((d, i) => this.xScale(i))
            .y0(d => this.yStdScale(d3.min(data, d => d['std'])))
            .y1(d => this.yStdScale(d['std']));

        group.append("path")
            .datum(this.data)
            .attr('d', stdArea)
            // .attr('stroke', 'black')
            // .attr('stroke-width', 0.5)
            .attr('fill-opacity', 0.5)
            .attr('fill', 'steelblue');
        
        group.append("g")
            .call(this.xAxis);
        
        group.append("g")
            .call(this.yMeanAxis);

        group.append("g")
            .call(this.yStdAxis);
    }

    bindBrush(group, w, h, margin) {
        // Add brush event
        let brush = d3.brushX()
            .extent([[margin.left, margin.top], [w - margin.right, h - margin.bottom]])
            .on("brush end", this.brushed.bind(this));

        group.append("g")
            .attr("class", "brush")
            .call(brush);
    }

    brushed() {
        // prepare data for parallel coordinates
        let s = d3.event.selection;
        if (!s) return;

        const range = s.map(this.xScale.invert, this.xScale);
        this.selectedRange = range;
        if (Math.floor(range[1] - Math.ceil(range[0]) < 1)) return;

        let visibleData = [];
        for (let i = Math.ceil(range[0]); i <= Math.floor(range[1]); i++) {
            const dim = this.data[i].dim;
            visibleData.push(this.parcoords.data[dim]);
        }

        // console.log(visibleData);
        
        const plData = d3.transpose(visibleData).map((d, i) => {
            d['id'] = i; 
            d['word'] = this.parcoords.wordplot.words[i];
            return d;
        });
        this.parcoords.draw(plData);
    }
}

export {MultiAreaPlot};