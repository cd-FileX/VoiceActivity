const fs = require('fs');

// json array append function (id: .., time: ..)__TODO
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
        d = JSON.parse(fs.readFileSync(f, 'utf8'))
        for (x = 0; x < k.length; x++) { d = d[k[x]]; }
        return d;
    } catch (e) { return null; }
}
module.exports.read = read;


function write(f, k, v) {
    var data_prvs = read(f, '');
    var data = data_prvs;
    for(var i = 0; i < k.length-1; i++) {
        var elem = k[i];
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
    write(f, k, read(f, k).push(v))
}
module.exports.append = append;


function remove(f, k, i) {
    write(f, k, read(f, k).splice(i, 1));
}
