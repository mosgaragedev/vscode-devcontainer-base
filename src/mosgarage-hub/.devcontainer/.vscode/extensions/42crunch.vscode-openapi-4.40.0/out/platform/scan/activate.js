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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const lens_1 = require("./lens");
const commands_1 = __importDefault(require("./commands"));
const view_1 = require("./view");
const report_view_1 = require("./report-view");
const config_1 = require("./config");
const selectors = {
    json: { scheme: "file", language: "json" },
    jsonc: { scheme: "file", language: "jsonc" },
    yaml: { scheme: "file", language: "yaml" },
};
function activate(context, platformContext, cache, logger, configuration, secrets, store, envStore, prefs, signUpWebView, auditView, auditContext) {
    let disposables = [];
    const scanViews = {};
    const reportViews = {};
    const getScanView = async (uri) => {
        const viewId = uri.toString();
        const alias = (await (0, config_1.getOpenapiAlias)(uri)) || "unknown";
        if (scanViews[viewId] === undefined) {
            scanViews[viewId] = new view_1.ScanWebView(alias, context.extensionPath, cache, logger, configuration, secrets, store, envStore, prefs, auditView, () => getReportView(uri), auditContext);
        }
        return scanViews[viewId];
    };
    const getReportView = async (uri) => {
        const viewId = uri.toString();
        const alias = (await (0, config_1.getOpenapiAlias)(uri)) || "unknown";
        if (reportViews[viewId] === undefined) {
            reportViews[viewId] = new report_view_1.ScanReportWebView(alias, context.extensionPath, cache);
        }
        return reportViews[viewId];
    };
    const getExistingReportView = (uri) => {
        const viewId = uri.toString();
        return reportViews[viewId];
    };
    const scanCodelensProvider = new lens_1.ScanCodelensProvider(cache);
    function activateLens(enabled) {
        disposables.forEach((disposable) => disposable.dispose());
        if (enabled) {
            disposables = Object.values(selectors).map((selector) => vscode.languages.registerCodeLensProvider(selector, scanCodelensProvider));
        }
        else {
            disposables = [];
        }
    }
    configuration.onDidChange(async (e) => {
        if (configuration.changed(e, "codeLens")) {
            activateLens(configuration.get("codeLens"));
        }
    });
    activateLens(configuration.get("codeLens"));
    (0, commands_1.default)(cache, platformContext, store, configuration, secrets, logger, getScanView, getExistingReportView, signUpWebView);
    return new vscode.Disposable(() => disposables.forEach((disposable) => disposable.dispose()));
}
//# sourceMappingURL=activate.js.map