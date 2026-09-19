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
const vscode = __importStar(require("vscode"));
const yaml = __importStar(require("yaml"));
const configuration_1 = require("../../configuration");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const replace_1 = require("../../edits/replace");
const types_1 = require("../../types");
const parsers_1 = require("../../parsers");
const time_util_1 = require("../../time-util");
exports.default = (cache, platformContext, store, dataDictionaryView, dataDictionaryDiagnostics) => ({
    browseDataDictionaries: async () => {
        const formats = await store.getDataDictionaries();
        dataDictionaryView.sendShowDictionaries(formats);
    },
    dataDictionaryPreAuditBulkUpdateProperties: async (documentUri) => {
        const diagnostics = dataDictionaryDiagnostics.get(documentUri);
        if (diagnostics !== undefined && diagnostics.length > 0) {
            const fix = await shouldFixDataDictionaryErrros();
            if (fix === "cancel") {
                return false;
            }
            else if (fix === "skip") {
                return true;
            }
            for (const editor of vscode.window.visibleTextEditors) {
                if (editor.document.uri.toString() === documentUri.toString()) {
                    await documentBulkUpdate(store, cache, dataDictionaryDiagnostics, editor.document);
                    return true;
                }
            }
            // no document updated
            vscode.window.showInformationMessage(`Failed to update contents of the ${documentUri} with Data Dictionary properties`);
        }
        return true;
    },
    editorDataDictionaryUpdateAllProperties: async (editor, edit, format, node, nodePath) => {
        const document = editor.document;
        const parsed = cache.getParsedDocument(editor.document);
        const formats = await store.getDataDictionaryFormats();
        const found = formats.filter((f) => f.name === format).pop();
        if (parsed !== undefined && found !== undefined) {
            const version = (0, parsers_1.getOpenApiVersion)(parsed);
            const updated = { ...node };
            for (const name of schemaProps) {
                updatePropertyOfExistingObject(version, nodePath, updated, name, found.format);
            }
            updated["x-42c-format"] = found.id;
            let text = "";
            if (editor.document.languageId === "yaml") {
                text = yaml.stringify(updated, null, { indent: 2 }).trimEnd();
            }
            else {
                text = JSON.stringify(updated, null, 1);
            }
            const edit = (0, replace_1.replaceObject)(editor.document, parsed, nodePath, text);
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.set(document.uri, [edit]);
            await vscode.workspace.applyEdit(workspaceEdit);
        }
    },
    editorDataDictionaryUpdateProperty: async (editor, edit, format, node, property, nodePath) => {
        const document = editor.document;
        const parsed = cache.getParsedDocument(editor.document);
        const version = (0, parsers_1.getOpenApiVersion)(parsed);
        const formats = await store.getDataDictionaryFormats();
        const found = formats.filter((f) => f.name === format).pop();
        const updated = { ...node };
        if (parsed !== undefined && found !== undefined) {
            if (property === "x-42c-format") {
                updated["x-42c-format"] = found.id;
            }
            else {
                updatePropertyOfExistingObject(version, nodePath, updated, property, found.format);
            }
            let text = "";
            if (editor.document.languageId === "yaml") {
                text = yaml.stringify(updated, null, { indent: 2 }).trimEnd();
            }
            else {
                text = JSON.stringify(updated, null, 1);
            }
            const edit = (0, replace_1.replaceObject)(editor.document, parsed, nodePath, text);
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.set(document.uri, [edit]);
            await vscode.workspace.applyEdit(workspaceEdit);
        }
    },
    editorDataDictionaryBulkUpdateProperties: async (editor, edit) => documentBulkUpdate(store, cache, dataDictionaryDiagnostics, editor.document),
});
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
async function shouldFixDataDictionaryErrros() {
    const config = configuration_1.configuration.get("dataDictionaryPreAuditFix");
    await (0, time_util_1.delay)(100); // workaround for #133073
    if (config === "ask") {
        const choice = await vscode.window.showInformationMessage("Found Data Dictionary mismatch, update the document with Data Dictionary properties?", { modal: true }, { title: "Update", id: "fix" }, { title: "Don't update", id: "skip" });
        if (choice?.id === "fix") {
            vscode.window
                .showInformationMessage("Remember your choice and always update document with Data Dictionary properties?", { modal: false }, { title: "Always update", id: "always" }, { title: "Cancel", id: "cancel" })
                .then((choice) => {
                if (choice?.id === "always") {
                    configuration_1.configuration.update("dataDictionaryPreAuditFix", "always", vscode.ConfigurationTarget.Global);
                }
            });
        }
        else if (choice?.id === "skip") {
            vscode.window
                .showInformationMessage("Remember your choice and never update document with Data Dictionary properties?", { modal: false }, { title: "Never update", id: "never" }, { title: "Cancel", id: "cancel" })
                .then((choice) => {
                if (choice?.id === "never") {
                    configuration_1.configuration.update("dataDictionaryPreAuditFix", "never", vscode.ConfigurationTarget.Global);
                }
            });
        }
        if (choice === undefined) {
            return "cancel";
        }
        if (choice.id === "fix") {
            return "fix";
        }
        else {
            return "skip";
        }
    }
    return config === "always" ? "fix" : "skip";
}
async function documentBulkUpdate(store, cache, dataDictionaryDiagnostics, document) {
    const parsed = cache.getParsedDocument(document);
    if (parsed === undefined) {
        return;
    }
    const version = (0, parsers_1.getOpenApiVersion)(parsed);
    const formats = new Map();
    for (const format of await store.getDataDictionaryFormats()) {
        formats.set(format.name, format);
    }
    const addMissingProperties = new Map();
    const edits = [];
    const diagnostics = dataDictionaryDiagnostics.get(document.uri) || [];
    // find all nodes with missing properties
    for (const diagnostic of diagnostics) {
        if (diagnostic["id"] === "data-dictionary-format-property-mismatch" ||
            diagnostic["id"] === "data-dictionary-format-property-missing") {
            const format = formats.get(diagnostic.format);
            const pointer = (0, preserving_json_yaml_parser_1.joinJsonPointer)(diagnostic.path);
            if (format && !addMissingProperties.has(pointer)) {
                addMissingProperties.set(pointer, format);
            }
        }
    }
    // update every node with missing properties
    for (const [pointer, format] of addMissingProperties) {
        const node = (0, preserving_json_yaml_parser_1.find)(parsed, pointer);
        if (node) {
            const updated = { ...node };
            for (const name of schemaProps) {
                updatePropertyOfExistingObject(version, (0, preserving_json_yaml_parser_1.parseJsonPointer)(pointer), updated, name, format.format);
            }
            updated["x-42c-format"] = format.id;
            let text = "";
            if (document.languageId === "yaml") {
                text = yaml.stringify(updated, null, { indent: 2 }).trimEnd();
            }
            else {
                text = JSON.stringify(updated, null, 1);
            }
            const edit = (0, replace_1.replaceObject)(document, parsed, (0, preserving_json_yaml_parser_1.parseJsonPointer)(pointer), text);
            edits.push(edit);
        }
    }
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(document.uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);
}
function updatePropertyOfExistingObject(version, path, existing, name, format) {
    const value = format[name];
    // skip properties not defined in the format
    if (value === undefined) {
        return;
    }
    if (name !== "example") {
        existing[name] = value;
        return;
    }
    // property name is 'example'
    // dont update already existing examples
    if (existing.hasOwnProperty("example") || existing.hasOwnProperty("x-42c-sample")) {
        return;
    }
    // use 'x-42c-sample' for Swagger2.0 parameter objects
    if (version === types_1.OpenApiVersion.V2 &&
        !(path.includes("schema") || path.includes("definitions") || path.includes("x-42c-schemas"))) {
        existing["x-42c-sample"] = value;
        return;
    }
    existing["example"] = value;
}
//# sourceMappingURL=commands.js.map