import * as d3 from "d3";

function postJson(url, data) {
    return d3.json(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-type": "application/json"
        },
        mode: "cors"
    })
}

export {postJson};