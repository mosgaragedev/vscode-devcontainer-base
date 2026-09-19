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
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const semver = __importStar(require("semver"));
const configuration_1 = require("./configuration");
const types_1 = require("./types");
const parser_options_1 = require("./parser-options");
const outline_1 = require("./outline");
const reference_1 = require("./reference");
const external_refs_1 = require("./external-refs");
const completion_1 = require("./completion");
const context_1 = require("./context");
const commands_1 = require("./commands");
const whatsnew_1 = require("./whatsnew");
const cache_1 = require("./cache");
const view_1 = require("./audit/view");
const yamlSchemaContributor = __importStar(require("./yaml-schema-contributor"));
const audit = __importStar(require("./audit/activate"));
const preview = __importStar(require("./preview"));
const platform = __importStar(require("./platform/activate"));
const tryit = __importStar(require("./tryit/activate"));
const environment = __importStar(require("./environment/activate"));
const config = __importStar(require("./webapps/views/config/activate"));
const platform_store_1 = require("./platform/stores/platform-store");
const credentials_1 = require("./credentials");
const envstore_1 = require("./envstore");
const debounce_1 = require("./util/debounce");
const config_1 = require("./util/config");
const view_2 = require("./webapps/signup/view");
const auditContext = {
    auditsByMainDocument: {},
    auditsByDocument: {},
    decorations: {},
    diagnostics: undefined,
    auditTempDirectories: {},
};
async function activate(context) {
    const versionProperty = "openapiVersion";
    const openapiExtension = vscode.extensions.getExtension(types_1.extensionQualifiedId);
    const currentVersion = semver.parse(openapiExtension.packageJSON.version);
    const previousVersion = context.globalState.get(versionProperty)
        ? semver.parse(context.globalState.get(versionProperty))
        : semver.parse("0.0.1");
    const yamlConfiguration = new configuration_1.Configuration("yaml");
    context.globalState.update(versionProperty, currentVersion.toString());
    parser_options_1.parserOptions.configure(yamlConfiguration);
    const logOutputChannel = vscode.window.createOutputChannel(openapiExtension.packageJSON.displayName, { log: true });
    const logger = {
        fatal: (message) => logOutputChannel.error(message),
        error: (message) => logOutputChannel.error(message),
        warning: (message) => logOutputChannel.warn(message),
        info: (message) => logOutputChannel.info(message),
        debug: (message) => logOutputChannel.debug(message),
    };
    const selectors = {
        json: { language: "json" },
        jsonc: { language: "jsonc" },
        yaml: { language: "yaml" },
    };
    const externalRefProvider = new external_refs_1.ExternalRefDocumentProvider(context.secrets);
    vscode.workspace.registerTextDocumentContentProvider(external_refs_1.INTERNAL_SCHEMES.http, externalRefProvider);
    vscode.workspace.registerTextDocumentContentProvider(external_refs_1.INTERNAL_SCHEMES.https, externalRefProvider);
    const cache = new cache_1.Cache(parser_options_1.parserOptions, Object.values(selectors), externalRefProvider);
    context.subscriptions.push(cache);
    cache.onDidActiveDocumentChange((document) => (0, context_1.updateContext)(cache, document));
    context.subscriptions.push(...(0, outline_1.registerOutlines)(context, cache));
    context.subscriptions.push(...(0, commands_1.registerCommands)(cache));
    context.subscriptions.push((0, external_refs_1.registerAddApprovedHost)(context));
    const completionProvider = new completion_1.CompletionItemProvider(context, cache);
    for (const selector of Object.values(selectors)) {
        vscode.languages.registerCompletionItemProvider(selector, completionProvider, "#", "'", '"');
    }
    const jsonSchemaDefinitionProvider = new reference_1.JsonSchemaDefinitionProvider(cache, externalRefProvider);
    const yamlSchemaDefinitionProvider = new reference_1.YamlSchemaDefinitionProvider(cache, externalRefProvider, parser_options_1.parserOptions);
    vscode.languages.registerDefinitionProvider(selectors.json, jsonSchemaDefinitionProvider);
    vscode.languages.registerDefinitionProvider(selectors.jsonc, jsonSchemaDefinitionProvider);
    vscode.languages.registerDefinitionProvider(selectors.yaml, yamlSchemaDefinitionProvider);
    const approveHostnameAction = new external_refs_1.ApproveHostnameAction();
    for (const selector of Object.values(selectors)) {
        vscode.languages.registerCodeActionsProvider(selector, approveHostnameAction, {
            providedCodeActionKinds: external_refs_1.ApproveHostnameAction.providedCodeActionKinds,
        });
    }
    vscode.window.onDidChangeActiveTextEditor((e) => cache.onActiveEditorChanged(e));
    vscode.workspace.onDidChangeTextDocument((e) => cache.onDocumentChanged(e));
    yamlSchemaContributor.activate(context, cache, configuration_1.configuration);
    auditContext.auditsByMainDocument = {};
    auditContext.auditsByDocument = {};
    auditContext.decorations = {};
    auditContext.diagnostics = vscode.languages.createDiagnosticCollection("audits");
    auditContext.auditTempDirectories = {};
    const platformStore = new platform_store_1.PlatformStore(configuration_1.configuration, logger);
    const envStore = new envstore_1.EnvStore(context.workspaceState, context.secrets);
    const prefs = {};
    const signUpWebView = new view_2.SignUpWebView(context.extensionPath, configuration_1.configuration, context.secrets, platformStore, logger);
    const reportWebView = new view_1.AuditWebView(context.extensionPath, cache, configuration_1.configuration);
    audit.activate(context, auditContext, cache, logger, configuration_1.configuration, signUpWebView, reportWebView, platformStore);
    preview.activate(context, cache, configuration_1.configuration);
    tryit.activate(context, cache, configuration_1.configuration, envStore, prefs);
    environment.activate(context, envStore);
    config.activate(context, configuration_1.configuration, context.secrets, platformStore, logger);
    await platform.activate(context, auditContext, cache, configuration_1.configuration, context.secrets, platformStore, signUpWebView, reportWebView, context.workspaceState, envStore, prefs, logger);
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(xliic-icon)";
    statusBarItem.command = "openapi.showSettings";
    statusBarItem.tooltip = "42Crunch Settings";
    statusBarItem.show();
    if (previousVersion.major < currentVersion.major) {
        (0, whatsnew_1.create)(context);
    }
    configuration_1.configuration.configure(context);
    yamlConfiguration.configure(context);
    if (vscode.window.activeTextEditor) {
        cache.onActiveEditorChanged(vscode.window.activeTextEditor);
    }
    const reloadCredentials = (0, debounce_1.debounce)(async () => {
        const credentials = await (0, credentials_1.hasCredentials)(configuration_1.configuration, context.secrets);
        if (credentials === "api-token") {
            platformStore.setCredentials(await (0, credentials_1.getPlatformCredentials)(configuration_1.configuration, context.secrets));
        }
        else {
            platformStore.setCredentials(undefined);
        }
    }, { delay: 3000 });
    configuration_1.configuration.onDidChange(async (e) => {
        if (configuration_1.configuration.changed(e, "platformAuthType") ||
            configuration_1.configuration.changed(e, "securityAuditToken") ||
            configuration_1.configuration.changed(e, "platformUrl") ||
            configuration_1.configuration.changed(e, "platformServices") ||
            configuration_1.configuration.changed(e, "scandManagerUrl") ||
            configuration_1.configuration.changed(e, "scandManagerHeaderName") ||
            configuration_1.configuration.changed(e, "scandManagerHeaderValue")) {
            reloadCredentials();
        }
    });
    context.secrets.onDidChange(async (e) => {
        if (e.key === "platformApiToken") {
            reloadCredentials();
        }
    });
    let approvedHostnames = (0, config_1.getApprovedHostnamesTrimmedLowercase)(configuration_1.configuration);
    const cleanupSecrets = (0, debounce_1.debounce)(async () => {
        const updatedApprovedHostnames = (0, config_1.getApprovedHostnamesTrimmedLowercase)(configuration_1.configuration);
        await (0, config_1.removeSecretsForApprovedHosts)(context.secrets, approvedHostnames.filter((name) => !updatedApprovedHostnames.includes(name)));
        approvedHostnames = updatedApprovedHostnames;
    }, { delay: 3000 });
    configuration_1.configuration.onDidChange(async (e) => {
        if (configuration_1.configuration.changed(e, "approvedHostnames")) {
            cleanupSecrets();
        }
    });
    await reloadCredentials();
}
async function deactivate() {
    await audit.deactivate(auditContext);
}
//# sourceMappingURL=extension.js.map