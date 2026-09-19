"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ColourParser = require("color");
class Util {
    static println(message, source = 'DEBUG') {
        console.log(`[DASH ${source}] ${message}\n`);
        return;
    }
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    // FILTERS
    static filterArrayStrip(input, whatYouSeek) {
        return input.filter(function (val, key) {
            return val !== whatYouSeek;
        });
    }
    ;
    static filterArrayStripById(input, whatYouSeek) {
        return input.filter(function (val, key) {
            return ((typeof val.id !== 'undefined')
                && (val.id !== whatYouSeek));
        });
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    // SEEKERS
    static findInArrayById(input, whatYouSeek) {
        for (const item of input)
            if (typeof item.id !== 'undefined')
                if (item.id === whatYouSeek)
                    return item;
        return null;
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    // RANDERS
    static randomInt(cap) {
        return Math.round(Math.random() * cap);
    }
    ;
    static randomIntPN(cap) {
        return (Util.randomInt(cap) * Util.randomNegative());
    }
    ;
    static randomNegative() {
        return ((Util.randomInt(1) === 1) ? 1 : -1);
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    // COLOURS
    static arrayColoursFrom(input, num, severity = 4) {
        let output = new Array;
        for (num; num >= 0; --num) {
            output.push(ColourParser(input)
                .rotate(num * severity)
                .hex());
        }
        return output;
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    // SORTS
    static sortFuncByNameDesc(a, b) {
        return ((a.name ?? 0)
            .toString()
            .localeCompare((b.name ?? 0)
            .toString()));
    }
    ;
    static sortFuncByNameAsc(a, b) {
        return ((b.name ?? 0)
            .toString()
            .localeCompare((a.name ?? 0)
            .toString()));
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    // MATHS
    static clamp(input, min, max) {
        return Math.min(Math.max(input, min), max);
    }
    ;
    ////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    static fixDriveLetters(input) {
        let found;
        // handle fixing c:\whatever\whatever drive letter case.
        // this stuff is technically pointless but someone pointed it out
        // and it started to bother me too over time.
        if (found = input.match(/^([a-z]):\\/))
            if (found.length === 2) {
                input = input.replace(/^([a-z]):\\/, `${found[1].toUpperCase()}:\\`);
                return input;
            }
        // handle fixing file:///c:/whatever/whatever drive letter case.
        if (found = input.match(/^file:\/\/\/([a-z])%3A\//))
            if (found.length === 2) {
                input = input.replace(/^file:\/\/\/([a-z])%3A\//, `file:\/\/\/${found[1].toUpperCase()}%3A\/`);
                return input;
            }
        return input;
    }
}
;
exports.default = Util;
//# sourceMappingURL=util.js.map