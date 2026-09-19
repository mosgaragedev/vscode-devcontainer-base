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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionItemProvider = void 0;
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const types_1 = require("./types");
const path_1 = __importDefault(require("path"));
const targetMapping = {
    [types_1.OpenApiVersion.Unknown]: undefined,
    [types_1.OpenApiVersion.V2]: {
        schema: "/definitions",
        items: "/definitions",
        parameters: "/parameters",
        responses: "/responses",
        properties: "/definitions",
    },
    [types_1.OpenApiVersion.V3]: {
        schema: "/components/schemas",
        responses: "/components/responses",
        parameters: "/components/parameters",
        examples: "/components/examples",
        requestBody: "/components/requestBodies",
        callbacks: "/components/callbacks",
        headers: "/components/headers",
        links: "/components/links",
        items: "/components/schemas", // for completion inside JSON Schema objects
        properties: "/components/schemas",
    },
    [types_1.OpenApiVersion.V3_1]: {
        schema: "/components/schemas",
        responses: "/components/responses",
        parameters: "/components/parameters",
        examples: "/components/examples",
        requestBody: "/components/requestBodies",
        callbacks: "/components/callbacks",
        headers: "/components/headers",
        links: "/components/links",
        items: "/components/schemas", // for completion inside JSON Schema objects
        properties: "/components/schemas",
    },
};
class CompletionItemProvider {
    constructor(context, cache) {
        this.context = context;
        this.cache = cache;
        this.version = types_1.OpenApiVersion.Unknown;
        cache.onDidActiveDocumentChange(async (document) => {
            if (document && cache.getDocumentVersion(document) !== types_1.OpenApiVersion.Unknown) {
                this.parsed = cache.getLastGoodParsedDocument(document);
                this.version = cache.getDocumentVersion(document);
            }
        });
    }
    async provideCompletionItems(document, position, token, context) {
        const line = document.lineAt(position).text;
        if (!this.parsed || !line.includes("$ref")) {
            return undefined;
        }
        const nodePath = findPathAtOffset(this.parsed, document.offsetAt(position), document.languageId);
        const targetPointer = findTargetPointer(this.version, nodePath);
        const refRe = /^(\s*)(['"]?\$ref['"\s]*:(.*))$/;
        const match = line.match(refRe);
        if (match && targetPointer) {
            // don't replace trailing comma if there is one
            const refLen = match[2].endsWith(",") ? match[2].length - 1 : match[2].length;
            const replacing = new vscode.Range(new vscode.Position(position.line, match[1].length), new vscode.Position(position.line, match[1].length + refLen));
            const inserting = new vscode.Range(new vscode.Position(position.line, match[1].length), position);
            const rc = await getRefContext(this.parsed, match[3], document.uri, this.cache);
            const targetNode = (0, preserving_json_yaml_parser_1.find)(rc.parsed, targetPointer);
            if (targetNode) {
                return Object.keys(targetNode).map((key) => {
                    const item = new vscode.CompletionItem(`${rc.filename}#${targetPointer}/${key}`, vscode.CompletionItemKind.Reference);
                    item.range = { replacing, inserting };
                    if (document.languageId === "yaml") {
                        const oq = rc.openingQuote === "" ? '"' : rc.openingQuote;
                        const cq = rc.closingQuote === "" ? '"' : "";
                        item.insertText = `$ref: ${oq}${rc.filename}#${targetPointer}/${key}${cq}`;
                        item.filterText = `$ref: ${rc.openingQuote}${rc.filename}#${targetPointer}/${key}${rc.closingQuote}`;
                    }
                    else {
                        item.insertText = `"$ref": "${rc.filename}#${targetPointer}/${key}"`;
                        item.filterText = `"$ref": "${rc.filename}#${targetPointer}/${key}"`;
                    }
                    return item;
                });
            }
        }
    }
}
exports.CompletionItemProvider = CompletionItemProvider;
async function getRefContext(parsed, content, baseUri, cache) {
    const trimmed = content.trim();
    const openingQuote = trimmed.startsWith('"') ? '"' : trimmed.startsWith("'") ? "'" : "";
    const closingQuote = trimmed.endsWith('"') ? '"' : trimmed.endsWith("'") ? "'" : "";
    const match = trimmed.match(/(['"])?([^"']*)(\1)?(?:,|$)/);
    if (match !== null && match[2].trim() !== "") {
        if (match[2].startsWith("#")) {
            // local reference
            return { parsed, filename: "", pointer: match[2], openingQuote, closingQuote };
        }
        else if (match[2].includes("#")) {
            // external reference
            const filename = match[2].substring(0, match[2].indexOf("#"));
            const pointer = match[2].substring(match[2].indexOf("#"), match[2].length);
            const normalized = path_1.default.normalize(path_1.default.join(path_1.default.dirname(baseUri.fsPath), filename));
            const uri = baseUri.with({ path: normalized });
            try {
                // stat uri, if it does not exists an exception is thrown
                await vscode.workspace.fs.stat(uri);
                const document = await vscode.workspace.openTextDocument(uri);
                const parsed = cache.getLastGoodParsedDocument(document);
                if (parsed) {
                    return { parsed, filename, pointer, openingQuote, closingQuote };
                }
            }
            catch (ex) { }
        }
    }
    return { parsed, filename: "", pointer: "", openingQuote, closingQuote };
}
function findPathAtOffset(parsed, offset, languageId) {
    const { end } = (0, preserving_json_yaml_parser_1.getRootRange)(parsed);
    // if offset is beyond the range of the root node
    // which could happen in case of incomplete yaml node with
    // bunch of spaces at the end;
    // look for the node at the end of the root node range
    let [node, nodePath] = (0, preserving_json_yaml_parser_1.findNodeAtOffset)(parsed, offset > end ? end : offset);
    if (languageId === "yaml") {
        // workaround implicit null issue for the YAML like this ```$ref:```
        const [betterNode, betterNodePath] = (0, preserving_json_yaml_parser_1.findNodeAtOffset)(parsed, offset > end ? end - 1 : offset - 1);
        if (betterNode && betterNode.hasOwnProperty("$ref") && betterNode["$ref"] === null) {
            return betterNodePath;
        }
    }
    return nodePath;
}
function findTargetPointer(version, nodePath) {
    const mapping = targetMapping[version];
    if (mapping) {
        return (mapping[nodePath[nodePath.length - 1]] ||
            mapping[nodePath[nodePath.length - 2]] ||
            mapping[nodePath[nodePath.length - 3]]);
    }
}
//# sourceMappingURL=completion.js.map