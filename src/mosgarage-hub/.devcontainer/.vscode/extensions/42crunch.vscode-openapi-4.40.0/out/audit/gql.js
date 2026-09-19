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
exports.registerSecurityGqlAudit = registerSecurityGqlAudit;
const graphql_1 = require("graphql");
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const node_util_1 = require("node:util");
const path_1 = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const configuration_1 = require("../configuration");
const credentials_1 = require("../credentials");
const external_refs_1 = require("../external-refs");
const cli_ast_1 = require("../platform/cli-ast");
const config_1 = require("../util/config");
const fs_1 = require("../util/fs");
const decoration_1 = require("./decoration");
const service_1 = require("./service");
const asyncExecFile = (0, node_util_1.promisify)(node_child_process_1.execFile);
const execMaxBuffer = 1024 * 1024 * 20; // 20MB
const ARGUMENT_PATTERN = new RegExp("\\(.*:.*\\)$");
const LIST_TYPE_PATTERN = new RegExp(":\\s*\\[.*]!?$");
const SIMPLE_TYPE_PATTERN = new RegExp(":\\s*[^()\\[\\]]+$");
function registerSecurityGqlAudit(context, cache, auditContext, pendingAudits, reportWebView, store, signUpWebView) {
    return vscode.commands.registerTextEditorCommand("openapi.securityGqlAudit", async (textEditor, edit) => {
        await securityAudit(signUpWebView, context.workspaceState, context.secrets, cache, auditContext, pendingAudits, reportWebView, store, textEditor);
    });
}
async function securityAudit(signUpWebView, memento, secrets, cache, auditContext, pendingAudits, reportWebView, store, editor) {
    if (!(await (0, credentials_1.ensureHasCredentials)(signUpWebView, configuration_1.configuration, secrets))) {
        return;
    }
    const uri = editor.document.uri.toString();
    if (pendingAudits[uri]) {
        vscode.window.showErrorMessage(`Audit for "${uri}" is already in progress`);
        return;
    }
    delete auditContext.auditsByMainDocument[uri];
    pendingAudits[uri] = true;
    try {
        await reportWebView.sendStartAudit();
        const result = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Running GQL Security Audit...",
            cancellable: false,
        }, async (progress, cancellationToken) => {
            const text = editor.document.getText();
            if (await (0, cli_ast_1.ensureCliDownloaded)(configuration_1.configuration, secrets)) {
                return runCliAudit(editor.document, text, cache, secrets, configuration_1.configuration, progress);
            }
            else {
                // cli is not available and user chose to cancel download
                vscode.window.showErrorMessage("42Crunch API Security Testing Binary is required to run Audit.");
                return;
            }
        });
        if (result) {
            (0, service_1.setAudit)(auditContext, uri, result.audit, result.tempAuditDirectory);
            (0, decoration_1.setDecorations)(editor, auditContext);
            await reportWebView.showReport(result.audit);
        }
        else {
            await reportWebView.sendCancelAudit();
        }
        delete pendingAudits[uri];
    }
    catch (e) {
        delete pendingAudits[uri];
        vscode.window.showErrorMessage(`Failed to audit: ${e}`);
    }
}
async function runCliAudit(document, text, cache, secrets, configuration, progress) {
    const config = await (0, config_1.loadConfig)(configuration, secrets);
    const result = await runAuditWithCliBinary(secrets, config, text, config.cliDirectoryOverride);
    const audit = await parseGqlAuditReport(cache, document, result?.audit, result?.graphQlAst);
    return { audit, tempAuditDirectory: result.tempAuditDirectory };
}
async function runAuditWithCliBinary(secrets, config, text, cliDirectoryOverride) {
    const dir = (0, fs_1.createTempDirectory)("audit-");
    await (0, promises_1.writeFile)((0, node_path_1.join)(dir, "schema.graphql"), text, { encoding: "utf8" });
    const cli = (0, node_path_1.join)(getBinDirectory(cliDirectoryOverride), getCliFilename());
    const env = {};
    const args = ["graphql", "audit", "schema.graphql", "--output", "report.json"];
    try {
        const output = await asyncExecFile(cli, args, {
            cwd: dir,
            windowsHide: true,
            env,
            maxBuffer: execMaxBuffer,
        });
        const reportFilename = (0, node_path_1.join)(dir, "report.json");
        const report = await (0, promises_1.readFile)(reportFilename, { encoding: "utf8" });
        const parsed = JSON.parse(report);
        const ast = (0, graphql_1.parse)(text);
        return { audit: parsed, graphQlAst: ast, tempAuditDirectory: dir };
    }
    catch (ex) {
        const error = readException(ex);
        throw new Error(formatException(error));
    }
}
async function parseGqlAuditReport(cache, document, report, ast) {
    const documentUri = document.uri.toString();
    const [grades, issues, documents, _badIssues] = await splitReportByDocument(document, report, ast, cache);
    const filename = (0, path_1.basename)(document.fileName);
    const files = {};
    const mainPath = document.uri.fsPath;
    const mainDir = path_1.default.dirname(mainPath);
    for (const uri of Object.keys(documents)) {
        const publicUri = (0, external_refs_1.fromInternalUri)(vscode.Uri.parse(uri));
        if (publicUri.scheme === "http" || publicUri.scheme === "https") {
            files[uri] = { relative: publicUri.toString() };
        }
        else {
            files[uri] = { relative: path_1.default.relative(mainDir, publicUri.fsPath) };
        }
    }
    const result = {
        valid: report.valid,
        openapiState: report.openapiState,
        minimalReport: report.minimalReport,
        summary: {
            ...grades,
            documentUri,
            subdocumentUris: Object.keys(documents).filter((uri) => uri != documentUri),
        },
        issues,
        filename,
        files,
    };
    return result;
}
async function splitReportByDocument(mainDocument, report, ast, cache) {
    const grades = readSummary(report);
    const reportedIssues = readAssessment(report);
    const [mainRoot, documentUris, issuesPerDocument, badIssues] = processIssues(mainDocument, cache, reportedIssues);
    const files = {
        [mainDocument.uri.toString()]: [mainDocument, mainRoot],
    };
    const issues = {};
    for (const [uri, reportedIssues] of Object.entries(issuesPerDocument)) {
        const [document, root] = files[uri];
        issues[uri] = [];
        reportedIssues.forEach((issue) => {
            const loc = getLocationByPointer(document, ast, issue.pointer);
            if (loc) {
                const [lineNo, range] = loc;
                issues[uri].push({
                    ...issue,
                    documentUri: uri,
                    lineNo,
                    range,
                });
            }
        });
    }
    const documents = {};
    for (const [uri, [document, root]] of Object.entries(files)) {
        documents[uri] = document;
    }
    return [grades, issues, documents, badIssues];
}
function getLocationByPointer(document, reg, pointer) {
    let items;
    // Wisely split location into parts by .
    if (pointer.match(ARGUMENT_PATTERN)) {
        const mainPtr = pointer.substring(0, pointer.lastIndexOf("("));
        const prefix = pointer.substring(pointer.lastIndexOf("("));
        items = mainPtr.split(".");
        items[items.length - 1] = items[items.length - 1] + prefix;
    }
    else {
        items = pointer.split(".");
    }
    // Find final field
    let objTypeDef = null;
    let fieldDef = null;
    for (let item of items) {
        item = cleanValue(item);
        if (objTypeDef !== null && fieldDef !== null) {
            objTypeDef = null;
            fieldDef = null;
        }
        if (objTypeDef === null) {
            for (const def of reg.definitions) {
                // Not all definitions have name property
                if (def.name?.value === item) {
                    objTypeDef = def;
                    break;
                }
            }
        }
        else {
            if (fieldDef === null) {
                for (const field of objTypeDef.fields) {
                    if (field.name.value === item) {
                        fieldDef = field;
                        break;
                    }
                }
            }
        }
    }
    let loc = undefined;
    if (fieldDef !== null) {
        // Try to find more precise location
        const lastItem = items[items.length - 1];
        if (lastItem.match(SIMPLE_TYPE_PATTERN) || lastItem.match(LIST_TYPE_PATTERN)) {
            // id: ID or Mutation.usersAddEmailForAuthenticated()[0]: _
            // Notifications(): [Notification] or Query.starship().Starship.coordinates: [[Float!]!]
            loc = getTypeName(fieldDef.type).loc;
        }
        else if (lastItem.match(ARGUMENT_PATTERN)) {
            // Notifications(limit: Int) or Query.migration(exclude[0]: String)
            let name = lastItem.substring(lastItem.indexOf("(") + 1, lastItem.lastIndexOf(":")).trim();
            name = cleanValue2(name, "[");
            let myValDef = null;
            for (const valDef of fieldDef.arguments) {
                if (name === valDef.name?.value || name.startsWith(valDef.name.value + ".")) {
                    myValDef = valDef;
                    break;
                }
            }
            if (myValDef != null) {
                const typeName = getTypeName(myValDef.type);
                loc = typeName.loc;
            }
            else {
                loc = fieldDef.type.loc;
            }
        }
        else {
            loc = fieldDef.loc;
        }
    }
    else if (objTypeDef !== null) {
        loc = objTypeDef.loc;
    }
    if (loc) {
        const pos1 = document.positionAt(loc.start);
        const pos2 = document.positionAt(loc.end);
        const range = new vscode.Range(pos1, pos2);
        return [pos1.line, range];
    }
    else {
        console.info(`Unable to locate node: ${pointer}`);
        return undefined;
    }
}
function getTypeName(type) {
    if (type.kind === "NonNullType" || type.kind === "ListType") {
        return getTypeName(type.type);
    }
    else {
        return type;
    }
}
function cleanValue(value) {
    value = cleanValue2(value, "(");
    value = cleanValue2(value, "[");
    return cleanValue2(value, ":");
}
function cleanValue2(value, valueToRemove) {
    const i = value.indexOf(valueToRemove);
    return 0 < i ? value.substring(0, i) : value;
}
function processIssues(document, cache, issues) {
    const mainUri = document.uri;
    const documentUris = { [mainUri.toString()]: true };
    const issuesPerDocument = {};
    const badIssues = [];
    const root = cache.getLastGoodParsedDocument(document);
    if (root === undefined) {
        throw new Error("Failed to parse current document");
    }
    for (const issue of issues) {
        const location = findIssueLocation(mainUri, root, issue.pointer);
        if (location) {
            const [uri, pointer] = location;
            if (!issuesPerDocument[uri]) {
                issuesPerDocument[uri] = [];
            }
            if (!documentUris[uri]) {
                documentUris[uri] = true;
            }
            issuesPerDocument[uri].push({
                ...issue,
                pointer: pointer,
            });
        }
        else {
            // can't find issue, add to the list ot bad issues
            badIssues.push(issue);
        }
    }
    return [root, Object.keys(documentUris), issuesPerDocument, badIssues];
}
function readAssessment(assessment) {
    let issues = [];
    function transformScore(score) {
        const rounded = Math.abs(Math.round(score));
        if (score === 0) {
            return "0";
        }
        else if (rounded >= 1) {
            return rounded.toString();
        }
        return "less than 1";
    }
    function transformIssues(issues, defaultCriticality = 4) {
        const result = [];
        for (const id of Object.keys(issues)) {
            const issue = issues[id];
            const description = issue.description;
            for (const occ of issue.occurrences) {
                result.push({
                    id,
                    description,
                    pointer: occ.location,
                    score: occ.score ? Math.abs(occ.score) : 0,
                    displayScore: transformScore(occ.score ? occ.score : 0),
                    criticality: issue.criticality ? issue.criticality : defaultCriticality,
                });
            }
        }
        return result;
    }
    if (assessment.issues) {
        issues = issues.concat(transformIssues(assessment.issues));
    }
    issues.sort((a, b) => b.score - a.score);
    return issues;
}
function readSummary(assessment) {
    const grades = {
        datavalidation: {
            value: 0,
            max: 0,
        },
        security: {
            value: 0,
            max: 0,
        },
        oasconformance: {
            value: 0,
            max: 0,
        },
        all: Math.round(assessment.score ? assessment.score : 0),
        errors: false,
        invalid: false,
    };
    if (assessment.semanticErrors || assessment.validationErrors) {
        grades.errors = true;
    }
    if (assessment.openapiState === "fileInvalid") {
        grades.invalid = true;
    }
    return grades;
}
function findIssueLocation(mainUri, root, pointer) {
    return [mainUri.toString(), pointer];
}
function getCrunchDirectory() {
    if (process.platform === "win32") {
        return (0, node_path_1.join)(process.env["APPDATA"] || (0, node_os_1.homedir)(), "42Crunch");
    }
    else {
        return (0, node_path_1.join)((0, node_os_1.homedir)(), ".42crunch");
    }
}
function getBinDirectory(cliDirectoryOverride) {
    if (cliDirectoryOverride !== undefined && cliDirectoryOverride !== "") {
        return cliDirectoryOverride;
    }
    else {
        return (0, node_path_1.join)(getCrunchDirectory(), "bin");
    }
}
function getCliFilename() {
    if (process.platform === "win32") {
        return "42c-ast.exe";
    }
    else {
        return "42c-ast";
    }
}
function formatException({ message, stdout, stderr, }) {
    return [message, stdout, stderr].filter((message) => message !== "").join("\n");
}
function readException(ex) {
    const message = "message" in ex ? ex.message : "";
    const stdout = "stdout" in ex ? Buffer.from(ex.stdout, "utf8").toString() : "";
    const stderr = "stdout" in ex ? Buffer.from(ex.stderr, "utf8").toString() : "";
    return { message, stdout, stderr };
}
//# sourceMappingURL=gql.js.map