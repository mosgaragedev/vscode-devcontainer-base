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
exports.DocumentIndent = void 0;
exports.processSnippetParameters = processSnippetParameters;
exports.dropBracketsOnEdit = dropBracketsOnEdit;
exports.renameKeyNode = renameKeyNode;
exports.deleteJsonNode = deleteJsonNode;
exports.deleteYamlNode = deleteYamlNode;
exports.insertJsonNode = insertJsonNode;
exports.insertYamlNode = insertYamlNode;
exports.replaceJsonNode = replaceJsonNode;
exports.replaceYamlNode = replaceYamlNode;
exports.getFixAsJsonString = getFixAsJsonString;
exports.getFixAsYamlString = getFixAsYamlString;
exports.safeParse = safeParse;
// @ts-nocheck
const vscode = __importStar(require("vscode"));
const yaml = __importStar(require("yaml"));
const parser_options_1 = require("./parser-options");
const types_1 = require("./types");
const quickfix_sources_1 = __importDefault(require("./audit/quickfix-sources"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const json_utils_1 = require("./json-utils");
const quickfix_1 = require("./audit/quickfix");
class DocumentIndent {
    constructor(indent, indentChar) {
        this.indent = indent;
        this.indentChar = indentChar;
    }
    getIndent() {
        return this.indent;
    }
    getIndentChar() {
        return this.indentChar;
    }
    toDefaultString() {
        return this.indentChar.repeat(this.indent);
    }
    toString(n) {
        return this.indentChar.repeat(n);
    }
    static defaultInstance() {
        return new DocumentIndent(2, " ");
    }
}
exports.DocumentIndent = DocumentIndent;
function getBasicIndent(document, root) {
    const children = (0, json_utils_1.getRootAsJsonNodeValue)(root).getChildren();
    if (document.languageId === "json" || document.languageId === "jsonc") {
        if (children.length > 0) {
            const position = document.positionAt(children[0].getRange(root)[0]);
            const index = document.lineAt(position.line).firstNonWhitespaceCharacterIndex;
            return new DocumentIndent(index, getCharAtIndex(document, position.line, index));
        }
    }
    else {
        for (const child of children) {
            if (child.isObject()) {
                const firstChild = child.getFirstChild();
                if (firstChild) {
                    const position = document.positionAt(firstChild.getRange(root)[0]);
                    const index = Math.round(document.lineAt(position.line).firstNonWhitespaceCharacterIndex);
                    return new DocumentIndent(index, getCharAtIndex(document, position.line, index));
                }
            }
        }
    }
    return DocumentIndent.defaultInstance();
}
function getCharAtIndex(document, line, index) {
    return document.getText(new vscode.Range(new vscode.Position(line, index - 1), new vscode.Position(line, index)));
}
function getText(document, start, end) {
    return document.getText(new vscode.Range(document.positionAt(start), document.positionAt(end)));
}
function getCurrentIndent(document, offset) {
    const position = document.positionAt(offset);
    return document.lineAt(position.line).firstNonWhitespaceCharacterIndex;
}
function getLineByOffset(document, offset) {
    return document.lineAt(document.positionAt(offset).line);
}
function getTopLineByOffset(document, offset) {
    return document.lineAt(document.positionAt(offset).line - 1);
}
function shift(text, indent, padding, extra = 0, prepend = true) {
    if (prepend) {
        text = indent.toString(padding) + text;
    }
    text = text.replace(new RegExp("\n", "g"), "\n" + indent.toString(padding + extra));
    text = text.replace(new RegExp("\t", "g"), indent.toDefaultString());
    return text;
}
async function processSnippetParameters(editor, parameters, brackets) {
    if (parameters.dropLine) {
        const edit = new vscode.WorkspaceEdit();
        edit.insert(editor.document.uri, parameters.location, "\n");
        await vscode.workspace.applyEdit(edit);
        parameters.location = new vscode.Position(parameters.location.line + 1, 0);
    }
    else if (brackets) {
        const preEdit = new vscode.WorkspaceEdit();
        dropBracketsOnEdit(editor, brackets, preEdit);
        await vscode.workspace.applyEdit(preEdit);
        parameters.location = new vscode.Position(parameters.location.line + 1, 0);
    }
}
function dropBracketsOnEdit(editor, brackets, edit) {
    const [start, end] = brackets;
    const range = new vscode.Range(editor.document.positionAt(start), editor.document.positionAt(end));
    edit.replace(editor.document.uri, range, "\n");
}
function renameKeyNode(context) {
    const document = context.document;
    const target = context.target;
    const [start, end] = target.getKeyRange(context.root);
    return new vscode.Range(document.positionAt(start), document.positionAt(end));
}
function deleteJsonNode(context) {
    const root = context.root;
    const document = context.document;
    const target = context.target;
    const prev = target.prev(root);
    const next = target.next(root);
    const parent = target.getParent(root);
    let startPos;
    if (prev) {
        const [, end] = prev.getRange(root);
        let hasNext = next !== undefined;
        const pointers = context.pointersToRemove;
        if (hasNext && pointers && pointers.size > 0) {
            hasNext = hasNextTarget(parent, target, pointers);
        }
        if (hasNext) {
            const [toOffset] = target.getRange(root);
            startPos = getPosAfterComma(document, end, toOffset);
        }
        else {
            startPos = document.positionAt(end);
        }
    }
    else {
        const [start] = parent.getValueRange(root);
        startPos = document.positionAt(start + 1);
    }
    let toOffset;
    const [, end] = target.getRange(root);
    if (next) {
        const [start] = next.getRange(root);
        toOffset = start;
    }
    else {
        const [, end] = parent.getRange(root);
        toOffset = end;
    }
    const endPos = getPosAfterComma(document, end, toOffset);
    return new vscode.Range(startPos, endPos);
}
function getPosAfterComma(document, fromOffset, toOffset) {
    const fromPos = document.positionAt(fromOffset);
    const toPos = document.positionAt(toOffset);
    const text = document.getText(new vscode.Range(fromPos, toPos));
    return document.positionAt(fromOffset + text.indexOf(",") + 1);
}
function hasNextTarget(parent, target, pointersToRemove) {
    const pointers = [];
    for (const child of parent.getChildren()) {
        const pointer = child.pointer;
        if (!pointersToRemove.has(pointer) || target.pointer === pointer) {
            pointers.push(pointer);
        }
    }
    return pointers.indexOf(target.pointer) !== pointers.length - 1;
}
function deleteYamlNode(context) {
    const root = context.root;
    const document = context.document;
    const target = context.target;
    const [start, end] = target.getRange(root);
    let startPos = document.positionAt(start);
    let endPos = document.positionAt(end);
    const parent = target.getParent(root);
    const children = parent.getChildren();
    const insertEmptyStub = children.length === 1 && children[0].value === target.value;
    const isArray = parent.isArray();
    const isObject = parent.isObject();
    if (isArray || isObject) {
        startPos = new vscode.Position(getLineByOffset(document, start).lineNumber, 0);
        endPos = new vscode.Position(getLineByOffset(document, end).lineNumber + 1, 0);
        if (insertEmptyStub) {
            if (!context["positionsToInsert"]) {
                context["positionsToInsert"] = [];
            }
            const [, end] = parent.getKeyRange(root);
            const line = getLineByOffset(document, end);
            const insPos = new vscode.Position(line.lineNumber, line.text.indexOf(":") + 1);
            context["positionsToInsert"].push([insPos, isObject ? " {}" : " []"]);
        }
        return new vscode.Range(startPos, endPos);
    }
}
function insertJsonNode(context, value) {
    const document = context.document;
    const root = context.root;
    const target = context.target;
    const snippet = context.snippet;
    let start, end;
    const indent = getBasicIndent(document, root);
    let anchor;
    if (target.isObject()) {
        anchor = keepInsertionOrder(context) ? getAnchor(context) : target.getLastChild();
    }
    else {
        anchor = target.getLastChild();
    }
    if (anchor === undefined) {
        [start, end] = target.getValueRange(root);
        const text = getText(document, start, end);
        end = start + 1;
        const parentPadding = getCurrentIndent(document, target.getRange(root)[0]);
        const padding = parentPadding + indent.getIndent();
        if (snippet) {
            value = "\n\t" + value.replace(new RegExp("\n", "g"), "\n\t");
        }
        else {
            value = "\n" + indent.toString(padding) + shift(value, indent, padding, 0, false);
        }
        if (!text.includes("\n")) {
            value += "\n";
        }
        if (target.getChildren().length > 0) {
            value += ",";
        }
        else {
            if (!snippet) {
                value += indent.toString(parentPadding);
            }
        }
        return [value, document.positionAt(end)];
    }
    else {
        [start, end] = anchor.getRange(root);
        const padding = getCurrentIndent(document, start);
        const position = document.positionAt(end);
        if (snippet) {
            return [",\n" + value, position];
        }
        else {
            return [",\n" + shift(value, indent, padding), position];
        }
    }
}
function insertYamlNode(context, value) {
    const document = context.document;
    const root = context.root;
    const target = context.target;
    const snippet = context.snippet;
    let start, end;
    const indent = getBasicIndent(document, root);
    let anchor;
    if (target.isObject()) {
        anchor = keepInsertionOrder(context) ? getAnchor(context) : target.getLastChild();
    }
    else {
        anchor = target.getLastChild();
    }
    if (anchor === undefined) {
        if (target.getChildren().length === 0) {
            [start, end] = target.getValueRange(root);
            context.dropBrackets = [start, end];
            const padding = getCurrentIndent(document, start) + indent.getIndent();
            const position = document.positionAt(start + (snippet ? 0 : 2));
            if (target.isObject()) {
                value = shift(value, indent, padding);
                return [value, position];
            }
            else if (target.isArray()) {
                value = shift("- " + value, indent, padding, "- ".length);
                return [value, position];
            }
        }
        else {
            [start, end] = target.getKeyRange(root);
            const line = getLineByOffset(document, end);
            const padding = getCurrentIndent(document, end) + indent.getIndent();
            const position = new vscode.Position(line.lineNumber, line.text.length);
            if (target.isObject()) {
                value = shift(value, indent, padding);
                if (snippet) {
                    context.snippetParameters.dropLine = true;
                }
                else {
                    value = "\n" + value;
                }
                return [value, position];
            }
            else if (target.isArray()) {
                value = shift("- " + value, indent, padding, "- ".length);
                if (snippet) {
                    context.snippetParameters.dropLine = true;
                }
                else {
                    value = "\n" + value;
                }
                return [value, position];
            }
        }
    }
    else {
        [start, end] = anchor.getRange(root);
        const padding = getCurrentIndent(document, start);
        const position = document.positionAt(end);
        if (target.isObject()) {
            value = shift(value, indent, padding);
            if (snippet) {
                context.snippetParameters.dropLine = true;
            }
            else {
                value = "\n" + value;
            }
            return [value, position];
        }
        else if (target.isArray()) {
            value = shift("- " + value, indent, padding, "- ".length);
            if (snippet) {
                context.snippetParameters.dropLine = true;
            }
            else {
                value = "\n" + value;
            }
            return [value, position];
        }
    }
}
function replaceJsonNode(context, value) {
    const document = context.document;
    const root = context.root;
    const target = context.target;
    const [start, end] = target.getValueRange(root);
    const isObject = value.startsWith("{") && value.endsWith("}");
    const isArray = value.startsWith("[") && value.endsWith("]");
    if (isObject || isArray) {
        const index = getCurrentIndent(document, start);
        const indent = getBasicIndent(document, root);
        value = shift(value, indent, index, 0, false);
    }
    return [value, new vscode.Range(document.positionAt(start), document.positionAt(end))];
}
function replaceYamlNode(context, value) {
    const document = context.document;
    const root = context.root;
    const target = context.target;
    const [start, end] = target.getValueRange(root);
    const i1 = value.indexOf(":");
    const i2 = value.indexOf("- ");
    const isObjectValue = i1 > 0 && (i2 < 0 || (i2 > 0 && i2 > i1));
    const isArrayValue = i2 >= 0 && (i1 < 0 || (i1 > 0 && i1 > i2));
    if (isObjectValue || isArrayValue) {
        const index = getCurrentIndent(document, start);
        const indent = getBasicIndent(document, root);
        // Last array member end offset may be at the beggining of the next key node (next line)
        // In this case we must keep ident + \n symbols
        if (target.isArray()) {
            const line = getLineByOffset(document, end);
            // But do not handle the case if the last array member = the last item in the doc
            if (!line.text.trim().startsWith("-")) {
                const line = getTopLineByOffset(document, end);
                const endPosition = new vscode.Position(line.lineNumber, line.text.length);
                value = shift(value, indent, index, 0, false);
                return [value, new vscode.Range(document.positionAt(start), endPosition)];
            }
        }
        // Replace plain value with not plain one (add a new line)
        const parent = target.getParent(context.root);
        if (!(target.isArray() || target.isObject()) && parent.isObject()) {
            value = shift("\n" + value, indent, index, indent.getIndent(), false);
        }
    }
    return [value, new vscode.Range(document.positionAt(start), document.positionAt(end))];
}
function getFixAsJsonString(context) {
    const snippet = context.snippet;
    const fix = context.fix;
    const type = fix.type;
    let text = JSON.stringify(fix.fix, null, "\t").trim();
    if (fix.parameters) {
        text = handleParameters(context, text);
    }
    // For snippets we must escape $ symbol
    if (snippet && (type === types_1.FixType.Insert || type === types_1.FixType.Replace)) {
        text = text.replace(new RegExp("\\$ref", "g"), "\\$ref");
    }
    if (context.target.isObject() && type === types_1.FixType.Insert) {
        text = text.replace("{\n\t", "");
        text = text.replace("\n}", "");
        // Replace only trailing \t, i.e. a\t\t\ta\t\ta\t -> a\t\ta\ta
        text = text.replace(new RegExp("\t(?!\t)", "g"), "");
    }
    return text;
}
function getFixAsYamlString(context) {
    const snippet = context.snippet;
    const fix = context.fix;
    const type = fix.type;
    let text = yaml.stringify(fix.fix, null, { indent: 2, singleQuote: true }).trim();
    if (fix.parameters) {
        text = handleParameters(context, text);
    }
    // For snippets we must escape $ symbol
    if (snippet && (type === types_1.FixType.Insert || type === types_1.FixType.Replace)) {
        text = text.replace(new RegExp("\\$ref", "g"), "\\$ref");
    }
    // 2 spaces is the ident for the dump()
    return text.replace(new RegExp("  ", "g"), "\t");
}
function handleParameters(context, text) {
    const replacements = [];
    const { issues, fix, version, bundle, document, snippet, formatMap } = context;
    const languageId = context.document.languageId;
    const root = safeParse(text, languageId);
    const indexes = {};
    for (const parameter of context.fix.parameters) {
        let index;
        const pointer = parameter.path;
        if (indexes[parameter.name]) {
            index = indexes[parameter.name];
        }
        else {
            index = replacements.length + 1;
            indexes[parameter.name] = index;
        }
        const replaceKey = parameter.type === "key";
        let phValues = parameter.values;
        const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        let defaultValue = replaceKey ? target.getKey() : target.value;
        let cacheValues = null;
        if (parameter.source && quickfix_sources_1.default[parameter.source]) {
            const source = quickfix_sources_1.default[parameter.source];
            const issue = parameter.fixIndex ? issues[parameter.fixIndex] : issues[0];
            cacheValues = source(issue, fix, parameter, version, bundle, document, formatMap);
            if (cacheValues && (document.languageId === "json" || document.languageId === "jsonc")) {
                const safeValues = [];
                cacheValues.forEach((value) => {
                    let safeValue = value;
                    if (typeof safeValue === "string") {
                        safeValue = escapeJson(safeValue);
                        if (context.snippet) {
                            safeValue = escapeJson(safeValue);
                        }
                    }
                    safeValues.push(safeValue);
                });
                cacheValues = safeValues;
            }
        }
        let finalValue;
        if (snippet) {
            finalValue = getPlaceholder(index, defaultValue, phValues, cacheValues);
        }
        else {
            if (cacheValues && cacheValues.length > 0) {
                finalValue = cacheValues[0];
            }
            else {
                finalValue = defaultValue;
                // Faster just to skip this replacement, leaving it default as it is
                continue;
            }
        }
        replacements.push({
            pointer: pointer,
            value: finalValue,
            replaceKey: replaceKey,
        });
    }
    return (0, json_utils_1.replace)(text, languageId, replacements);
}
function getPlaceholder(index, defaultValue, possibleValues, cacheValues) {
    if (cacheValues && cacheValues.length > 0) {
        if (possibleValues) {
            possibleValues = cacheValues;
        }
        else {
            defaultValue = cacheValues[0];
        }
    }
    if (possibleValues) {
        // Escape comma symbols
        possibleValues = possibleValues.map((value) => {
            if (typeof value === "string") {
                return value.replace(new RegExp(",", "g"), "\\,");
            }
            else {
                return value;
            }
        });
    }
    else if (typeof defaultValue === "string") {
        // Escape $ and } inside placeholders (for example in regexp)
        defaultValue = defaultValue
            .replace(new RegExp("\\$", "g"), "\\$")
            .replace(new RegExp("}", "g"), "\\}");
    }
    return ("${" + index + (possibleValues ? "|" + possibleValues.join() + "|" : ":" + defaultValue) + "}");
}
function safeParse(text, languageId) {
    const [root, errors] = (0, preserving_json_yaml_parser_1.parse)(text, languageId, parser_options_1.parserOptions);
    if (errors.length) {
        throw new Error("Can't parse OpenAPI file");
    }
    return root;
}
function findInsertionAnchor(root, element, tags, prefix) {
    for (let position = tags.indexOf(element) - 1; position >= 0; position--) {
        const anchor = (0, json_utils_1.findJsonNodeValue)(root, `${prefix}/${tags[position]}`);
        if (anchor) {
            return anchor;
        }
    }
    return undefined;
}
function keepInsertionOrder(context) {
    const { version, target } = context;
    return (target.pointer === "" || (version === types_1.OpenApiVersion.V3 && target.pointer === "/components"));
}
function getAnchor(context) {
    const { root, version, target, fix } = context;
    const keys = Object.keys(fix["fix"]);
    if (keys.length === 1) {
        const key = keys[0];
        if (target.pointer === "") {
            return findInsertionAnchor(root, key, quickfix_1.topTags, "");
        }
        else if (version === types_1.OpenApiVersion.V3 && target.pointer === "/components") {
            return findInsertionAnchor(root, key, quickfix_1.componentsTags, "/components");
        }
    }
    return undefined;
}
function escapeJson(jsonText) {
    // JSON.stringify("abc") returns '"abc"'
    // JSON.stringify("(^[\\w\\s\\.]{5,50}$)") returns '"(^[\\\\w\\\\s\\\\.]{5,50}$)"'
    const res = JSON.stringify(jsonText);
    return res.substring(1, res.length - 1);
}
//# sourceMappingURL=util.js.map