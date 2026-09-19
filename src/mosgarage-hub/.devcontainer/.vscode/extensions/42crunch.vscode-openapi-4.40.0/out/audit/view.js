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
exports.AuditWebView = void 0;
const vscode = __importStar(require("vscode"));
const web_view_1 = require("../webapps/web-view");
const util_1 = require("./util");
const client_1 = require("./client");
class AuditWebView extends web_view_1.WebView {
    constructor(extensionPath, cache, configuration) {
        super(extensionPath, "audit", "Security Audit Report", vscode.ViewColumn.Two);
        this.cache = cache;
        this.configuration = configuration;
        this.hostHandlers = {
            copyIssueId: async (issueId) => {
                vscode.env.clipboard.writeText(issueId);
                const disposable = vscode.window.setStatusBarMessage(`Copied ID: ${issueId}`);
                setTimeout(() => disposable.dispose(), 1000);
            },
            goToLine: async ({ uri, line, pointer }) => {
                this.focusLine(uri, pointer, line);
            },
            openLink: async (url) => {
                vscode.env.openExternal(vscode.Uri.parse(url));
            },
        };
        vscode.window.onDidChangeActiveColorTheme((e) => {
            if (this.isActive()) {
                this.sendColorTheme(e);
            }
        });
    }
    async onStart() {
        await this.sendColorTheme(vscode.window.activeColorTheme);
        await this.sendRequest({ command: "loadKdb", payload: await this.getKdb() });
        if (this.target && this.target.type === "full") {
            await this.sendRequest({ command: "showFullReport", payload: this.target.report });
        }
        else if (this.target && this.target.type === "partial") {
            const { report, uri, ids } = this.target;
            await this.sendRequest({ command: "showPartialReport", payload: { report, uri, ids } });
        }
    }
    prefetchKdb() {
        this.kdb = (0, client_1.getArticles)(this.configuration.get("internalUseDevEndpoints"));
    }
    async getKdb() {
        if (this.kdb !== undefined) {
            return this.kdb;
        }
        this.prefetchKdb();
        return this.kdb;
    }
    async sendStartAudit() {
        await this.show();
        await this.sendRequest({ command: "startAudit", payload: undefined });
    }
    async sendCancelAudit() {
        return this.sendRequest({ command: "cancelAudit", payload: undefined });
    }
    async showReport(report) {
        this.target = { type: "full", report, uri: "", ids: [] };
        await this.show();
    }
    async showIds(report, uri, ids) {
        this.target = { type: "partial", report, uri, ids };
        await this.show();
    }
    async showIfVisible(report) {
        if (this.isActive()) {
            return this.sendRequest({ command: "showFullReport", payload: report });
        }
    }
    async showNoReport() {
        if (this.isActive()) {
            return this.sendRequest({ command: "showNoReport", payload: undefined });
        }
    }
    async focusLine(uri, pointer, line) {
        let editor = undefined;
        // check if document is already open
        for (const visibleEditor of vscode.window.visibleTextEditors) {
            if (visibleEditor.document.uri.toString() == uri) {
                editor = visibleEditor;
            }
        }
        if (!editor) {
            // if not already open, load and show it
            const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
            editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        }
        let lineNo;
        const root = this.cache.getParsedDocument(editor.document);
        if (root) {
            // use pointer by default
            lineNo = (0, util_1.getLocationByPointer)(editor.document, root, pointer)[0];
        }
        else {
            // fallback to line no
            lineNo = line;
        }
        const textLine = editor.document.lineAt(lineNo);
        editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
        editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
    }
}
exports.AuditWebView = AuditWebView;
//# sourceMappingURL=view.js.map