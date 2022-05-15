const json = require('./JSON_Funcs.ts');


var log_msg;


class Logging {
    static debug(message) {
        if (this.get_log_level() >= 5) {
            log_msg = `[${new Date().toLocaleString()}] {type} {m} ${message}`;

            var m = "-";
            log_msg = log_msg.formatUnicorn({type: '[DEBUG]'});

            for (var i = 0; i < 33 - (log_msg.split('{m}')[0]).length; i++) m += "-";
            log_msg = log_msg.formatUnicorn({m: m});

            console.debug(log_msg);
        }
    }
    static log(message) {
        if (this.get_log_level() >= 4) {
            log_msg = `[${new Date().toLocaleString()}] {type} {m} ${message}`;
        
            var m = "-";
            log_msg = log_msg.formatUnicorn({type: '[INFO]'});

            
            for (var i = 0; i < 33 - (log_msg.split('{m}')[0]).length; i++) m += "-";
            log_msg = log_msg.formatUnicorn({m: m});

            console.log(log_msg);
        }
    }

    static warn(message) {
        if (this.get_log_level() >= 3) {
            log_msg = `[${new Date().toLocaleString()}] {type} {m} ${message}`;

            var m = "-";
            log_msg = log_msg.formatUnicorn({type: '[WARN]'});
            
            for (var i = 0; i < 33 - (log_msg.split('{m}')[0]).length; i++) m += "-";
            log_msg = log_msg.formatUnicorn({m: m});

            console.warn(log_msg);
        }
    }
    static warning = this.warn;

    static error(message) {
        if (this.get_log_level() >= 2) {
            log_msg = `[${new Date().toLocaleString()}] {type} {m} ${message}`;

            var m = "-";
            log_msg = log_msg.formatUnicorn({type: '[ERROR]'});

            for (var i = 0; i < 33 - (log_msg.split('{m}')[0]).length; i++) m += "-";
            log_msg = log_msg.formatUnicorn({m: m});

            console.error(log_msg);
        }
    }
    static critical(message) {
        log_msg = `[${new Date().toLocaleString()}] {type} {m} ${message}`;

        var m = "-";
        log_msg = log_msg.formatUnicorn({type: '[CRITICAL]'});
        
        for (var i = 0; i < 33 - (log_msg.split('{m}')[0]).length; i++) m += "-";
        log_msg = log_msg.formatUnicorn({m: m});

        console.error(log_msg);
    }

    static get_log_level() {
        return json.read(new json.Files().CONFIG, ['logging_level']);  // 5 = Alle, 4 = Ohne Debug, 3 += ohne Info, 2 += ohne Warnings, 1 = nur Critical
    }
}
module.exports.Logging = Logging;


String.prototype.formatUnicorn = String.prototype.formatUnicorn ||  // https://stackoverflow.com/a/18234317/14720490
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};