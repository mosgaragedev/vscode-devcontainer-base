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
exports.ScanReportWebView = void 0;
const vscode = __importStar(require("vscode"));
const node_fs_1 = require("node:fs");
const util_1 = require("../../audit/util");
const web_view_1 = require("../../webapps/web-view");
const node_path_1 = require("node:path");
const fs_1 = require("../../util/fs");
class ScanReportWebView extends web_view_1.WebView {
    constructor(alias, extensionPath, cache) {
        super(extensionPath, "scan", `Scan report ${alias}`, vscode.ViewColumn.One, "eye");
        this.cache = cache;
        this.hostHandlers = {
            started: async () => { },
            sendCurlRequest: async (curl) => {
                return copyCurl(curl);
            },
            showJsonPointer: async (payload) => {
                if (this.document) {
                    let editor = undefined;
                    // check if document is already open
                    for (const visibleEditor of vscode.window.visibleTextEditors) {
                        if (visibleEditor.document.uri.toString() === this.document.uri.toString()) {
                            editor = visibleEditor;
                        }
                    }
                    if (!editor) {
                        editor = await vscode.window.showTextDocument(this.document, vscode.ViewColumn.One);
                    }
                    const root = this.cache.getParsedDocument(editor.document);
                    const lineNo = (0, util_1.getLocationByPointer)(editor.document, root, payload)[0];
                    const textLine = editor.document.lineAt(lineNo);
                    editor.selection = new vscode.Selection(lineNo, 0, lineNo, 0);
                    editor.revealRange(textLine.range, vscode.TextEditorRevealType.AtTop);
                }
            },
            parseChunkCompleted: async () => {
                if (this.chunks) {
                    const { value, done } = await this.chunks.next();
                    if (done) {
                        this.chunks = undefined;
                        this.chunksAbortController = undefined;
                    }
                    await this.sendRequest({
                        command: "parseChunk",
                        payload: done ? null : value,
                    });
                }
            },
        };
        this.alias = alias;
        vscode.window.onDidChangeActiveColorTheme((e) => {
            if (this.isActive()) {
                this.sendColorTheme(e);
            }
        });
    }
    async onStart() {
        await this.sendColorTheme(vscode.window.activeColorTheme);
    }
    async onDispose() {
        this.document = undefined;
        if (this.temporaryReportDirectory !== undefined) {
            await cleanupTempScanDirectory(this.temporaryReportDirectory);
        }
        if (this.chunksAbortController) {
            this.chunksAbortController.abort();
            this.chunksAbortController = undefined;
            this.chunks = undefined;
        }
        await super.onDispose();
    }
    setTemporaryReportDirectory(dir) {
        this.temporaryReportDirectory = dir;
    }
    async sendLogMessage(message, level) {
        this.sendRequest({
            command: "showLogMessage",
            payload: { message, level, timestamp: new Date().toISOString() },
        });
    }
    async showGeneralError(error) {
        this.sendRequest({
            command: "showGeneralError",
            payload: error,
        });
    }
    async showReport(document) {
        this.document = document;
        await this.show();
    }
    async showScanReport(reportFilename) {
        await this.sendRequest({
            command: "showScanReport",
            // FIXME path and method are ignored by the UI, fix message to make 'em optionals
            payload: {
                apiAlias: this.alias,
            },
        });
        this.chunksAbortController = new AbortController();
        this.chunks = readFileChunks(reportFilename, 1024 * 512, this.chunksAbortController.signal);
        const { value, done } = await this.chunks.next();
        await this.sendRequest({
            command: "parseChunk",
            payload: done ? null : value,
        });
    }
    async exportReport(destination) {
        const reportUri = vscode.Uri.file((0, node_path_1.join)(this.temporaryReportDirectory, "report.json"));
        vscode.workspace.fs.copy(reportUri, destination, { overwrite: true });
    }
}
exports.ScanReportWebView = ScanReportWebView;
async function copyCurl(curl) {
    vscode.env.clipboard.writeText(curl);
    const disposable = vscode.window.setStatusBarMessage(`Curl command copied to the clipboard`);
    setTimeout(() => disposable.dispose(), 1000);
}
async function cleanupTempScanDirectory(dir) {
    const oasFilename = (0, node_path_1.join)(dir, "openapi.json");
    const scanconfFilename = (0, node_path_1.join)(dir, "scanconf.json");
    const reportFilename = (0, node_path_1.join)(dir, "report.json");
    const graphqlFilename = (0, node_path_1.join)(dir, "schema.graphql");
    try {
        if ((0, fs_1.existsSync)(oasFilename)) {
            (0, node_fs_1.unlinkSync)(oasFilename);
        }
        if ((0, fs_1.existsSync)(scanconfFilename)) {
            (0, node_fs_1.unlinkSync)(scanconfFilename);
        }
        if ((0, fs_1.existsSync)(reportFilename)) {
            (0, node_fs_1.unlinkSync)(reportFilename);
        }
        if ((0, fs_1.existsSync)(graphqlFilename)) {
            (0, node_fs_1.unlinkSync)(graphqlFilename);
        }
        (0, node_fs_1.rmdirSync)(dir);
    }
    catch (ex) {
        // ignore
    }
}
async function* readFileChunks(filePath, chunkSize = 1024, signal = null) {
    const stream = (0, node_fs_1.createReadStream)(filePath, {
        highWaterMark: chunkSize,
        encoding: "utf8",
    });
    // Optional: abort stream if signal is aborted
    const abortHandler = () => {
        stream.destroy(new Error("Aborted by user"));
    };
    signal?.addEventListener("abort", abortHandler);
    try {
        for await (const chunk of stream) {
            if (signal?.aborted) {
                break;
            }
            yield chunk;
        }
    }
    finally {
        stream.destroy(); // Clean up the stream
        signal?.removeEventListener("abort", abortHandler);
    }
}
//# sourceMappingURL=report-view.js.map