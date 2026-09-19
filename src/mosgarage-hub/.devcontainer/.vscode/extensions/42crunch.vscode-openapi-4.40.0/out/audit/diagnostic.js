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
exports.updateDiagnostics = updateDiagnostics;
exports.createDiagnosticsForUri = createDiagnosticsForUri;
const vscode = __importStar(require("vscode"));
function updateDiagnostics(diagnostics, filename, issues) {
    for (const uri of Object.keys(issues)) {
        diagnostics.set(vscode.Uri.parse(uri), createDiagnosticsForUri(filename, uri, issues[uri]));
    }
    return diagnostics;
}
function createDiagnosticsForUri(filename, uri, issues) {
    const criticalityToSeverity = {
        1: vscode.DiagnosticSeverity.Hint,
        2: vscode.DiagnosticSeverity.Information,
        3: vscode.DiagnosticSeverity.Warning,
        4: vscode.DiagnosticSeverity.Error,
        5: vscode.DiagnosticSeverity.Error,
    };
    return issues.map((issue) => ({
        source: `audit of ${filename}`,
        id: issue.id,
        pointer: issue.pointer,
        //message: issue.message,
        message: `${issue.description} ${issue.displayScore !== "0" ? `(score impact ${issue.displayScore})` : ""}`,
        severity: criticalityToSeverity[issue.criticality],
        range: issue.range,
    }));
}
//# sourceMappingURL=diagnostic.js.map