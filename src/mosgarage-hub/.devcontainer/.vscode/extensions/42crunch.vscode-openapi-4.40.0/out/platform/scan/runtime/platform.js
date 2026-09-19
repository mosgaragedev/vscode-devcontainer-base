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
exports.createScanConfigWithPlatform = createScanConfigWithPlatform;
exports.createDefaultConfigWithPlatform = createDefaultConfigWithPlatform;
const vscode = __importStar(require("vscode"));
const node_util_1 = require("node:util");
async function createScanConfigWithPlatform(store, scanconfUri, oas) {
    const tmpApi = await store.createTempApi(oas);
    const report = await store.getAuditReport(tmpApi.apiId);
    if (report?.data.openapiState !== "valid") {
        await store.clearTempApi(tmpApi);
        throw new Error("Your API has structural or semantic issues in its OpenAPI format. Run Security Audit on this file and fix these issues first.");
    }
    await store.createDefaultScanConfig(tmpApi.apiId);
    const configs = await store.getScanConfigs(tmpApi.apiId);
    const c = await store.readScanConfig(configs[0].configuration.id);
    const config = JSON.parse(Buffer.from(c.file, "base64").toString("utf-8"));
    await store.clearTempApi(tmpApi);
    if (config === undefined) {
        throw new Error("Failed to load default scan configuration from the platform");
    }
    const encoder = new node_util_1.TextEncoder();
    await vscode.workspace.fs.writeFile(scanconfUri, encoder.encode(JSON.stringify(config, null, 2)));
}
async function createDefaultConfigWithPlatform(store, oas) {
    const tmpApi = await store.createTempApi(oas);
    const report = await store.getAuditReport(tmpApi.apiId);
    if (report?.data.openapiState !== "valid") {
        await store.clearTempApi(tmpApi);
        throw new Error("Your API has structural or semantic issues in its OpenAPI format. Run Security Audit on this file and fix these issues first.");
    }
    await store.createDefaultScanConfig(tmpApi.apiId);
    const configs = await store.getScanConfigs(tmpApi.apiId);
    const c = await store.readScanConfig(configs[0].configuration.id);
    const config = JSON.parse(Buffer.from(c.file, "base64").toString("utf-8"));
    await store.clearTempApi(tmpApi);
    if (config === undefined) {
        throw new Error("Failed to load default scan configuration from the platform");
    }
    return JSON.stringify(config, null, 2);
}
//# sourceMappingURL=platform.js.map