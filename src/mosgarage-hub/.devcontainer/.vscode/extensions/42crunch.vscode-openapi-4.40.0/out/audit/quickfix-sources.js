"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const path_1 = require("path");
const vscode = __importStar(require("vscode"));
const bundler_1 = require("../bundler");
const pointer_1 = require("../pointer");
const extract_1 = require("../util/extract");
const types_1 = require("../types");
function securitySchemes(issue, fix, parameter, version, bundle, document, formatMap) {
    if ("errors" in bundle) {
        return [];
    }
    if (version !== types_1.OpenApiVersion.Unknown && bundle.value) {
        if (version === types_1.OpenApiVersion.V2 && bundle.value?.securityDefinitions) {
            return Object.keys(bundle.value.securityDefinitions);
        }
        else if (version === types_1.OpenApiVersion.V3 && bundle.value?.components?.securitySchemes) {
            return Object.keys(bundle.value.components.securitySchemes);
        }
    }
    return [];
}
function mostUsedByName(issue, fix, parameter, version, bundle, document, formatMap) {
    const issuePointer = (0, pointer_1.parseJsonPointer)(issue.pointer);
    const parameterPointer = (0, pointer_1.parseJsonPointer)(parameter.path);
    const name = issuePointer[issuePointer.length - 1];
    const property = parameterPointer[parameterPointer.length - 1];
    if (usePropertyHints(issuePointer, property) || !formatMap || formatMap.size === 0) {
        return getPropertyHints(bundle, name, property);
    }
    let container = bundle.value;
    for (const segment of issuePointer) {
        if (container) {
            container = container[segment];
        }
    }
    const format = container?.format;
    if (!format || !formatMap.has(format)) {
        return getPropertyHints(bundle, name, property);
    }
    const { format: dataFormat } = formatMap.get(format);
    if (!dataFormat.hasOwnProperty(property)) {
        return getPropertyHints(bundle, name, property);
    }
    return [dataFormat[property]];
}
function usePropertyHints(path, property) {
    return (property === "example" ||
        property === "x-42c-sample" ||
        property === "format" ||
        path.includes("example") ||
        path.includes("examples") ||
        path.includes("x-42c-sample"));
}
function getPropertyHints(bundle, name, property) {
    const propertyHints = buildPropertyHints(bundle);
    if (propertyHints[name] && propertyHints[name][property] !== undefined) {
        return [propertyHints[name][property]];
    }
    return [];
}
function relativeReference(base, mapping) {
    const target = vscode.Uri.parse(mapping.uri);
    const hash = mapping.hash === "#" ? "" : mapping.hash;
    if (base.scheme !== target.scheme || base.authority !== target.authority) {
        return `${mapping.uri}${hash}`;
    }
    const relative = path_1.posix.relative(path_1.posix.dirname(base.path), target.path);
    return `${relative}${hash}`;
}
function schemaRefByResponseCode(issue, fix, parameter, version, bundle, document, formatMap) {
    const schemaRefs = buildSchemaRefByResponseCode(version, bundle);
    // FIXME maybe should account for fix.path?
    const path = [...(0, pointer_1.parseJsonPointer)(issue.pointer), ...(0, pointer_1.parseJsonPointer)(parameter.path)].reverse();
    const code = version === types_1.OpenApiVersion.V2 ? path[2] : path[4];
    if (code && schemaRefs[code]) {
        const mapping = schemaRefs[code];
        return [relativeReference(document.uri, mapping)];
    }
    return [];
}
function buildSchemaRefByResponseCode(version, bundled) {
    if ("errors" in bundled) {
        return [];
    }
    const hints = {};
    const paths = bundled.value["paths"] ?? {};
    for (const path of Object.keys(paths)) {
        for (const operation of Object.values(paths[path])) {
            const responses = operation["responses"] ?? {};
            for (const [code, response] of Object.entries(responses)) {
                const ref = version == types_1.OpenApiVersion.V2
                    ? response?.["schema"]?.["$ref"]
                    : response?.["content"]?.["application/json"]?.["schema"]?.["$ref"];
                if (ref) {
                    const mapping = (0, bundler_1.findMapping)(bundled.mapping, ref) || {
                        uri: bundled.mapping.value.uri,
                        hash: ref,
                    };
                    if (!hints[code]) {
                        hints[code] = [];
                    }
                    hints[code].push(mapping);
                }
            }
        }
    }
    for (const code of Object.keys(hints)) {
        hints[code] = mode(hints[code]);
    }
    return hints;
}
function buildPropertyHints(bundled) {
    const hints = {};
    // TODO: boost perfomance
    if (!("errors" in bundled)) {
        (0, extract_1.walk)(bundled, null, [], (parent, path, key, value) => {
            // TODO check items for arrays
            if (path.length > 3 && path[1] === "properties") {
                const property = path[0];
                if (!hints[property]) {
                    hints[property] = {};
                }
                if (!hints[property][key]) {
                    hints[property][key] = [];
                }
                hints[property][key].push(value);
            }
        });
        // update hints replacing arrays of occurences of values
        // with most frequent value in the array
        for (const property of Object.keys(hints)) {
            for (const key of Object.keys(hints[property])) {
                hints[property][key] = mode(hints[property][key]);
            }
        }
    }
    return hints;
}
function mode(arr) {
    return arr
        .sort((a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length)
        .pop();
}
const SOURCES = {
    securitySchemes,
    mostUsedByName,
    schemaRefByResponseCode,
};
exports.default = SOURCES;
//# sourceMappingURL=quickfix-sources.js.map