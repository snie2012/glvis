import * as d3_cloud from "d3-cloud";
import * as _ from "lodash";

class WordCloud {
    constructor(words, svg, width, height, padding) {
        this.svg = svg;
        this.padding = padding;
        // this.words = _.shuffle(words);

        const counter = _.countBy(words);
        const size_data = Object.entries(counter).map(([k, v]) => {
            return {'text': k, 'size': v};
        });
        const min = _.minBy(size_data, 'size')['size'];
        const max = _.maxBy(size_data, 'size')['size'];
        const scale = max - min;
        this.words = size_data.map((elm) => {
            return {'text': elm['text'], 'size': 10 + 30 * (elm['size'] - min) / scale};
        });

        this.layout = d3_cloud()
            .size([width, height])
            .words(this.words)
            .padding(2)
            .rotate(0)
            .font("Impact")
            .fontSize(function(d) { return d.size; })
            .on("end", this.draw.bind(this));

        this.layout.start();
    }

    draw(data) {
        if (this.g) this.g.remove();

        this.g = this.svg
            .attr("width", this.layout.size()[0])
            .attr("height", this.layout.size()[1])
          .append("g")
            .attr("transform", `translate(${this.layout.size()[0] / 2}, ${this.layout.size()[1] / 2})`)
        
        this.g.selectAll("text")
            .data(data)
          .enter().append("text")
            .style("font-size", d => `${d.size}px`)
            .style("font-family", "Impact")
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x}, ${d.y})rotate(${d.rotate})`)
            .text(d => d.text);
    }
}

export {WordCloud};