"use strict";
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
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
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const object_1 = require("@xliic/preserving-json-yaml-parser/lib/visit/object");
const types_1 = require("../../types");
const parsers_1 = require("../../parsers");
const supportedVersions = [types_1.OpenApiVersion.V2, types_1.OpenApiVersion.V3, types_1.OpenApiVersion.V3_1];
function activate(cache, platformContext, store, collection) {
    let disposable = new vscode.Disposable(() => null);
    store.onConnectionDidChange(({ connected }) => {
        disposable?.dispose();
        if (connected) {
            disposable = cache.onDidActiveDocumentChange(async (document) => lintDocument(document, cache, store, collection));
            if (vscode.window.activeTextEditor) {
                lintDocument(vscode.window.activeTextEditor.document, cache, store, collection);
            }
        }
        else {
            disposable = undefined;
        }
    });
    return new vscode.Disposable(() => disposable?.dispose());
}
async function lintDocument(document, cache, store, collection) {
    if (document === undefined) {
        return;
    }
    const formats = await store.getDataDictionaryFormats();
    const formatMap = new Map();
    for (const format of formats) {
        formatMap.set(format.name, format);
    }
    const parsed = cache.getParsedDocument(document);
    if (parsed && supportedVersions.includes((0, parsers_1.getOpenApiVersion)(parsed))) {
        lint(collection, formatMap, document, parsed);
    }
}
function lint(collection, formats, document, parsed) {
    const diagnostics = [];
    const path = [];
    (0, object_1.visitObject)(undefined, "fakeroot", parsed, {
        onObjectStart: function (parent, key, value, location) {
            path.push(key);
        },
        onObjectEnd: function () {
            path.pop();
        },
        onArrayStart: function (parent, key, value, location) {
            path.push(key);
        },
        onArrayEnd: function () {
            path.pop();
        },
        onValue: function (parent, key, value, text, location) {
            if (key === "format" &&
                typeof value === "string" &&
                !path.includes("example") &&
                !path.includes("examples") &&
                !path.includes("x-42c-sample")) {
                diagnostics.push(...checkFormat(document, parsed, formats, value, parent, path.slice(1) // remove fakeroot
                ));
            }
        },
    });
    collection.set(document.uri, diagnostics);
}
const schemaProps = [
    "type",
    "example",
    "pattern",
    "minLength",
    "maxLength",
    "enum",
    "default",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "minimum",
    "maximum",
    "multipleOf",
];
function checkFormat(document, root, formats, format, container, path) {
    const diagnostics = [];
    if (!formats.has(format)) {
        // FIXME in the current version of Data Dictionary we don't error on missng
        // Data Dictionary entries, to reduce number of error messages reported
        // for the standard formats, as on the backend we don't yet add 'standard'
        // dictionary to everyone
        return diagnostics;
        // const range = getValueRange(document, container, "format");
        // if (range !== undefined) {
        //   diagnostics.push({
        //     message: `Data Dictionary format '${format}' is not defined`,
        //     range,
        //     severity: vscode.DiagnosticSeverity.Error,
        //     source: "vscode-openapi",
        //   });
        //   return diagnostics;
        // }
    }
    const { format: dataFormat, id: formatId } = formats.get(format);
    // check x-42c-format
    if (container.hasOwnProperty("x-42c-format")) {
        if (container["x-42c-format"] !== formatId) {
            const range = getValueRange(document, container, "x-42c-format");
            if (range !== undefined) {
                // check if its the same as format it
                const diagnostic = {
                    id: "data-dictionary-format-property-mismatch",
                    message: `Data Dictionary requires value of '${formatId}'`,
                    range,
                    severity: vscode.DiagnosticSeverity.Warning,
                    source: "vscode-openapi",
                    path,
                    node: container,
                    property: "x-42c-format",
                    format,
                };
                diagnostics.push(diagnostic);
            }
        }
    }
    else {
        // no x42c-format
        const range = getParentKeyRange(document, root, path);
        if (range) {
            const diagnostic = {
                id: "data-dictionary-format-property-missing",
                message: `Missing "x-42c-format" property required for data dictionary`,
                range,
                severity: vscode.DiagnosticSeverity.Information,
                source: "vscode-openapi",
                path,
                node: container,
                property: "x-42c-format",
                format,
            };
            diagnostics.push(diagnostic);
        }
    }
    for (const prop of schemaProps) {
        // regardless of the format, if object already has 'example' or 'x-42c-sample'
        // dont report missing property or a mismatch
        if (prop === "example") {
            if (container.hasOwnProperty("example") || container.hasOwnProperty("x-42c-sample")) {
                continue;
            }
        }
        if (dataFormat.hasOwnProperty(prop)) {
            if (container.hasOwnProperty(prop)) {
                // properties differ
                if (isPropertyMismatch(prop, container[prop], dataFormat[prop])) {
                    const range = getValueRange(document, container, prop);
                    if (range !== undefined) {
                        const diagnostic = {
                            id: "data-dictionary-format-property-mismatch",
                            message: `Data Dictionary requires value of '${dataFormat[prop]}'`,
                            range,
                            severity: vscode.DiagnosticSeverity.Warning,
                            source: "vscode-openapi",
                            path,
                            node: container,
                            property: prop,
                            format,
                        };
                        diagnostics.push(diagnostic);
                    }
                }
            }
            else {
                // property is missing
                const range = getParentKeyRange(document, root, path);
                if (range !== undefined) {
                    const diagnostic = {
                        id: "data-dictionary-format-property-missing",
                        message: `Missing "${prop}" property defined in Data Dictionary`,
                        range,
                        severity: vscode.DiagnosticSeverity.Information,
                        source: "vscode-openapi",
                        path,
                        node: container,
                        property: prop,
                        format,
                    };
                    diagnostics.push(diagnostic);
                }
            }
        }
    }
    return diagnostics;
}
function isPropertyMismatch(name, formatValue, currentValue) {
    if (name === "enum" && Array.isArray(currentValue)) {
        if (currentValue.length !== formatValue.length) {
            return true;
        }
        for (const element of currentValue) {
            if (!formatValue.includes(element)) {
                return true;
            }
        }
        return false;
    }
    return currentValue !== formatValue;
}
function getValueRange(document, container, key) {
    const location = (0, preserving_json_yaml_parser_1.getLocation)(container, key);
    if (location !== undefined) {
        return new vscode.Range(document.positionAt(location.value.start), document.positionAt(location.value.end));
    }
}
function getParentKeyRange(document, root, path) {
    const location = (0, preserving_json_yaml_parser_1.findLocationForPath)(root, path);
    if (location !== undefined) {
        if (location.key !== undefined) {
            return new vscode.Range(document.positionAt(location.key.start), document.positionAt(location.key.end));
        }
        else {
            // if no key range is available, lets take the first line of the value
            const line = document.lineAt(document.positionAt(location.value.start));
            return new vscode.Range(new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex), line.range.end);
        }
    }
}
//# sourceMappingURL=linter.js.map