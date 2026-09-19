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
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const provider_1 = require("./explorer/provider");
const types_1 = require("./types");
const commands_1 = require("./commands");
const favorites_store_1 = require("./stores/favorites-store");
const imported_url_store_1 = require("./stores/imported-url-store");
const fs_provider_1 = require("./fs-provider");
const util_1 = require("./util");
const codelens_1 = require("./codelens");
const audit_1 = require("./audit");
const view_1 = require("./data-dictionary/view");
const completion_1 = require("./data-dictionary/completion");
const code_actions_1 = require("./data-dictionary/code-actions");
const linter_1 = require("./data-dictionary/linter");
const activate_1 = require("./scan/activate");
const view_2 = require("../webapps/views/tags/view");
async function activate(context, auditContext, cache, configuration, secrets, store, signUpWebView, reportWebView, memento, envStore, prefs, logger) {
    const dataDictionaryView = new view_1.DataDictionaryWebView(context.extensionPath);
    const platformContext = {
        context,
        memento,
    };
    const favoriteCollections = new favorites_store_1.FavoritesStore(context, store);
    const importedUrls = new imported_url_store_1.ImportedUrlStore(context);
    const platformFs = new fs_provider_1.PlatformFS(store);
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(types_1.platformUriScheme, platformFs, {
        isCaseSensitive: true,
    }));
    const provider = new provider_1.CollectionsProvider(store, favoriteCollections, context.extensionUri);
    const tree = vscode.window.createTreeView("platformExplorer", {
        treeDataProvider: provider,
    });
    store.onConnectionDidChange(({ credentials }) => vscode.commands.executeCommand("setContext", "openapi.platform.credentials", credentials ? "present" : "missing"));
    // TODO unsubscribe?
    const selectors = {
        json: { language: "json" },
        jsonc: { language: "jsonc" },
        yaml: { language: "yaml" },
    };
    const dataDictionaryDiagnostics = vscode.languages.createDiagnosticCollection("data-dictionary");
    const completionProvider = new completion_1.DataDictionaryCompletionProvider(store);
    for (const selector of Object.values(selectors)) {
        vscode.languages.registerCompletionItemProvider(selector, completionProvider, ":");
    }
    const codeActionsProvider = new code_actions_1.DataDictionaryCodeActions(cache, store, dataDictionaryDiagnostics);
    for (const selector of Object.values(selectors)) {
        vscode.languages.registerCodeActionsProvider(selector, codeActionsProvider, {
            providedCodeActionKinds: code_actions_1.DataDictionaryCodeActions.providedCodeActionKinds,
        });
    }
    (0, activate_1.activate)(context, platformContext, cache, logger, configuration, secrets, store, envStore, prefs, signUpWebView, reportWebView, auditContext);
    (0, linter_1.activate)(cache, platformContext, store, dataDictionaryDiagnostics);
    const disposable1 = vscode.workspace.onDidSaveTextDocument((document) => (0, audit_1.refreshAuditReport)(store, cache, auditContext, document));
    const disposable2 = vscode.workspace.onDidOpenTextDocument((document) => (0, audit_1.refreshAuditReport)(store, cache, auditContext, document));
    const disposable3 = vscode.workspace.onDidSaveTextDocument((document) => {
        if ((0, util_1.isPlatformUri)(document.uri)) {
            // when API is saved, it's score might change so we need to refresh
            // explorer that shows API score
            vscode.commands.executeCommand("openapi.platform.refreshCollections");
        }
    });
    const tagsWebView = new view_2.TagsWebView(context.extensionPath, memento, configuration, secrets, store, logger);
    (0, commands_1.registerCommands)(context, platformContext, auditContext, secrets, store, favoriteCollections, importedUrls, cache, logger, provider, tree, reportWebView, tagsWebView, signUpWebView, dataDictionaryView, dataDictionaryDiagnostics);
    vscode.languages.registerCodeLensProvider([
        { scheme: types_1.platformUriScheme, language: "json" },
        { scheme: types_1.platformUriScheme, language: "jsonc" },
    ], new codelens_1.CodelensProvider(store));
    vscode.languages.registerCodeLensProvider([
        { scheme: "file", language: "json" },
        { scheme: "file", language: "jsonc" },
        { scheme: "file", language: "yaml" },
    ], new codelens_1.PlatformTagCodelensProvider(cache, configuration, secrets, memento));
}
//# sourceMappingURL=activate.js.map