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
exports.insert = insert;
const vscode = __importStar(require("vscode"));
const indent_1 = require("./indent");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
function insert(document, root, path, insertion, emptyParentNode) {
    const location = (0, preserving_json_yaml_parser_1.findLocationForPath)(root, path);
    if (location === undefined) {
        throw new Error(`Unable to replace, node at JSON Pointer ${path} is not found`);
    }
    const insertionPosition = findInsertionPosition(document, location);
    const indentPosition = findIndentPosition(document, location);
    const reindented = (0, indent_1.indent)(document, indentPosition, insertion);
    return vscode.TextEdit.insert(insertionPosition, formatInsertion(document, reindented, emptyParentNode));
}
function formatInsertion(document, insertion, emptyParentNode) {
    if (document.languageId === "yaml") {
        return `\n${insertion}`;
    }
    if (emptyParentNode) {
        return `\n${insertion}`;
    }
    return `,\n${insertion}`;
}
function findInsertionPosition(document, location) {
    const position = document.positionAt(location.value.end);
    if (document.languageId === "yaml") {
        return position;
    }
    const line = document.lineAt(position.line - 1);
    return line.range.end;
}
function findIndentPosition(document, location) {
    if (document.languageId === "yaml") {
        return document.positionAt(location.value.start);
    }
    const position = document.positionAt(location.value.end - 1);
    return new vscode.Position(position.line - 1, position.character);
}
//# sourceMappingURL=insert.js.map