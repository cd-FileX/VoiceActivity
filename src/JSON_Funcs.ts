const fs = require('fs');

var d, x, i, elem, data_prvs, arr;


class Files {
    constructor() {
        this.CONFIG = "./config.json";
        this.ACTIVITY = "./last_active.json";
        this.BOARD = "./leaderboards.json";
    }
}
module.exports.Files = Files;


function read(f, k) {
    try {
        d = JSON.parse(fs.readFileSync(f, 'utf8'));
        for (x = 0; x < k.length; x++) { d = d[k[x]]; }
        return d;
    } catch (e) { return null; }
}
module.exports.read = read;


function write(f, k, v) {
    if (!(data_prvs = read(f, ''))) return null;
    var data = data_prvs;

    for(i = 0; i < k.length-1; i++) {
        elem = k[i];
        if(!data[elem]) data[elem] = {};
        data = data[elem];
    }
    
    data[k[k.length-1]] = v;
    
    fs.writeFile(f, JSON.stringify(data_prvs), (e) => {
        if (e) return null;
    });
    return 1;
}
module.exports.write = write;


function append(f, k, v) {
    (arr = read(f, k)).push(v);  // ! Push gibt die Length zurück und verändert den Array
    write(f, k, arr)
}
module.exports.append = append;


function remove(f, k, i) {
    (arr = read(f, k)).splice(i, 1);  // Gleiches mit Splice; gibt Array von entfernten zurück
    write(f, k, arr);
}
module.exports.remove = remove;
