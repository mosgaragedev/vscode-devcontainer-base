"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryReadFileSync = exports.childGenerator = exports.filterChildren = exports.firstChild = exports.traceChildren = void 0;
const fs_1 = require("fs");
const util_1 = require("util");
function traceChildren(testItem) {
    return Array.from(childGenerator(testItem));
}
exports.traceChildren = traceChildren;
function firstChild(collection, predicate) {
    for (const [, item] of collection) {
        if (predicate(item)) {
            return item;
        }
        for (const x of childGenerator(item)) {
            if (predicate(x)) {
                return x;
            }
        }
    }
}
exports.firstChild = firstChild;
function filterChildren(collection, predicate) {
    const result = [];
    for (const [, item] of collection) {
        if (predicate(item)) {
            result.push(item);
        }
        for (const x of childGenerator(item)) {
            if (predicate(x)) {
                result.push(x);
            }
        }
    }
    return result;
}
exports.filterChildren = filterChildren;
function* childGenerator(testItem) {
    const stack = [testItem];
    const result = [];
    while (true) {
        const item = stack.pop();
        if (!item) {
            break;
        }
        if (item !== testItem) {
            yield item;
        }
        item.children.forEach(x => stack.push(x));
    }
}
exports.childGenerator = childGenerator;
function tryReadFileSync(path) {
    try {
        return new util_1.TextDecoder().decode((0, fs_1.readFileSync)(path));
    }
    catch {
        return;
    }
}
exports.tryReadFileSync = tryReadFileSync;
//# sourceMappingURL=util.js.map