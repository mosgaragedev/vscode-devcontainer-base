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
exports.UPGRADE_WARN_LIMIT = void 0;
exports.offerUpgrade = offerUpgrade;
exports.warnOperationScans = warnOperationScans;
exports.warnOperationAudits = warnOperationAudits;
const vscode = __importStar(require("vscode"));
const time_util_1 = require("../time-util");
async function offerUpgrade(isFull) {
    await (0, time_util_1.delay)(100); // workaround for #133073
    const message = isFull
        ? "You have insufficient operations allowance left this month to run a full Audit or Scan. As an alternative you can run single-operation ones, upgrade to increase your allowance or wait until the monthly allowance resets."
        : "Thank you for using the 42Crunch API Security Testing services. You have reached the limit of your monthly Freemium allowance. You have the option to wait until your free monthly allowance resets or upgrade your 42Crunch subscription.";
    return vscode.window
        .showInformationMessage(message, { modal: true }, { title: "View subscription", id: "upgrade" })
        .then((choice) => {
        if (choice?.id === "upgrade") {
            vscode.commands.executeCommand("openapi.showConfiguration");
        }
    });
}
exports.UPGRADE_WARN_LIMIT = 10;
async function warnOperationScans(left) {
    return vscode.window
        .showInformationMessage(`You have ${left} per-operation API Scans left this month. Your usage allowance resets every month. Upgrade to increase allowances.`, { modal: false }, { title: "View subscription", id: "upgrade" })
        .then((choice) => {
        if (choice?.id === "upgrade") {
            vscode.commands.executeCommand("openapi.showConfiguration");
        }
    });
}
async function warnOperationAudits(left) {
    return vscode.window
        .showInformationMessage(`You have ${left} per-operation Security Audits left this month. Your usage allowance resets every month. Upgrade to increase allowances.`, { modal: false }, { title: "View subscription", id: "upgrade" })
        .then((choice) => {
        if (choice?.id === "upgrade") {
            vscode.commands.executeCommand("openapi.showConfiguration");
        }
    });
}
//# sourceMappingURL=upgrade.js.map