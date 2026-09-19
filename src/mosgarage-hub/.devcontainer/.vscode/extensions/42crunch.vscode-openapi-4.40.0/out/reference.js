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
exports.YamlSchemaDefinitionProvider = exports.JsonSchemaDefinitionProvider = void 0;
exports.refToLocation = refToLocation;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const json = __importStar(require("jsonc-parser"));
const external_refs_1 = require("./external-refs");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
function refToUri(ref, currentDocumentUri) {
    if (ref.startsWith("#")) {
        // local reference
        return currentDocumentUri;
    }
    try {
        // see if this is an extenral url by trying to parse it,
        // if no scheme: is present, exception is thrown
        return (0, external_refs_1.toInternalUri)(vscode.Uri.parse(ref, true));
    }
    catch {
        // assume a local file reference
        const baseDir = path.dirname(currentDocumentUri.fsPath);
        if (ref.includes("#")) {
            const [filename] = ref.split("#", 2);
            return currentDocumentUri.with({ path: path.join(baseDir, decodeURIComponent(filename)) });
        }
        else {
            return currentDocumentUri.with({ path: path.join(baseDir, decodeURIComponent(ref)) });
        }
    }
}
async function refToLocation(ref, currentDocumentUri, cache, externalRefProvider) {
    if (ref.includes("#")) {
        // reference to a file and an JSON pointer
        const [, pointer] = ref.split("#", 2);
        const refUri = refToUri(ref, currentDocumentUri);
        const refDocument = await vscode.workspace.openTextDocument(refUri);
        // in case of external http(s) urls set language id
        const languageId = externalRefProvider.getLanguageId(refUri);
        if (languageId) {
            await vscode.languages.setTextDocumentLanguage(refDocument, languageId);
        }
        const root = cache.getParsedDocument(refDocument);
        if (root) {
            const target = (0, preserving_json_yaml_parser_1.find)(root, pointer);
            if (target !== undefined) {
                const location = (0, preserving_json_yaml_parser_1.findLocationForJsonPointer)(root, pointer)?.value;
                if (location) {
                    return new vscode.Location(refDocument.uri, new vscode.Range(refDocument.positionAt(location.start), refDocument.positionAt(location.end)));
                }
            }
        }
    }
    else {
        // the entire file is referenced
        const refUri = refToUri(ref, currentDocumentUri);
        const refDocument = await vscode.workspace.openTextDocument(refUri);
        return new vscode.Location(refDocument.uri, new vscode.Range(0, 0, 0, 0));
    }
}
class JsonSchemaDefinitionProvider {
    constructor(cache, externalRefProvider) {
        this.cache = cache;
        this.externalRefProvider = externalRefProvider;
    }
    async provideDefinition(document, position, token) {
        const offset = document.offsetAt(position);
        const location = json.getLocation(document.getText(), offset);
        const last = location.path[location.path.length - 1];
        const pnode = location.previousNode;
        if (last === "$ref" && pnode && pnode.type === "string") {
            return refToLocation(pnode.value, document.uri, this.cache, this.externalRefProvider);
        }
        return undefined;
    }
}
exports.JsonSchemaDefinitionProvider = JsonSchemaDefinitionProvider;
function extractRef(parsed) {
    for (const [name, value] of Object.entries(parsed)) {
        if (name === "$ref") {
            return value;
        }
        else if (typeof value === "object" && value !== null) {
            const nested = extractRef(value);
            if (nested) {
                return nested;
            }
        }
    }
    return undefined;
}
const refRegex = new RegExp("\\$ref\\s*:\\s+([\\S]+)");
class YamlSchemaDefinitionProvider {
    constructor(cache, externalRefProvider, parserOptions) {
        this.cache = cache;
        this.externalRefProvider = externalRefProvider;
        this.parserOptions = parserOptions;
    }
    provideDefinition(document, position, token) {
        const line = document.lineAt(position.line);
        if (line.text.match(refRegex)) {
            const [node, errors] = (0, preserving_json_yaml_parser_1.parse)(line.text, "yaml", this.parserOptions);
            const ref = extractRef(node);
            return refToLocation(ref, document.uri, this.cache, this.externalRefProvider);
        }
        return Promise.resolve(undefined);
    }
}
exports.YamlSchemaDefinitionProvider = YamlSchemaDefinitionProvider;
//# sourceMappingURL=reference.js.map