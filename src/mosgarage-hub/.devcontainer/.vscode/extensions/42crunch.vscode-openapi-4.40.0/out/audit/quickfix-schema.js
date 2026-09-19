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
exports.generateSchemaFixCommand = generateSchemaFixCommand;
exports.createGenerateSchemaAction = createGenerateSchemaAction;
// @ts-nocheck
const vscode = __importStar(require("vscode"));
const types_1 = require("../types");
const schema_1 = require("./schema");
const quickfix_1 = require("./quickfix");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const json_utils_1 = require("../json-utils");
const util_1 = require("../util");
async function generateSchemaFixCommand(editor, issue, fix, genFrom, inline, auditContext, cache, reportWebView) {
    const document = editor.document;
    const uri = document.uri.toString();
    const audit = auditContext.auditsByDocument[uri];
    if (!audit) {
        return;
    }
    const auditDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(audit.summary.documentUri));
    const version = cache.getDocumentVersion(auditDocument);
    const genSchema = await astToJsonSchema(document, genFrom, version, cache);
    if (!genSchema) {
        return;
    }
    if (inline) {
        await insertSchemaInline(editor, issue, fix, genSchema, auditContext, cache);
    }
    else {
        const root = cache.getParsedDocument(document);
        const schemaNames = getSchemaNames(root, version);
        const schemaName = await vscode.window.showInputBox({
            value: getUniqueSchemaName(schemaNames),
            prompt: "Enter new schema name.",
            validateInput: (value) => !schemaNames.has(value) ? null : "Please enter unique schema name",
        });
        if (schemaName) {
            await insertSchemaByRef(schemaName, editor, issue, fix, genSchema, auditContext, cache);
        }
    }
    (0, quickfix_1.updateReport)(editor, [issue], auditContext, cache, reportWebView);
}
function createGenerateSchemaAction(document, version, root, diagnostic, issue, fix) {
    if (fix.type !== types_1.FixType.Insert) {
        return [];
    }
    let genFrom = null;
    if (version === types_1.OpenApiVersion.V2) {
        genFrom = getSchemaV2Examples(issue.pointer, fix.problem, root);
        genFrom = genFrom || getSchemaV2Example(issue.pointer, fix.problem, root);
    }
    else {
        genFrom = getSchemaV3Examples(issue.pointer, fix.problem, root);
        genFrom = genFrom || getSchemaV3Example(issue.pointer, fix.problem, root);
    }
    if (genFrom) {
        const title = "Generate inline schema from examples";
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.command = {
            arguments: [issue, fix, genFrom, true],
            command: "openapi.generateSchemaQuickFix",
            title: title,
        };
        action.diagnostics = [diagnostic];
        action.isPreferred = false;
        const place = version === types_1.OpenApiVersion.V2 ? "definitions" : "components";
        const title2 = "Generate schema from examples and place it in " + place;
        const action2 = new vscode.CodeAction(title2, vscode.CodeActionKind.QuickFix);
        action2.command = {
            arguments: [issue, fix, genFrom, false],
            command: "openapi.generateSchemaQuickFix",
            title: title2,
        };
        action2.diagnostics = [diagnostic];
        action2.isPreferred = false;
        return [action, action2];
    }
    return [];
}
async function insertSchemaInline(editor, issue, fix, genSchema, auditContext, cache) {
    const document = editor.document;
    const uri = document.uri.toString();
    const audit = auditContext.auditsByDocument[uri];
    if (!audit) {
        return;
    }
    const auditDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(audit.summary.documentUri));
    const bundle = await cache.getDocumentBundle(auditDocument);
    const version = cache.getDocumentVersion(auditDocument);
    const pointer = fix.pointer ? `${issue.pointer}${fix.pointer}` : issue.pointer;
    const root = cache.getParsedDocument(document);
    const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
    const newFix = (0, preserving_json_yaml_parser_1.simpleClone)(fix);
    newFix.fix = target.getKey() === "schema" ? genSchema : { schema: genSchema };
    delete newFix.parameters;
    const context = {
        editor: editor,
        edit: null,
        issues: [issue],
        fix: newFix,
        bulk: false,
        auditContext: auditContext,
        version: version,
        bundle: bundle,
        root: root,
        target: target,
        document: document,
        skipConfirmation: true,
    };
    (0, quickfix_1.fixInsert)(context);
    const params = context.snippetParameters;
    if (params) {
        await (0, util_1.processSnippetParameters)(editor, params, context["dropBrackets"]);
        await editor.insertSnippet(params.snippet, params.location);
    }
}
async function insertSchemaByRef(schemaName, editor, issue, fix, genSchema, auditContext, cache) {
    const document = editor.document;
    const uri = document.uri.toString();
    const audit = auditContext.auditsByDocument[uri];
    if (!audit) {
        return;
    }
    const auditDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(audit.summary.documentUri));
    const bundle = await cache.getDocumentBundle(auditDocument);
    const version = cache.getDocumentVersion(auditDocument);
    const edit = new vscode.WorkspaceEdit();
    const schemaFix = (0, preserving_json_yaml_parser_1.simpleClone)(fix);
    schemaFix.fix = {};
    schemaFix.fix[schemaName] = genSchema;
    delete schemaFix.parameters;
    let target;
    let pointer;
    const root = cache.getParsedDocument(document);
    if (version === types_1.OpenApiVersion.V2) {
        pointer = "/definitions";
        target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        if (!target) {
            pointer = "";
            target = (0, json_utils_1.getRootAsJsonNodeValue)(root);
            schemaFix.fix = {
                definitions: {},
            };
            schemaFix.fix["definitions"][schemaName] = genSchema;
        }
    }
    else {
        pointer = "/components/schemas";
        target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        if (!target) {
            pointer = "/components";
            target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
            if (target) {
                schemaFix.fix = {
                    schemas: {},
                };
                schemaFix.fix["schemas"][schemaName] = genSchema;
            }
            else {
                pointer = "";
                target = (0, json_utils_1.getRootAsJsonNodeValue)(root);
                schemaFix.fix = {
                    components: {
                        schemas: {},
                    },
                };
                schemaFix.fix["components"]["schemas"][schemaName] = genSchema;
            }
        }
    }
    const context = {
        editor: editor,
        edit: edit,
        issues: [issue],
        fix: schemaFix,
        bulk: true,
        auditContext: auditContext,
        version: version,
        bundle: bundle,
        root: root,
        target: target,
        document: document,
        skipConfirmation: true,
    };
    (0, quickfix_1.fixInsert)(context);
    const pointer2 = fix.pointer ? `${issue.pointer}${fix.pointer}` : issue.pointer;
    const target2 = (0, json_utils_1.findJsonNodeValue)(root, pointer2);
    const schemaRefFix = (0, preserving_json_yaml_parser_1.simpleClone)(fix);
    if (version === types_1.OpenApiVersion.V2) {
        if (target2.getKey() === "schema") {
            schemaRefFix.fix = {
                $ref: "#/definitions/" + schemaName,
            };
        }
        else {
            schemaRefFix.fix["schema"]["$ref"] = "#/definitions/" + schemaName;
        }
    }
    else {
        if (target2.getKey() === "schema") {
            schemaRefFix.fix = {
                $ref: "#/components/schemas/" + schemaName,
            };
        }
        else {
            schemaRefFix.fix["schema"]["$ref"] = "#/components/schemas/" + schemaName;
        }
    }
    delete schemaRefFix.parameters;
    const context2 = {
        editor: editor,
        edit: edit,
        issues: [issue],
        fix: schemaRefFix,
        bulk: true,
        auditContext: auditContext,
        version: version,
        bundle: bundle,
        root: root,
        target: target2,
        document: document,
        skipConfirmation: true,
    };
    (0, quickfix_1.fixInsert)(context2);
    if (edit) {
        await vscode.workspace.applyEdit(edit);
    }
}
async function astToJsonSchema(document, genFrom, version, cache) {
    try {
        if (version === types_1.OpenApiVersion.V2) {
            return (0, schema_1.generateSchema)(await getJsonFromAST(genFrom, document, cache));
        }
        else {
            if (genFrom.getKey() === "example") {
                return (0, schema_1.generateSchema)(await getJsonFromAST(genFrom, document, cache));
            }
            else {
                const values = [];
                for (const exampleChild of genFrom.getChildren()) {
                    for (const contentChild of exampleChild.getChildren()) {
                        if (contentChild.getKey() === "value") {
                            values.push(await getJsonFromAST(contentChild, document, cache));
                        }
                    }
                }
                return (0, schema_1.generateOneOfSchema)(values);
            }
        }
    }
    catch (err) { }
    return null;
}
async function getJsonFromAST(target, document, cache) {
    // FIXME check if targert contains a $ref (possibly to an external document) and follow it
    return target;
}
function hasId(id, problem) {
    for (const problemId of problem) {
        if (problemId === id) {
            return true;
        }
    }
    return false;
}
function getUniqueSchemaName(schemaNames) {
    const result = "GeneratedSchemaName";
    for (let index = 1; index < 1000; index++) {
        const newName = result + index;
        if (!schemaNames.has(newName)) {
            return newName;
        }
    }
    return "";
}
function getSchemaNames(root, version) {
    const result = new Set();
    const schemas = version === types_1.OpenApiVersion.V2
        ? (0, json_utils_1.findJsonNodeValue)(root, "/definitions")
        : (0, json_utils_1.findJsonNodeValue)(root, "/components/schemas");
    if (schemas) {
        for (const schema of schemas.getChildren()) {
            result.add(schema.getKey());
        }
    }
    return result;
}
function getSchemaV2Examples(pointer, problem, root) {
    if (hasId("response-schema-undefined", problem)) {
        const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        if (target && target.isObject()) {
            let schema = null;
            let examples = null;
            for (const child of target.getChildren()) {
                if (child.getKey() === "schema") {
                    schema = child;
                }
                else if (child.getKey() === "examples") {
                    examples = child;
                }
            }
            if (examples && !schema) {
                const children = examples.getChildren();
                if (children.length === 1) {
                    const child = children[0];
                    if (child.getKey() === "application/json" &&
                        child.isObject() &&
                        child.getChildren().length > 0) {
                        return child;
                    }
                }
            }
        }
    }
    return null;
}
function getSchemaV2Example(pointer, problem, root) {
    if (hasId("schema-request-notype", problem) || hasId("schema-response-notype", problem)) {
        const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        if (target && target.isObject() && target.getKey() === "schema") {
            const children = target.getChildren();
            if (children.length === 1) {
                const child = children[0];
                if (child.getKey() === "example") {
                    return child;
                }
            }
        }
    }
    return null;
}
function getSchemaV3Examples(pointer, problem, root) {
    // FIXME doesn't handle $ref in the examples
    if (hasId("v3-mediatype-request-schema-undefined", problem) ||
        hasId("v3-mediatype-response-schema-undefined", problem)) {
        const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        if (target && target.isObject() && target.getKey() === "application/json") {
            let schema = null;
            let examples = null;
            for (const child of target.getChildren()) {
                if (child.getKey() === "schema") {
                    schema = child;
                }
                else if (child.getKey() === "examples") {
                    examples = child;
                }
            }
            if (examples && !schema) {
                const children = examples.getChildren();
                if (children.length > 0) {
                    for (const exampleChild of children) {
                        for (const contentChild of exampleChild.getChildren()) {
                            if (contentChild.getKey() === "value") {
                                return examples;
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}
function getSchemaV3Example(pointer, problem, root) {
    if (hasId("v3-schema-request-notype", problem) || hasId("v3-schema-response-notype", problem)) {
        const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        if (target && target.isObject() && target.getKey() === "schema") {
            const children = target.getChildren();
            if (children.length === 1) {
                const child = children[0];
                if (child.getKey() === "example") {
                    return child;
                }
            }
        }
    }
    return null;
}
//# sourceMappingURL=quickfix-schema.js.map