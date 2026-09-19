"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonNodeValue = void 0;
exports.getRootAsJsonNodeValue = getRootAsJsonNodeValue;
exports.findJsonNodeValue = findJsonNodeValue;
exports.replace = replace;
const schema_1 = require("./audit/schema");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const preserving_json_yaml_parser_2 = require("@xliic/preserving-json-yaml-parser");
const pointer_1 = require("./pointer");
const parser_options_1 = require("./parser-options");
const preserve_1 = require("@xliic/preserving-json-yaml-parser/lib/preserve");
class JsonNodeValue {
    constructor(value, pointer) {
        this.value = value;
        this.pointer = pointer;
    }
    getDepth() {
        return this.pointer === "" ? 0 : this.pointer.split("/").length - 1;
    }
    getKey() {
        return (0, pointer_1.getPointerLastSegment)(this.pointer);
    }
    getValue() {
        return this.value;
    }
    getRawValue() {
        return this.getValue();
    }
    getChildren(keepOrder) {
        const children = [];
        for (const key of getKeys(this.value, keepOrder)) {
            children.push(new JsonNodeValue(this.value[key], (0, pointer_1.getPointerChild)(this.pointer, key)));
        }
        return children;
    }
    getFirstChild() {
        const children = this.getChildren(true);
        if (children.length === 0) {
            return undefined;
        }
        return children[0];
    }
    getLastChild() {
        const children = this.getChildren(true);
        if (children.length === 0) {
            return undefined;
        }
        return children[children.length - 1];
    }
    isObject() {
        return (0, schema_1.getType)(this.value) === "object";
    }
    isArray() {
        return (0, schema_1.getType)(this.value) === "array";
    }
    isScalar() {
        return !this.isObject() && !this.isArray();
    }
    getParent(root) {
        if (this.pointer !== "") {
            const parentPointer = (0, pointer_1.getPointerParent)(this.pointer);
            return new JsonNodeValue((0, preserving_json_yaml_parser_2.find)(root, parentPointer), parentPointer);
        }
        return undefined;
    }
    getRange(root) {
        const myKey = this.getKey();
        const parent = this.getParent(root);
        if (parent) {
            for (const key of Object.keys(parent.value)) {
                if (key === myKey && this.value === parent.value[key]) {
                    const container = parent.value;
                    const loc = (0, preserving_json_yaml_parser_1.getLocation)(container, key);
                    if (loc) {
                        return [loc.key ? loc.key.start : loc.value.start, loc.value.end];
                    }
                    else {
                        return undefined;
                    }
                }
            }
        }
        else if (this.pointer === "") {
            const range = (0, preserve_1.getPreservedRootRange)(root);
            return [range.start, range.end];
        }
        return undefined;
    }
    getKeyRange(root) {
        const myKey = this.getKey();
        const parent = this.getParent(root);
        if (parent) {
            for (const key of Object.keys(parent.value)) {
                if (key === myKey && this.value === parent.value[key]) {
                    const container = parent.value;
                    const loc = (0, preserving_json_yaml_parser_1.getLocation)(container, key);
                    if (loc) {
                        return loc.key ? [loc.key.start, loc.key.end] : undefined;
                    }
                    else {
                        return undefined;
                    }
                }
            }
        }
        return undefined;
    }
    getValueRange(root) {
        const myKey = this.getKey();
        const parent = this.getParent(root);
        if (parent) {
            for (const key of Object.keys(parent.value)) {
                if (key === myKey && this.value === parent.value[key]) {
                    const container = parent.value;
                    const loc = (0, preserving_json_yaml_parser_1.getLocation)(container, key);
                    if (loc) {
                        return [loc.value.start, loc.value.end];
                    }
                    else {
                        return undefined;
                    }
                }
            }
        }
        return undefined;
    }
    next(root) {
        const myKey = this.getKey();
        const parent = this.getParent(root);
        if (parent) {
            const keys = getKeys(parent.value, true);
            for (let i = 0; i < keys.length - 1; i++) {
                if (myKey === keys[i] && this.value === parent.value[keys[i]]) {
                    return new JsonNodeValue(parent.value[keys[i + 1]], (0, pointer_1.getPointerChild)(parent.pointer, keys[i + 1]));
                }
            }
        }
        return undefined;
    }
    prev(root) {
        const myKey = this.getKey();
        const parent = this.getParent(root);
        if (parent) {
            const keys = getKeys(parent.value, true);
            for (let i = 1; i < keys.length; i++) {
                if (myKey === keys[i] && this.value === parent.value[keys[i]]) {
                    return new JsonNodeValue(parent.value[keys[i - 1]], (0, pointer_1.getPointerChild)(parent.pointer, keys[i - 1]));
                }
            }
        }
        return undefined;
    }
}
exports.JsonNodeValue = JsonNodeValue;
function getRootAsJsonNodeValue(root) {
    return root ? new JsonNodeValue(root, "") : undefined;
}
function findJsonNodeValue(root, pointer) {
    const value = (0, preserving_json_yaml_parser_2.find)(root, pointer);
    return value === undefined ? undefined : new JsonNodeValue(value, pointer);
}
function getKeys(value, keepOrder) {
    const keys = Object.keys(value);
    if (keepOrder && keys.length > 1) {
        keys.sort(comparator(value));
    }
    return keys;
}
function comparator(container) {
    return function (key1, key2) {
        return getOffset((0, preserving_json_yaml_parser_1.getLocation)(container, key1)) - getOffset((0, preserving_json_yaml_parser_1.getLocation)(container, key2));
    };
}
function getOffset(location) {
    return location.key ? location.key.start : location.value.start;
}
function substrings(string, ranges) {
    const result = [];
    let position = 0;
    for (const [start, end] of ranges) {
        const before = string.substring(position, start);
        const inside = string.substring(start, end);
        position = end;
        result.push(before);
        result.push(inside);
    }
    result.push(string.substring(position));
    return result;
}
function replaceTextRanges(text, replacements) {
    const sorted = replacements.sort((a, b) => a.range[0] - b.range[0]);
    const ranges = sorted.map((replacement) => replacement.range);
    const chunks = substrings(text, ranges);
    for (let i = 0; i < sorted.length; i++) {
        let replacement = sorted[i].value;
        const target = i * 2 + 1;
        const original = chunks[target];
        let quote = "";
        if (original.startsWith(`"`) && original.endsWith(`"`)) {
            quote = `"`;
        }
        else if (original.startsWith(`'`) && original.endsWith(`'`)) {
            quote = `'`;
        }
        chunks[target] = `${quote}${replacement}${quote}`;
    }
    return chunks.join("");
}
function replace(text, languageId, replacements) {
    const [root, errors] = (0, preserving_json_yaml_parser_2.parse)(text, languageId, parser_options_1.parserOptions);
    if (errors.length || root === undefined) {
        throw new Error(`Unable to parse text to perform replacement in JSON/YAML in: ${text}`);
    }
    const textReplacements = replacements.map((replacement) => {
        const target = findJsonNodeValue(root, replacement.pointer);
        const range = replacement.replaceKey ? target.getKeyRange(root) : target.getValueRange(root);
        return { range: range, value: replacement.value };
    });
    return replaceTextRanges(text, textReplacements);
}
//# sourceMappingURL=json-utils.js.map