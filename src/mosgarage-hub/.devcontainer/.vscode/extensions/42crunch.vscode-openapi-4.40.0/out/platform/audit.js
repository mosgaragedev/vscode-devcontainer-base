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
exports.refreshAuditReport = refreshAuditReport;
const vscode = __importStar(require("vscode"));
const audit_1 = require("../audit/audit");
const decoration_1 = require("../audit/decoration");
const util_1 = require("./util");
const service_1 = require("../audit/service");
const util_2 = require("../audit/util");
async function refreshAuditReport(store, cache, auditContext, document) {
    if ((0, util_1.isPlatformUri)(document.uri)) {
        const uri = document.uri.toString();
        const apiId = (0, util_1.getApiId)(document.uri);
        const report = await store.getAuditReport(apiId);
        const compliance = await store.readAuditCompliance(report.tid);
        const todoReport = await store.readAuditReportSqgTodo(report.tid);
        const tempAuditDirectory = await (0, util_2.saveAuditReportToTempDirectory)(report.data);
        const mapping = {
            value: { uri, hash: "" },
            children: {},
        };
        const audit = await (0, audit_1.parseAuditReport)(cache, document, report.data, mapping);
        const { issues: todo } = await (0, audit_1.parseAuditReport)(cache, document, todoReport.data, mapping);
        audit.compliance = compliance;
        audit.todo = todo;
        if (audit) {
            // TODO better handling of failing autids
            // since we don't prevent incorrect JSON from being submitted
            // audits might fail
            // also need to trigger setDecorations() on document update
            if (Object.keys(audit.issues).length === 0) {
                auditContext.diagnostics.set(document.uri, undefined);
                auditContext.decorations[uri] = [];
            }
            else {
                (0, service_1.setAudit)(auditContext, uri, audit, tempAuditDirectory);
            }
            if (vscode.window.activeTextEditor?.document === document) {
                (0, decoration_1.setDecorations)(vscode.window.activeTextEditor, auditContext);
            }
            return audit;
        }
    }
}
//# sourceMappingURL=audit.js.map