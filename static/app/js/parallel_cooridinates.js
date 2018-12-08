import 'parcoord-es/dist/parcoords.css';
import ParCoords from 'parcoord-es';

class ParallelCoords {
    constructor(container, data, w, h) {
        this.container = container;
        this.data = data;
        this.w = w;
        this.h = h;

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
            .render()
            .shadows()
            .reorderable()
            .brushMode("1D-axes");
    }
}

export {ParallelCoords};