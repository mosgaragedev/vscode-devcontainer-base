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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditCodeActions = exports.componentsTags = exports.topTags = void 0;
exports.fixInsert = fixInsert;
exports.fixDelete = fixDelete;
exports.fixDeleteApplyIfNeeded = fixDeleteApplyIfNeeded;
exports.updateReport = updateReport;
exports.registerQuickfixes = registerQuickfixes;
exports.updateTitle = updateTitle;
exports.getDeadRefs = getDeadRefs;
// @ts-nocheck
const vscode = __importStar(require("vscode"));
const quickfixes = __importStar(require("../generated/quickfixes.json"));
const types_1 = require("../types");
const diagnostic_1 = require("./diagnostic");
const decoration_1 = require("./decoration");
const util_1 = require("../util");
const quickfix_sources_1 = __importDefault(require("./quickfix-sources"));
const util_2 = require("./util");
const quickfix_schema_1 = require("./quickfix-schema");
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const json_utils_1 = require("../json-utils");
const extract_1 = require("../util/extract");
const pointer_1 = require("../pointer");
const registeredQuickFixes = {};
// preferred order of the tags, mixed v2 and v3 tags
exports.topTags = [
    "swagger",
    "openapi",
    "info",
    "externalDocs",
    "host",
    "basePath",
    "schemes",
    "consumes",
    "produces",
    "tags",
    "servers",
    "components",
    "paths",
    "parameters",
    "responses",
    "security",
    "securityDefinitions",
    "definitions",
];
// preferred order of tags in v3 components
exports.componentsTags = [
    "schemas",
    "responses",
    "parameters",
    "examples",
    "requestBodies",
    "headers",
    "securitySchemes",
    "links",
    "callbacks",
];
function fixRegexReplace(context) {
    const document = context.document;
    const fix = context.fix;
    const target = context.target;
    const currentValue = target.value;
    if (typeof currentValue !== "string") {
        return;
    }
    context.snippet = false;
    const newValue = currentValue.replace(new RegExp(fix.match, "g"), fix.replace);
    let value, range;
    if (document.languageId === "yaml") {
        [value, range] = (0, util_1.replaceYamlNode)(context, newValue);
    }
    else {
        [value, range] = (0, util_1.replaceJsonNode)(context, '"' + newValue + '"');
    }
    const edit = getWorkspaceEdit(context);
    edit.replace(document.uri, range, value);
}
function fixInsert(context) {
    const document = context.document;
    let value, position;
    context.snippet = !context.bulk;
    context.snippetParameters = {};
    if (document.languageId === "yaml") {
        [value, position] = (0, util_1.insertYamlNode)(context, (0, util_1.getFixAsYamlString)(context));
    }
    else {
        [value, position] = (0, util_1.insertJsonNode)(context, (0, util_1.getFixAsJsonString)(context));
    }
    if (context.snippet) {
        context.snippetParameters.snippet = new vscode.SnippetString(value);
        context.snippetParameters.location = position;
    }
    else {
        const edit = getWorkspaceEdit(context);
        context.snippetParameters = undefined;
        if (context.dropBrackets) {
            (0, util_1.dropBracketsOnEdit)(context.editor, context.dropBrackets, edit);
        }
        if (context.skipConfirmation) {
            edit.insert(document.uri, position, value);
        }
        else {
            edit.insert(document.uri, position, value, {
                needsConfirmation: true,
                label: context.fix.title,
            });
        }
    }
}
function fixReplace(context) {
    const document = context.document;
    let value, range;
    context.snippet = false;
    if (document.languageId === "yaml") {
        [value, range] = (0, util_1.replaceYamlNode)(context, (0, util_1.getFixAsYamlString)(context));
    }
    else {
        [value, range] = (0, util_1.replaceJsonNode)(context, (0, util_1.getFixAsJsonString)(context));
    }
    const edit = getWorkspaceEdit(context);
    edit.replace(document.uri, range, value);
}
function fixRenameKey(context) {
    const document = context.document;
    let value;
    context.snippet = false;
    if (document.languageId === "yaml") {
        value = (0, util_1.getFixAsYamlString)(context);
    }
    else {
        value = (0, util_1.getFixAsJsonString)(context);
    }
    const range = (0, util_1.renameKeyNode)(context);
    const edit = getWorkspaceEdit(context);
    edit.replace(document.uri, range, value);
}
function fixDelete(context) {
    const document = context.document;
    let range;
    context.snippet = false;
    if (document.languageId === "yaml") {
        range = (0, util_1.deleteYamlNode)(context);
    }
    else {
        range = (0, util_1.deleteJsonNode)(context);
    }
    if (!range) {
        return;
    }
    if (!context["rangesToRemove"]) {
        context["rangesToRemove"] = [range];
        return;
    }
    const nonOpRanges = context["rangesToRemove"];
    if (nonOpRanges.some((r) => r.contains(range))) {
        return;
    }
    const ranges = [];
    nonOpRanges.forEach((r) => ranges.push(r));
    for (const r of nonOpRanges) {
        if (range.contains(r)) {
            removeRange(ranges, r);
        }
        else if (r.intersection(range)) {
            removeRange(ranges, r);
            range = r.union(range);
        }
    }
    ranges.push(range);
    context["rangesToRemove"] = ranges;
}
function fixDeleteApplyIfNeeded(context) {
    if (context.positionsToInsert) {
        for (const range of context.positionsToInsert) {
            context.edit.insert(context.document.uri, range[0], range[1]);
        }
        context.positionsToInsert = [];
    }
    if (context.rangesToRemove) {
        for (const range of context.rangesToRemove) {
            context.edit.delete(context.document.uri, range);
        }
        context.rangesToRemove = [];
    }
}
function removeRange(ranges, rangeToRemove) {
    ranges.forEach((range, index) => {
        if (range === rangeToRemove) {
            ranges.splice(index, 1);
        }
    });
}
function transformInsertToReplaceIfExists(context) {
    const target = context.target;
    const fix = context.fix;
    const keys = Object.keys(fix.fix);
    if (target.isObject() && keys.length === 1) {
        const insertingKey = keys[0];
        for (const child of target.getChildren()) {
            if (child.getKey() === insertingKey) {
                context.target = (0, json_utils_1.findJsonNodeValue)(context.root, `${context.target.pointer}/${insertingKey}`);
                context.fix = {
                    problem: fix.problem,
                    title: fix.title,
                    type: types_1.FixType.Replace,
                    fix: fix.fix[insertingKey],
                };
                return true;
            }
        }
    }
    return false;
}
async function quickFixCommand(editor, issues, fix, auditContext, store, cache, reportWebView) {
    let edit = null;
    let snippetParameters = null;
    let dropBrackets = null;
    const document = editor.document;
    const uri = document.uri.toString();
    const audit = auditContext.auditsByDocument[uri];
    if (!audit) {
        return;
    }
    const auditDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(audit.summary.documentUri));
    const bundle = await cache.getDocumentBundle(auditDocument);
    const version = cache.getDocumentVersion(auditDocument);
    const issuesByPointer = getIssuesByPointers(issues);
    // Single fix has one issue in the array
    // Assembled fix means all issues share same pointer, but have different ids
    // Bulk means all issues share same id, but have different pointers
    const bulk = Object.keys(issuesByPointer).length > 1;
    const formatMap = new Map();
    if (store.isConnected()) {
        const formats = await store.getDataDictionaryFormats();
        for (const format of formats) {
            formatMap.set(format.name, format);
        }
    }
    for (const issuePointer of Object.keys(issuesByPointer)) {
        // if fix.pointer exists, append it to diagnostic.pointer
        const pointer = fix.pointer ? `${issuePointer}${fix.pointer}` : issuePointer;
        const root = cache.getLastGoodParsedDocument(document);
        const target = (0, json_utils_1.findJsonNodeValue)(root, pointer);
        const context = {
            editor: editor,
            edit: edit,
            issues: bulk ? issuesByPointer[issuePointer] : issues,
            fix: (0, preserving_json_yaml_parser_1.simpleClone)(fix),
            bulk: bulk,
            auditContext: auditContext,
            version: version,
            bundle: bundle,
            root: root,
            target: target,
            document: document,
            formatMap: formatMap,
        };
        switch (fix.type) {
            case types_1.FixType.Insert:
                if (transformInsertToReplaceIfExists(context)) {
                    fixReplace(context);
                }
                else {
                    fixInsert(context);
                }
                break;
            case types_1.FixType.Replace:
                fixReplace(context);
                break;
            case types_1.FixType.RegexReplace:
                fixRegexReplace(context);
                break;
            case types_1.FixType.RenameKey:
                fixRenameKey(context);
                break;
            case types_1.FixType.Delete:
                fixDelete(context);
        }
        // A fix handler above initialized workspace edit lazily with updates
        // Remember it here to pass to other fix handlers in case of bulk fix feature
        // They will always udate the same edit instance
        if (context.edit) {
            edit = context.edit;
        }
        if (context.snippetParameters) {
            dropBrackets = context["dropBrackets"];
            snippetParameters = context.snippetParameters;
        }
    }
    // Apply only if has anything to apply
    if (edit) {
        fixDeleteApplyIfNeeded(context);
        await vscode.workspace.applyEdit(edit);
    }
    else if (snippetParameters) {
        await (0, util_1.processSnippetParameters)(editor, snippetParameters, dropBrackets);
        await editor.insertSnippet(snippetParameters.snippet, snippetParameters.location);
    }
    // update diagnostics
    updateReport(editor, issues, auditContext, cache, reportWebView);
}
function updateReport(editor, issues, auditContext, cache, reportWebView) {
    const document = editor.document;
    const uri = document.uri.toString();
    const audit = auditContext.auditsByDocument[uri];
    if (!audit) {
        return;
    }
    // create temp hash set to have constant time complexity while searching for fixed issues
    const fixedIssueIds = new Set();
    const fixedIssueIdAndPointers = new Set();
    issues.forEach((issue) => {
        fixedIssueIds.add(issue.id);
        fixedIssueIdAndPointers.add(issue.id + issue.pointer);
    });
    // update range for all issues (since the fix has potentially changed line numbering in the file)
    const root = cache.getLastGoodParsedDocument(document);
    const updatedIssues = [];
    for (const issue of audit.issues[uri]) {
        if (fixedIssueIdAndPointers.has(getIssueUniqueId(issue))) {
            continue;
        }
        const [lineNo, range] = (0, util_2.getLocationByPointer)(document, root, issue.pointer);
        issue.lineNo = lineNo;
        issue.range = range;
        updatedIssues.push(issue);
    }
    audit.issues[uri] = updatedIssues;
    // rebuild diagnostics and decorations and refresh report
    (0, diagnostic_1.updateDiagnostics)(auditContext.diagnostics, audit.filename, audit.issues);
    (0, decoration_1.updateDecorations)(auditContext.decorations, audit.summary.documentUri, audit.issues);
    (0, decoration_1.setDecorations)(editor, auditContext);
    if (reportWebView) {
        reportWebView.showIfVisible(audit);
    }
}
function registerQuickfixes(context, cache, auditContext, store, reportWebView) {
    vscode.commands.registerTextEditorCommand("openapi.simpleQuickFix", async (editor, edit, issues, fix) => quickFixCommand(editor, issues, fix, auditContext, store, cache, reportWebView));
    vscode.commands.registerTextEditorCommand("openapi.generateSchemaQuickFix", async (editor, edit, issue, fix, examples, inline) => (0, quickfix_schema_1.generateSchemaFixCommand)(editor, issue, fix, examples, inline, auditContext, cache, reportWebView));
    vscode.languages.registerCodeActionsProvider("yaml", new AuditCodeActions(auditContext, cache), {
        providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
    });
    vscode.languages.registerCodeActionsProvider("json", new AuditCodeActions(auditContext, cache), {
        providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
    });
    vscode.languages.registerCodeActionsProvider("jsonc", new AuditCodeActions(auditContext, cache), {
        providedCodeActionKinds: AuditCodeActions.providedCodeActionKinds,
    });
    for (const fix of quickfixes.fixes) {
        for (const problemId of fix.problem) {
            registeredQuickFixes[problemId] = fix;
        }
    }
}
function createSingleAction(diagnostic, issues, fix) {
    const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
    action.command = {
        arguments: [issues, fix],
        command: "openapi.simpleQuickFix",
        title: fix.title,
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    return [action];
}
function createCombinedAction(issues, titles, problem, parameters, fixfix) {
    if (issues.length > 1) {
        const combinedFix = {
            problem,
            title: titles.join(", "),
            type: types_1.FixType.Insert,
            fix: fixfix,
            parameters: parameters,
        };
        const action = new vscode.CodeAction(combinedFix.title, vscode.CodeActionKind.QuickFix);
        action.command = {
            arguments: [issues, combinedFix],
            command: "openapi.simpleQuickFix",
            title: combinedFix.title,
        };
        action.diagnostics = [];
        action.isPreferred = true;
        return [action];
    }
    return [];
}
function createBulkAction(document, version, bundle, diagnostic, issue, issues, fix) {
    // FIXME for offering the bulk action, make sure that current issue also has
    // parameter values from source
    // continue only if the current issue has non-default params
    if (!hasNonDefaultParams(issue, fix, version, bundle, document)) {
        return [];
    }
    // all issues with same id and non-default params
    const similarIssues = issues
        .filter((issue) => issue.id === diagnostic.id)
        .filter((issue) => hasNonDefaultParams(issue, fix, version, bundle, document));
    if (similarIssues.length > 1) {
        const bulkTitle = `Group fix: ${fix.title} in ${similarIssues.length} locations`;
        const bulkAction = new vscode.CodeAction(bulkTitle, vscode.CodeActionKind.QuickFix);
        bulkAction.command = {
            arguments: [similarIssues, fix],
            command: "openapi.simpleQuickFix",
            title: bulkTitle,
        };
        bulkAction.diagnostics = [diagnostic];
        bulkAction.isPreferred = false;
        return [bulkAction];
    }
    return [];
}
function hasNonDefaultParams(issue, fix, version, bundle, document) {
    if (!fix.parameters) {
        return true;
    }
    const nonDefaultParameterValues = fix.parameters
        .map((parameter) => getSourceValue(issue, fix, parameter, version, bundle, document))
        .filter((values) => values.length > 0);
    return fix.parameters.length === nonDefaultParameterValues.length;
}
class AuditCodeActions {
    constructor(auditContext, cache) {
        this.auditContext = auditContext;
        this.cache = cache;
    }
    async provideCodeActions(document, range, context, token) {
        const actions = [];
        const uri = document.uri.toString();
        const audit = this.auditContext.auditsByDocument[uri];
        const issues = audit?.issues[uri];
        if (!issues || issues.length === 0) {
            return [];
        }
        const auditDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(audit.summary.documentUri));
        const bundle = await this.cache.getDocumentBundle(auditDocument);
        const version = this.cache.getDocumentVersion(auditDocument);
        const root = this.cache.getParsedDocument(document);
        if (!root || !bundle) {
            return [];
        }
        const titles = [];
        const problems = [];
        const parameters = [];
        const combinedIssues = [];
        let fixObject = {};
        const issuesByPointer = getIssuesByPointers(issues);
        // Only AuditDiagnostic with fixes in registeredQuickFixes
        const diagnostics = context.diagnostics.filter((diagnostic) => {
            return (diagnostic.id && diagnostic.pointer !== undefined && registeredQuickFixes[diagnostic.id]);
        });
        for (const diagnostic of diagnostics) {
            const fix = registeredQuickFixes[diagnostic.id];
            const issue = issuesByPointer[diagnostic.pointer].filter((issue) => issue.id === diagnostic.id);
            actions.push(...createSingleAction(diagnostic, issue, fix));
            actions.push(...createBulkAction(document, version, bundle, diagnostic, issue[0], issues, fix));
            actions.push(...(0, quickfix_schema_1.createGenerateSchemaAction)(document, version, root, diagnostic, issue[0], fix));
            // Combined Fix
            if (fix.type == types_1.FixType.Insert && !fix.pointer && !Array.isArray(fix.fix)) {
                problems.push(...fix.problem);
                updateTitle(titles, fix.title);
                if (fix.parameters) {
                    for (const parameter of fix.parameters) {
                        const par = (0, preserving_json_yaml_parser_1.simpleClone)(parameter);
                        par.fixIndex = combinedIssues.length;
                        parameters.push(par);
                    }
                }
                fixObject = { ...fixObject, ...fix.fix };
                combinedIssues.push(issue[0]);
            }
        }
        actions.push(...createCombinedAction(combinedIssues, titles, problems, parameters, fixObject));
        return actions;
    }
}
exports.AuditCodeActions = AuditCodeActions;
AuditCodeActions.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
function getSourceValue(issue, fix, parameter, version, bundle, document) {
    if (parameter.source && quickfix_sources_1.default[parameter.source]) {
        const source = quickfix_sources_1.default[parameter.source];
        const value = source(issue, fix, parameter, version, bundle, document);
        return value;
    }
    return [];
}
function updateTitle(titles, title) {
    if (titles.length === 0) {
        titles.push(title);
        return;
    }
    let parts = title.split(" ");
    let prevParts = titles[titles.length - 1].split(" ");
    if (parts[0].toLocaleLowerCase() !== prevParts[0].toLocaleLowerCase()) {
        parts[0] = parts[0].toLocaleLowerCase();
        titles.push(parts.join(" "));
        return;
    }
    const plurals = {
        property: "properties",
        response: "responses",
    };
    if (!compareAsWord(parts[parts.length - 1], prevParts[prevParts.length - 1], plurals)) {
        parts.shift();
        titles[titles.length - 1] += ", " + parts.join(" ");
        return;
    }
    parts.shift();
    parts.pop();
    let lastPrevPart = prevParts.pop();
    prevParts[prevParts.length - 1] += ",";
    prevParts.push(...parts);
    if (lastPrevPart in plurals) {
        lastPrevPart = plurals[lastPrevPart];
    }
    prevParts.push(lastPrevPart);
    titles[titles.length - 1] = prevParts.join(" ");
}
function compareAsWord(a, b, plural) {
    a = a.toLocaleLowerCase();
    b = b.toLocaleLowerCase();
    return a === b || plural[a] === b || plural[b] === a;
}
function getWorkspaceEdit(context) {
    if (context.edit) {
        return context.edit;
    }
    context.edit = new vscode.WorkspaceEdit();
    return context.edit;
}
function getIssuesByPointers(issues) {
    const issuesByPointers = {};
    for (const issue of issues) {
        if (!issuesByPointers[issue.pointer]) {
            issuesByPointers[issue.pointer] = [];
        }
        issuesByPointers[issue.pointer].push(issue);
    }
    return issuesByPointers;
}
function getIssueUniqueId(issue) {
    return issue.id + issue.pointer;
}
function getDeadRefs(targetPointer, context) {
    const refDeps = {};
    const bundle = context.bundle;
    (0, extract_1.walk)(bundle.value, null, [], (_parent, path, key, value) => {
        if (key === "$ref" && typeof value === "string" && value.startsWith("#/")) {
            const pointer = (0, pointer_1.joinJsonPointer)(path.reverse());
            if (!(value in refDeps)) {
                refDeps[value] = new Set();
            }
            refDeps[value].add(pointer);
        }
    });
    const myRefs = new Set();
    refWalk(context.root, context.target, myRefs);
    if (myRefs.size === 0) {
        return [];
    }
    const deadRefs = [];
    for (const myRef of myRefs) {
        // If targetPointer = /paths/~1pets, pointers = [/paths/~1pets~1{petId}/..., /paths/~1pets/...]
        // Use targetPointer + "/" to filter only target pointer (not all pointers)
        const pointers = [...refDeps[myRef]].filter((p) => !p.startsWith(targetPointer + "/"));
        if (pointers.length === 0) {
            deadRefs.push(myRef);
        }
        else {
            // If at least one pointer is referenced from any path (not targetPointer path) we must never delete it
            if (!pointers.some((p) => p.startsWith("/paths/"))) {
                // Fast check that pointers may belong to dead refs, for example:
                // myRef = #/components/schemas/Pet
                // pointers = [/components/schemas/Pets/items]
                // deadRefs = [#/components/schemas/Pets]
                // It may help to decrease number of recursive calls in checkIfSomePointerDead
                const pointersToCheck = pointers.filter((p) => !assertPointerBelongToRefs(p, deadRefs));
                if (pointersToCheck.length === 0) {
                    deadRefs.push(myRef);
                }
                else {
                    // Here we may be unaware of all dead refs, for example
                    // myRef = #/components/schemas/Pet
                    // pointers = [/components/schemas/Pets/items]
                    // deadRefs = []
                    if (checkAllPointersDead(pointersToCheck, refDeps, targetPointer)) {
                        deadRefs.push(myRef);
                    }
                }
            }
        }
    }
    return deadRefs;
}
function assertPointerBelongToRefs(pointer, refs) {
    const myRef = "#" + pointer;
    return refs.some((ref) => myRef === ref || myRef.startsWith(ref + "/"));
}
function checkAllPointersDead(pointers, refDeps, targetPointer) {
    for (const pointer of pointers) {
        for (const ref of Object.keys(refDeps)) {
            if (assertPointerBelongToRefs(pointer, [ref])) {
                // Handle possible circular references using p !== pointer
                const refs = [...refDeps[ref]].filter((p) => !p.startsWith(targetPointer + "/") && p !== pointer);
                if (refs.length > 0) {
                    if (refs.some((p) => p.startsWith("/paths/"))) {
                        return false;
                    }
                    else {
                        refs = removeAll(refs, pointers); // Avoid infinite recursion
                        if (refs.length > 0) {
                            return checkAllPointersDead(refs, refDeps, targetPointer);
                        }
                    }
                }
            }
        }
    }
    return true;
}
function removeAll(deleteFrom, pointersToDelete) {
    const res = [];
    for (const item of deleteFrom) {
        const index = pointersToDelete.indexOf(item);
        if (index === -1) {
            res.push(item);
        }
    }
    return res;
}
function refWalk(root, target, refs) {
    (0, extract_1.walk)(target, null, [], (_parent, _path, key, value) => {
        if (key === "$ref" && typeof value === "string" && value.startsWith("#/") && !(value in refs)) {
            refs.add(value);
            const refTarget = (0, json_utils_1.findJsonNodeValue)(root, value.replace("#/", "/"));
            if (refTarget) {
                refWalk(root, refTarget, refs);
            }
        }
    });
}
//# sourceMappingURL=quickfix.js.map