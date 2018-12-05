import 'parcoord-es/dist/parcoords.css';
import ParCoords from 'parcoord-es';

function draw(data, container_id) {
    let parcoords = ParCoords()(container_id)
        .data(data)
        .render();
    
    return parcoords;
}

export {draw};