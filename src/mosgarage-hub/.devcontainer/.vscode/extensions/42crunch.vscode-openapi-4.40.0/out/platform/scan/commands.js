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
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const configuration_1 = require("../../configuration");
const credentials_1 = require("../../credentials");
const util_1 = require("../../outlines/util");
const cli_ast_1 = require("../cli-ast");
const config_1 = require("./config");
const platform_1 = require("./runtime/platform");
const util_2 = require("../util");
const config_2 = require("../../util/config");
const types_1 = require("../../types");
const parsers_1 = require("../../parsers");
const fs_1 = require("../../util/fs");
exports.default = (cache, platformContext, store, configuration, secrets, logger, getScanView, getExistingReportView, signUpWebView) => {
    vscode.commands.registerTextEditorCommand("openapi.platform.editorRunSingleOperationScan", async (editor, edit, uri, path, method) => {
        try {
            await editorRunSingleOperationScan(signUpWebView, editor, cache, store, configuration, secrets, logger, getScanView, path, method);
        }
        catch (ex) {
            vscode.window.showErrorMessage((0, util_2.formatException)("Failed to scan:", ex));
        }
    });
    vscode.commands.registerCommand("openapi.outlineSingleOperationScan", async (node) => {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showErrorMessage("No active editor");
            return;
        }
        const { path, method } = (0, util_1.getPathAndMethod)(node);
        try {
            await editorRunSingleOperationScan(signUpWebView, vscode.window.activeTextEditor, cache, store, configuration, secrets, logger, getScanView, path, method);
        }
        catch (ex) {
            vscode.window.showErrorMessage((0, util_2.formatException)("Failed to scan:", ex));
        }
    });
    vscode.commands.registerTextEditorCommand("openapi.platform.editorRunFirstOperationScan", async (editor, edit) => {
        const parsed = cache.getParsedDocument(editor.document);
        const supportedVersions = [types_1.OpenApiVersion.V2, types_1.OpenApiVersion.V3, types_1.OpenApiVersion.V3_1];
        if (supportedVersions.includes((0, parsers_1.getOpenApiVersion)(parsed))) {
            const oas = parsed;
            const firstPath = Object.keys(oas.paths || {})[0];
            if (firstPath === undefined) {
                return undefined;
            }
            const firstMethod = Object.keys(oas.paths?.[firstPath] || {})[0];
            if (firstMethod === undefined) {
                return undefined;
            }
            try {
                await editorRunSingleOperationScan(signUpWebView, editor, cache, store, configuration, secrets, logger, getScanView, firstPath, firstMethod);
            }
            catch (ex) {
                vscode.window.showErrorMessage((0, util_2.formatException)("Failed to scan:", ex));
            }
        }
    });
    vscode.commands.registerTextEditorCommand("openapi.platform.editorOpenScanconfig", async (editor, edit) => {
        await editorOpenScanconfig(editor);
    });
    vscode.commands.registerTextEditorCommand("openapi.platform.exportScanReport", async (editor, edit) => {
        const view = getExistingReportView(editor.document.uri);
        if (view === undefined) {
            vscode.window.showErrorMessage("No scan report found for the current document.");
            return;
        }
        const destination = await vscode.window.showSaveDialog({
            filters: { JSON: ["json"] },
        });
        if (destination !== undefined) {
            await view.exportReport(destination);
        }
    });
};
async function editorRunSingleOperationScan(signUpView, editor, cache, store, configuration, secrets, logger, getScanView, path, method) {
    if (!(await (0, credentials_1.ensureHasCredentials)(signUpView, configuration, secrets))) {
        return;
    }
    // run single operation scan creates the scan config and displays the scan view
    // actual execution of the scan triggered from the scan view
    const config = await (0, config_2.loadConfig)(configuration, secrets);
    // free users and platform users who chose to use CLI for scan must have CLI available
    if ((config.platformAuthType === "anond-token" ||
        (config.platformAuthType === "api-token" && config.scanRuntime === "cli")) &&
        !(await (0, cli_ast_1.ensureCliDownloaded)(configuration, secrets))) {
        // cli is not available and user chose to cancel download
        vscode.window.showErrorMessage("42Crunch API Security Testing Binary is required to run Scan.");
        return;
    }
    const bundle = await cache.getDocumentBundle(editor.document);
    if (!bundle || "errors" in bundle) {
        vscode.commands.executeCommand("workbench.action.problems.focus");
        vscode.window.showErrorMessage("Failed to bundle, check OpenAPI file for errors.");
        return;
    }
    const title = bundle?.value?.info?.title || "OpenAPI";
    const scanconfUri = await (0, config_1.getOrCreateScanconfUri)(editor.document.uri, title);
    if ((scanconfUri === undefined || !(await (0, fs_1.existsUri)(scanconfUri))) &&
        !(await createDefaultScanConfig(editor.document, store, cache, secrets, logger, config.platformAuthType, config.scanRuntime, config.cliDirectoryOverride, scanconfUri, bundle))) {
        return;
    }
    const view = await getScanView(editor.document.uri);
    return view.sendScanOperation(bundle, editor.document, scanconfUri, path, method);
}
async function createDefaultScanConfig(document, store, cache, secrets, logger, platformAuthType, scanRuntime, cliDirectoryOverride, scanconfUri, bundle) {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Creating scan configuration...",
        cancellable: false,
    }, async (progress, cancellationToken) => {
        try {
            const oas = (0, preserving_json_yaml_parser_1.stringify)(bundle.value);
            const config = await (0, config_2.loadConfig)(configuration_1.configuration, secrets);
            if (platformAuthType === "anond-token") {
                // free users must use CLI for scan, there is no need to fallback to anond for initial audit
                // if there is no CLI available, they will not be able to run scan or create a scan config in any case
                await (0, cli_ast_1.createScanConfigWithCliBinary)(scanconfUri, oas, cliDirectoryOverride, logger);
            }
            else {
                if (scanRuntime === "cli") {
                    await (0, cli_ast_1.createScanConfigWithCliBinary)(scanconfUri, oas, cliDirectoryOverride, logger);
                }
                else {
                    // this will run audit on the platform as well
                    await (0, platform_1.createScanConfigWithPlatform)(store, scanconfUri, oas);
                }
            }
            vscode.window.showInformationMessage(`Saved API Conformance Scan configuration to: ${scanconfUri.toString()}`);
            return true;
        }
        catch (e) {
            vscode.window.showErrorMessage("Failed to create default config, please run Audit to check your OpenAPI for errors: " +
                ("message" in e ? e.message : e.toString()));
            return false;
        }
    });
}
async function editorOpenScanconfig(editor) {
    const scanconfUri = await (0, config_1.getScanconfUri)(editor.document.uri);
    if (scanconfUri === undefined || !(await (0, fs_1.existsUri)(scanconfUri))) {
        await vscode.window.showErrorMessage("No scan configuration found for the current document. Please create one first by running a scan.", { modal: true });
        return undefined;
    }
    await vscode.window.showTextDocument(scanconfUri);
}
//# sourceMappingURL=commands.js.map