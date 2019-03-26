import * as cloud from "d3-cloud";
import * as _ from "lodash";

class SentenceCloud {
    constructor(words_matrix, svg, width, height, padding) {
        this.svg = svg;
        this.padding = padding;
        this.words_matrix = words_matrix;

        this.layout = cloud()
            .size([width, height])
            .padding(3)
            .font("Impact")
            .fontSize(function(d) { return d.size; })
            .on("end", this.draw.bind(this));
    }

    // Calculate the size of each word based on their frequency
    prepareData(words_matrix) {
        const flattend = _.flatten(words_matrix);
        const counter = _.countBy(flattend);
        const size_data = Object.entries(counter).map(([k, v]) => {
            return {'text': k, 'size': v};
        });
        const min = _.minBy(size_data, 'size')['size'];
        const max = _.maxBy(size_data, 'size')['size'];
        const scale = max - min;
        return size_data.map((elm) => {
            return {'text': elm['text'], 'size': 10 + 60 * (elm['size'] - min) / scale};
        });
    }

    // Reset the data to be drawn
    setData(selectedIds) {
        if (selectedIds.length == 0) return;
        const selectedData = selectedIds.map(id => this.words_matrix[id]);
        this.drawData = this.prepareData(selectedData);
        this.layout
            .words(this.drawData)
            .rotate(function() { return (~~(Math.random() * 6) - 3) * 30; });
        this.layout.start();
    }

    draw(data) {
        if (this.g) this.g.remove();

        this.g = this.svg
            .attr("width", this.layout.size()[0])
            .attr("height", this.layout.size()[1])
          .append("g")
            .attr("transform", "translate(" + this.layout.size()[0] / 2 + "," + this.layout.size()[1] / 2 + ")")
        
        this.g.selectAll("text")
            .data(data)
          .enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });
    }
}

export {SentenceCloud};