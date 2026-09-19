"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = walk;
exports.extractSingleOperation = extractSingleOperation;
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
function walk(current, parent, path, visitor) {
    for (const key of Object.keys(current)) {
        const value = current[key];
        if (typeof value === "object" && value !== null) {
            walk(value, current, [key, ...path], visitor);
        }
        else {
            visitor(parent, path, key, value);
        }
    }
}
function extractSingleOperation(method, path, oas) {
    const visited = new Set();
    crawl(oas, oas["paths"][path][method], visited);
    if (oas["paths"][path]["parameters"]) {
        crawl(oas, oas["paths"][path]["parameters"], visited);
    }
    const cloned = (0, preserving_json_yaml_parser_1.simpleClone)(oas);
    delete cloned["paths"];
    delete cloned["components"];
    delete cloned["definitions"];
    // copy single path and path parameters
    cloned["paths"] = { [path]: { [method]: oas["paths"][path][method] } };
    if (oas["paths"][path]["parameters"]) {
        cloned["paths"][path]["parameters"] = oas["paths"][path]["parameters"];
    }
    // copy security schemes
    if (oas?.["components"]?.["securitySchemes"]) {
        cloned["components"] = { securitySchemes: oas["components"]["securitySchemes"] };
    }
    copyByPointer(oas, cloned, Array.from(visited));
    return cloned;
}
function crawl(root, current, visited) {
    if (current === null || typeof current !== "object") {
        return;
    }
    for (const [key, value] of Object.entries(current)) {
        if (key === "$ref") {
            const path = value.substring(1, value.length);
            if (!visited.has(path)) {
                visited.add(path);
                const ref = resolveRef(root, path);
                crawl(root, ref, visited);
            }
        }
        else {
            crawl(root, value, visited);
        }
    }
}
function resolveRef(root, pointer) {
    const path = (0, preserving_json_yaml_parser_1.parseJsonPointer)(pointer);
    let current = root;
    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
    }
    return current;
}
function copyByPointer(src, dest, pointers) {
    const sortedPointers = [...pointers];
    sortedPointers.sort();
    for (const pointer of sortedPointers) {
        const path = (0, preserving_json_yaml_parser_1.parseJsonPointer)(pointer);
        copyByPath(src, dest, path);
    }
}
function copyByPath(src, dest, path) {
    let currentSrc = src;
    let currentDest = dest;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        currentSrc = currentSrc[key];
        if (currentDest[key] === undefined) {
            if (Array.isArray(currentSrc[key])) {
                currentDest[key] = [];
            }
            else {
                currentDest[key] = {};
            }
        }
        currentDest = currentDest[key];
    }
    const key = path[path.length - 1];
    // check if the last segment of the path that is being copied is already set
    // which might be the case if we've copied the parent of the path already
    if (currentDest[key] === undefined) {
        currentDest[key] = currentSrc[key];
    }
}
//# sourceMappingURL=extract.js.map