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
exports.decorationType = void 0;
exports.setDecorations = setDecorations;
exports.updateDecorations = updateDecorations;
const path_1 = require("path");
const vscode = __importStar(require("vscode"));
exports.decorationType = vscode.window.createTextEditorDecorationType({});
function setDecorations(editor, auditContext) {
    if (auditContext.decorations[editor.document.uri.toString()]) {
        editor.setDecorations(exports.decorationType, auditContext.decorations[editor.document.uri.toString()]);
    }
}
function updateDecorations(decorations, mainUri, issues) {
    const mainFilename = (0, path_1.basename)(vscode.Uri.parse(mainUri).fsPath);
    for (const [uri, issuez] of Object.entries(issues)) {
        decorations[uri] = createDecoration(mainUri, mainFilename, issuez);
    }
    return decorations;
}
function createDecoration(mainUri, mainFilename, issues) {
    const options = [];
    const issueLines = {};
    for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        const line = issue.range.start.line;
        const issuesPerLine = issueLines[line] ? issueLines[line] : [];
        issuesPerLine.push({ issue, issueId: i });
        issueLines[line] = issuesPerLine;
    }
    // sort
    for (const lineNo of Object.keys(issueLines)) {
        issueLines[lineNo].sort((a, b) => a.issue.score - b.issue.score);
    }
    for (const lineNo of Object.keys(issueLines)) {
        const lineNoInt = parseInt(lineNo, 10);
        const issueIds = issueLines[lineNo].map((line) => line.issueId);
        const base64Uri = Buffer.from(mainUri).toString("base64");
        const params = {
            ids: issueIds,
            uri: base64Uri,
        };
        const commandUri = vscode.Uri.parse(`command:openapi.focusSecurityAuditById?${encodeURIComponent(JSON.stringify(params))}`);
        const count = issueLines[lineNo].length;
        const markdown = `[View detailed report for ${count} OpenAPI issue(s) in audit of ${mainFilename}](${commandUri})`;
        const down = new vscode.MarkdownString(markdown);
        down.isTrusted = true;
        const range = new vscode.Range(new vscode.Position(lineNoInt, 0), new vscode.Position(lineNoInt, 160));
        const decoration = {
            range: range,
            hoverMessage: down,
        };
        options.push(decoration);
    }
    return options;
}
//# sourceMappingURL=decoration.js.map