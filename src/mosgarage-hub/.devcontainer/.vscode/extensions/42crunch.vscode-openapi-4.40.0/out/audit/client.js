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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArticles = getArticles;
exports.requestToken = requestToken;
const vscode = __importStar(require("vscode"));
const got_1 = __importDefault(require("got"));
const endpoints_1 = require("@xliic/common/endpoints");
let cachedArticles = undefined;
async function getArticles(useDevEndpoints) {
    if (cachedArticles === undefined) {
        cachedArticles = downloadArticles(useDevEndpoints);
    }
    return cachedArticles;
}
async function downloadArticles(useDevEndpoints) {
    const { kdbUrl } = (0, endpoints_1.getEndpoints)(useDevEndpoints);
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Loading API Security Audit KDB Articles...",
        cancellable: false,
    }, async (progress, cancellationToken) => {
        try {
            const response = await (0, got_1.default)(kdbUrl);
            return JSON.parse(response.body);
        }
        catch (error) {
            throw new Error(`Failed to read articles.json: ${error}`);
        }
    });
}
async function requestToken(email, optIn, useDevEndpoints) {
    const { freemiumdUrl } = (0, endpoints_1.getEndpoints)(useDevEndpoints);
    const response = await (0, got_1.default)(`${freemiumdUrl}/api/v1/anon/token`, {
        method: "POST",
        form: { email, "opt-in": optIn },
        headers: {
            Accept: "application/json",
        },
    });
    return JSON.parse(response.body);
}
//# sourceMappingURL=client.js.map