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
exports.runPlatformAudit = runPlatformAudit;
/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
const vscode = __importStar(require("vscode"));
const platform_store_1 = require("../../platform/stores/platform-store");
const audit_1 = require("../audit");
const util_1 = require("../../platform/util");
const util_2 = require("../util");
async function runPlatformAudit(document, oas, mapping, cache, store, memento) {
    try {
        const tmpApi = await store.createTempApi(oas, (0, platform_store_1.getTagDataEntry)(memento, document.uri.fsPath));
        const report = await store.getAuditReport(tmpApi.apiId);
        const compliance = await store.readAuditCompliance(report.tid);
        const todoReport = await store.readAuditReportSqgTodo(report.tid);
        await store.clearTempApi(tmpApi);
        const audit = await (0, audit_1.parseAuditReport)(cache, document, report.data, mapping);
        const { issues: todo } = await (0, audit_1.parseAuditReport)(cache, document, todoReport.data, mapping);
        audit.compliance = compliance;
        audit.todo = todo;
        const tempAuditDirectory = await (0, util_2.saveAuditReportToTempDirectory)(report.data);
        return { audit, tempAuditDirectory };
    }
    catch (ex) {
        if (ex?.response?.statusCode === 409 &&
            ex?.response?.body?.code === 109 &&
            ex?.response?.body?.message === "limit reached") {
            vscode.window.showErrorMessage("You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account.");
        }
        else {
            vscode.window.showErrorMessage((0, util_1.formatException)("Unexpected error when trying to audit API using the platform:", ex));
        }
    }
}
//# sourceMappingURL=platform.js.map