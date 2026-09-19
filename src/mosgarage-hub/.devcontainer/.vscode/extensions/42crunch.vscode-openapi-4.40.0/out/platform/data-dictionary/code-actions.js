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
exports.DataDictionaryCodeActions = void 0;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
class DataDictionaryCodeActions {
    constructor(cache, store, collection) {
        this.cache = cache;
        this.store = store;
        this.collection = collection;
    }
    provideCodeActions(document, range, context, token) {
        const diagnostics = this.collection.get(document.uri) || [];
        const actions = [];
        const addMissingPropertiesSet = new Set();
        for (const diagnostic of diagnostics) {
            if (diagnostic.range.contains(range) &&
                diagnostic["id"] === "data-dictionary-format-property-mismatch") {
                const action = new vscode.CodeAction(`Update "${diagnostic.property}" with a Data Dictionary value`, vscode.CodeActionKind.QuickFix);
                action.command = {
                    command: "openapi.platform.editorDataDictionaryUpdateProperty",
                    title: `Update "${diagnostic.property}" with a Data Dictionary value`,
                    arguments: [diagnostic.format, diagnostic.node, diagnostic.property, diagnostic.path],
                };
                action.isPreferred = true;
                actions.push(action);
                const containerName = diagnostic.path.slice(-2).join("/");
                const action2 = new vscode.CodeAction(`Update "${containerName}" with all Data Dictionary properties`, vscode.CodeActionKind.QuickFix);
                action2.command = {
                    command: "openapi.platform.editorDataDictionaryUpdateAllProperties",
                    title: `Update "${containerName}" with all Data Dictionary properties`,
                    arguments: [diagnostic.format, diagnostic.node, diagnostic.path],
                };
                actions.push(action2);
            }
            if (diagnostic.range.contains(range) &&
                diagnostic["id"] === "data-dictionary-format-property-missing") {
                const action = new vscode.CodeAction(`Add missing "${diagnostic.property}" Data Dictionary property`, vscode.CodeActionKind.QuickFix);
                action.command = {
                    command: "openapi.platform.editorDataDictionaryUpdateProperty",
                    title: `Add missing "${diagnostic.property}" Data Dictionary property`,
                    arguments: [diagnostic.format, diagnostic.node, diagnostic.property, diagnostic.path],
                };
                actions.push(action);
                const pointer = (0, preserving_json_yaml_parser_1.joinJsonPointer)(diagnostic.path);
                if (!addMissingPropertiesSet.has(pointer)) {
                    addMissingPropertiesSet.add(pointer);
                    const containerName = diagnostic.path.slice(-2).join("/");
                    const action2 = new vscode.CodeAction(`Update "${containerName}" with all Data Dictionary properties`, vscode.CodeActionKind.QuickFix);
                    action2.command = {
                        command: "openapi.platform.editorDataDictionaryUpdateAllProperties",
                        title: `Update "${containerName}" with all Data Dictionary properties`,
                        arguments: [diagnostic.format, diagnostic.node, diagnostic.path],
                    };
                    action2.isPreferred = true;
                    actions.push(action2);
                }
            }
        }
        return actions;
    }
}
exports.DataDictionaryCodeActions = DataDictionaryCodeActions;
DataDictionaryCodeActions.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
//# sourceMappingURL=code-actions.js.map