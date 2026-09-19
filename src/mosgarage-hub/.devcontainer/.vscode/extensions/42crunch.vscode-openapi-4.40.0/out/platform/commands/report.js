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
const vscode = __importStar(require("vscode"));
const audit_1 = require("../audit");
const types_1 = require("../../types");
const util_1 = require("../util");
const audit_2 = require("../../audit/audit");
const decoration_1 = require("../../audit/decoration");
const service_1 = require("../../audit/service");
const util_2 = require("../../audit/util");
exports.default = (store, context, auditContext, cache, reportWebView) => ({
    openAuditReport: async (apiId) => {
        await vscode.window.withProgress({
            title: `Loading Audit Report for API ${apiId}`,
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
        }, async () => {
            try {
                const uri = (0, util_1.makePlatformUri)(apiId);
                const document = await vscode.workspace.openTextDocument(uri);
                const audit = await (0, audit_1.refreshAuditReport)(store, cache, auditContext, document);
                if (audit) {
                    await reportWebView.showReport(audit);
                }
            }
            catch (e) {
                vscode.window.showErrorMessage(`Unexpected error: ${e}`);
            }
        });
    },
    loadAuditReportFromFile: async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined ||
            cache.getDocumentVersion(editor.document) === types_1.OpenApiVersion.Unknown) {
            vscode.window.showErrorMessage("Can't load Security Audit report for this document. Please open an OpenAPI document first.");
            return;
        }
        const selection = await vscode.window.showOpenDialog({
            title: "Load Security Audit report",
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            // TODO use language filter from extension.ts
            filters: {
                OpenAPI: ["json", "yaml", "yml"],
            },
        });
        if (selection) {
            const text = await vscode.workspace.fs.readFile(selection[0]);
            const report = JSON.parse(Buffer.from(text).toString("utf-8"));
            const data = extractAuditReport(report);
            if (data !== undefined) {
                const uri = editor.document.uri.toString();
                const audit = await (0, audit_2.parseAuditReport)(cache, editor.document, data, {
                    value: { uri, hash: "" },
                    children: {},
                });
                const tempAuditDirectory = await (0, util_2.saveAuditReportToTempDirectory)(report);
                (0, service_1.setAudit)(auditContext, uri, audit, tempAuditDirectory);
                (0, decoration_1.setDecorations)(editor, auditContext);
                await reportWebView.showReport(audit);
            }
            else {
                vscode.window.showErrorMessage("Can't find 42Crunch Security Audit report in the selected file");
            }
        }
    },
});
function extractAuditReport(report) {
    if (report?.assessmentReportVersion && report?.assessmentVersion) {
        return report;
    }
    else if (report?.aid && report?.tid && report?.data?.assessmentVersion) {
        return report.data;
    }
    else if (report?.taskId && report?.report) {
        return report.report;
    }
    return undefined;
}
//# sourceMappingURL=report.js.map