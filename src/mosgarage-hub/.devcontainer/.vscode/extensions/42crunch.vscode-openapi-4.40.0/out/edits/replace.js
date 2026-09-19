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
exports.replaceLiteral = replaceLiteral;
exports.replaceObject = replaceObject;
const vscode = __importStar(require("vscode"));
const indent_1 = require("./indent");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
function replaceLiteral(document, root, path, replacement) {
    const location = (0, preserving_json_yaml_parser_1.findLocationForPath)(root, path)?.value;
    if (location === undefined) {
        throw new Error(`Unable to perform replace, node at JSON Pointer ${path} is not found`);
    }
    const range = new vscode.Range(document.positionAt(location.start), document.positionAt(location.end));
    return vscode.TextEdit.replace(range, replacement);
}
function replaceObject(document, root, path, replacement) {
    const location = (0, preserving_json_yaml_parser_1.findLocationForPath)(root, path)?.value;
    if (location === undefined) {
        throw new Error(`Unable to replace, node at JSON Pointer ${path} is not found`);
    }
    const range = new vscode.Range(document.positionAt(location.start), document.positionAt(location.end));
    // reindent replacement to the target indentation level
    // remove spaces at the first line, as the insertion starts
    // at the start of the value, which is already properly indented
    const reindented = (0, indent_1.indent)(document, range.start, replacement).replace(/^\s+/g, "");
    return vscode.TextEdit.replace(range, reindented);
}
//# sourceMappingURL=replace.js.map