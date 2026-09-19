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
const configuration_1 = require("../../configuration");
const credentials_1 = require("../../credentials");
exports.default = (secrets, store, tagsWebView, signUpWebView) => ({
    copyToClipboard: async (value, message) => {
        vscode.env.clipboard.writeText(value);
        const disposable = vscode.window.setStatusBarMessage(message);
        setTimeout(() => disposable.dispose(), 2000);
    },
    openInWebUI: async (node) => {
        const platformUrl = store.getConnection().platformUrl;
        if ("getApiId" in node) {
            const apiId = node.getApiId();
            const uri = vscode.Uri.parse(platformUrl + `/apis/${apiId}`);
            vscode.env.openExternal(uri);
        }
        else if ("getCollectionId" in node) {
            const collectionId = node.getCollectionId();
            const uri = vscode.Uri.parse(platformUrl + `/collections/${collectionId}`);
            vscode.env.openExternal(uri);
        }
    },
    setTags: async (uri) => {
        await tagsWebView.showTagsWebView(uri);
    },
    openSignUp: async () => {
        const credentials = await (0, credentials_1.hasCredentials)(configuration_1.configuration, secrets);
        if (credentials === undefined) {
            await (0, credentials_1.configureCredentials)(signUpWebView);
        }
        else {
            const response = await vscode.window.showInformationMessage("Already registered, check Settings for details.", "Open Settings");
            if (response === "Open Settings") {
                vscode.commands.executeCommand("openapi.showSettings");
            }
        }
    },
});
//# sourceMappingURL=util.js.map