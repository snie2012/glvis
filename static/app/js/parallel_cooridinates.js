import 'parcoord-es/dist/parcoords.css';
import ParCoords from 'parcoord-es';

function draw(data, container) {
    let pl = ParCoords()(container);

    pl.data(data)
        .color("#d6616b")
        .alpha(0.5)
        .composite('darker')
        // .createAxes()
        // .reorderable()
        .render()
        .shadows()
        .reorderable()
        .brushMode("1D-axes");
    
    return pl;
}

export {draw};