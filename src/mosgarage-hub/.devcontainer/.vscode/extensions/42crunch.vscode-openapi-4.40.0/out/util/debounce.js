"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
function debounce(fn, options) {
    let timer;
    return (...args) => {
        return new Promise((resolve) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                resolve(fn(...args));
            }, options.delay);
        });
    };
}
//# sourceMappingURL=debounce.js.map