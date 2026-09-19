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
exports.setAudit = setAudit;
exports.clearAudit = clearAudit;
const vscode = __importStar(require("vscode"));
const audit_1 = require("./audit");
const decoration_1 = require("./decoration");
const diagnostic_1 = require("./diagnostic");
function setAudit(context, uri, audit, tempAuditDirectory) {
    (0, audit_1.updateAuditContext)(context, uri, audit, tempAuditDirectory);
    (0, decoration_1.updateDecorations)(context.decorations, audit.summary.documentUri, audit.issues);
    (0, diagnostic_1.updateDiagnostics)(context.diagnostics, audit.filename, audit.issues);
}
function clearAudit(context, uri) {
    const audit = context.auditsByMainDocument[uri];
    if (audit) {
        delete context.auditsByMainDocument[uri];
        delete context.auditsByDocument[uri];
        for (const subdocumentUri of audit.summary.subdocumentUris) {
            delete context.auditsByDocument[subdocumentUri];
        }
        delete context.decorations[uri];
        context.diagnostics.delete(vscode.Uri.parse(uri));
    }
}
//# sourceMappingURL=service.js.map