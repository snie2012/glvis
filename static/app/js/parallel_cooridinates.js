// https://github.com/syntagmatic/parallel-coordinates

import 'parcoord-es/dist/parcoords.css';
import ParCoords from 'parcoord-es';

class ParallelCoords {
    constructor(container, data, w, h, wordcloud) {
        this.container = container;
        this.data = data;
        this.w = w;
        this.h = h;
        this.wordcloud = wordcloud;

        this.div = null;
    }

    draw(drawData) {
        if (this.div) this.div.remove();
        this.div = this.container.append("div")
            .attr('class', 'parcoords')
            .attr('id', 'pl')
            .style("width", this.w + 'px')
            .style("height", this.h + 'px');
        
        this.pl = ParCoords()('#pl');

        this.pl.data(drawData)
            .color("#d6616b")
            .alpha(0.5)
            .composite('darker')
            .hideAxis(['id', 'word'])
            // .dimensions({
            //     '0': {
            //         domain: [-10, 10]
            //     },
            //     '1': {
            //         domain: [-10, 10]
            //     }
            // })
            // .createAxes()
            // .reorderable()
            .color(function(d){
                // return d['word'].endsWith('ly') ? '#ef8a62' : '#999999';
            })
            .ticks(1)
            .render()
            .shadows()
            .reorderable()
            .brushMode("1D-axes")
            .on('brush', d => {
                const selectedIds = d.map((e) => e.id);
                // const wordSet = new Set(selected.map((id) => this.wordplot.words[id]));
                // this.wordplot.filter(wordSet);
                this.wordcloud.setData(selectedIds);
            });
    }
}

export {ParallelCoords};