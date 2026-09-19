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
exports.ScanWebView = void 0;
exports.replaceEnvOld = replaceEnvOld;
const util_1 = require("util");
const vscode = __importStar(require("vscode"));
const preserving_json_yaml_parser_1 = require("@xliic/preserving-json-yaml-parser");
const config_1 = require("../../util/config");
const web_view_1 = require("../../webapps/web-view");
const http_handler_1 = require("../../webapps/http-handler");
const cli_ast_1 = require("../cli-ast");
const docker_1 = require("./runtime/docker");
const scand_manager_1 = require("./runtime/scand-manager");
const upgrade_1 = require("../upgrade");
const util_2 = require("../util");
const platform_1 = require("./runtime/platform");
const fs_1 = require("../../util/fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
class ScanWebView extends web_view_1.WebView {
    constructor(title, extensionPath, cache, logger, configuration, secrets, store, envStore, prefs, auditView, getReportView, auditContext) {
        super(extensionPath, "scanconf", title, vscode.ViewColumn.One, "eye");
        this.cache = cache;
        this.logger = logger;
        this.configuration = configuration;
        this.secrets = secrets;
        this.store = store;
        this.envStore = envStore;
        this.prefs = prefs;
        this.auditView = auditView;
        this.getReportView = getReportView;
        this.auditContext = auditContext;
        this.hostHandlers = {
            saveScanconf: async (scanconf) => {
                try {
                    const encoder = new util_1.TextEncoder();
                    await vscode.workspace.fs.writeFile(this.target.scanconfUri, encoder.encode(scanconf));
                }
                catch (e) {
                    throw new Error("Failed to save scan configuration:" + e);
                }
            },
            savePrefs: async (prefs) => {
                if (this.target) {
                    const uri = this.target.document.uri.toString();
                    this.prefs[uri] = {
                        ...this.prefs[uri],
                        ...prefs,
                    };
                }
            },
            runScan: async ({ path, method, operationId, env, scanconf }) => {
                try {
                    const config = await (0, config_1.loadConfig)(this.configuration, this.secrets);
                    const reportView = await this.getReportView();
                    await reportView.showReport(this.target.document);
                    return await runScan(this.secrets, this.store, this.envStore, env, this.target.bundle, path, method, scanconf, config, makeAggregateLogger(this.logger, reportView), reportView, false);
                }
                catch (ex) {
                    const message = ex?.response?.statusCode === 409 &&
                        ex?.response?.body?.code === 109 &&
                        ex?.response?.body?.message === "limit reached"
                        ? "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
                        : (0, util_2.formatException)("Failed to run scan:", ex);
                    vscode.window.showErrorMessage(message);
                }
            },
            runFullScan: async ({ env, scanconf }) => {
                try {
                    const config = await (0, config_1.loadConfig)(this.configuration, this.secrets);
                    const reportView = await this.getReportView();
                    await reportView.showReport(this.target.document);
                    return await runScan(this.secrets, this.store, this.envStore, env, this.target.bundle, undefined, undefined, scanconf, config, makeAggregateLogger(this.logger, reportView), reportView, true);
                }
                catch (ex) {
                    const message = ex?.response?.statusCode === 409 &&
                        ex?.response?.body?.code === 109 &&
                        ex?.response?.body?.message === "limit reached"
                        ? "You have reached your maximum number of APIs. Please contact support@42crunch.com to upgrade your account."
                        : (0, util_2.formatException)("Failed to run scan:", ex);
                    vscode.window.showErrorMessage(message);
                }
            },
            sendHttpRequest: ({ id, request, config }) => (0, http_handler_1.executeHttpRequest)(id, request, config),
            showEnvWindow: async () => {
                vscode.commands.executeCommand("openapi.showEnvironment");
            },
            openLink: async (url) => {
                vscode.env.openExternal(vscode.Uri.parse(url));
            },
            updateScanconf: async () => {
                try {
                    const config = await (0, config_1.loadConfig)(this.configuration, this.secrets);
                    const stringOas = (0, preserving_json_yaml_parser_1.stringify)(this.target.bundle.value);
                    const scanconf = config.scanRuntime === "cli"
                        ? await (0, cli_ast_1.createDefaultConfigWithCliBinary)(stringOas, config.cliDirectoryOverride, this.logger)
                        : await (0, platform_1.createDefaultConfigWithPlatform)(this.store, stringOas);
                    await (0, cli_ast_1.backupConfig)(this.target.scanconfUri);
                    this.sendRequest({
                        command: "loadUpdatedScanconf",
                        payload: { oas: this.target.bundle.value, scanconf },
                    });
                }
                catch (error) {
                    this.sendRequest({
                        command: "showGeneralError",
                        payload: { message: `Failed to generate default scanconf: ${error.message}` },
                    });
                }
            },
        };
        envStore.onEnvironmentDidChange((env) => {
            if (this.isActive()) {
                this.sendRequest({
                    command: "loadEnv",
                    payload: { default: undefined, secrets: undefined, [env.name]: env.environment },
                });
            }
        });
        vscode.window.onDidChangeActiveColorTheme((e) => {
            if (this.isActive()) {
                this.sendColorTheme(e);
            }
        });
    }
    async onStart() {
        await this.sendColorTheme(vscode.window.activeColorTheme);
        if (this.target) {
            await this.sendLoadConfig();
            await this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
            const prefs = this.prefs[this.target.document.uri.toString()];
            if (prefs) {
                await this.sendRequest({ command: "loadPrefs", payload: prefs });
            }
            const content = await vscode.workspace.fs.readFile(this.target.scanconfUri);
            const scanconf = new util_1.TextDecoder("utf-8").decode(content);
            await this.sendRequest({
                command: "showScanconfOperation",
                payload: {
                    oas: this.target.bundle.value,
                    path: this.target.path,
                    method: this.target.method,
                    scanconf,
                },
            });
        }
    }
    async onDispose() {
        await super.onDispose();
    }
    async sendScanOperation(bundle, document, scanconfUri, path, method) {
        this.target = {
            bundle,
            document,
            documentUri: document.uri.toString(),
            documentVersion: document.version,
            versions: getBundleVersions(bundle),
            scanconfUri,
            method,
            path,
        };
        await this.show();
    }
    async sendLoadConfig() {
        const config = await (0, config_1.loadConfig)(this.configuration, this.secrets);
        this.sendRequest({
            command: "loadConfig",
            payload: config,
        });
    }
    async sendLogMessage(message, level) { }
}
exports.ScanWebView = ScanWebView;
function makeAggregateLogger(logger, view) {
    return {
        debug: (message) => {
            logger.debug(message);
            // do not send debug messages to the view
        },
        info: (message) => {
            logger.info(message);
            view.sendLogMessage(message, "info");
        },
        warning: (message) => {
            logger.warning(message);
            view.sendLogMessage(message, "warning");
        },
        error: (message) => {
            logger.error(message);
            view.sendLogMessage(message, "error");
        },
        fatal: (message) => {
            logger.fatal(message);
            view.sendLogMessage(message, "fatal");
        },
    };
}
async function runScan(secrets, store, envStore, scanEnv, bundle, path, method, scanconf, config, logger, reportView, isFullScan) {
    logger.info(`Starting API Conformance Scan`);
    const stringOas = (0, preserving_json_yaml_parser_1.stringify)(bundle.value);
    try {
        if (config.platformAuthType === "anond-token" ||
            (config.platformAuthType === "api-token" && config.scanRuntime === "cli")) {
            const [validateReport, validateError] = await (0, cli_ast_1.runValidateScanConfigWithCliBinary)(secrets, envStore, scanEnv, config, logger, stringOas, scanconf, config.cliDirectoryOverride);
            if (validateError !== undefined) {
                throw new Error(`Unexpected error running scan config validation: ${JSON.stringify(validateError)}`);
            }
            if (validateReport.report.errors?.length) {
                await reportView.sendLogMessage("Scan configuration has failed validation", "error");
                for (const message of validateReport.report.errors) {
                    await reportView.sendLogMessage(message, "error");
                }
                await reportView.sendLogMessage("Please fix the scan configuration and try again", "error");
                return;
            }
            const [result, error] = await (0, cli_ast_1.runScanWithCliBinary)(secrets, scanEnv, config, logger, stringOas, scanconf, isFullScan);
            if (error !== undefined) {
                if (error.statusCode === 3 && error.statusMessage === "limits_reached") {
                    await (0, upgrade_1.offerUpgrade)(isFullScan);
                    return;
                }
                else {
                    throw new Error(`Unexpected error running API Conformance Scan: ${JSON.stringify(error)}`);
                }
            }
            reportView.setTemporaryReportDirectory(result.tempScanDirectory);
            if (result.cli.remainingPerOperationScan !== undefined &&
                result.cli.remainingPerOperationScan < upgrade_1.UPGRADE_WARN_LIMIT) {
                (0, upgrade_1.warnOperationScans)(result.cli.remainingPerOperationScan);
            }
            if (result.cli.scanLogs) {
                for (const entry of result.cli.scanLogs) {
                    await reportView.sendLogMessage(entry.message, entry.level);
                }
            }
            await reportView.showScanReport(result.reportFilename);
        }
        else {
            const { token, tmpApi } = await createScanconfToken(store, stringOas, scanconf, logger);
            // fall back to docker if no anond token, and cli is configured
            const failure = config.scanRuntime === "scand-manager"
                ? await (0, scand_manager_1.runScanWithScandManager)(envStore, scanEnv, config, logger, token)
                : await (0, docker_1.runScanWithDocker)(envStore, scanEnv, config, logger, token);
            if (failure !== undefined) {
                // cleanup
                try {
                    await store.clearTempApi(tmpApi);
                }
                catch (ex) {
                    console.log(`Failed to cleanup temp api ${tmpApi.apiId}: ${ex}`);
                }
                reportView.showGeneralError(failure);
                return;
            }
            const parsedReport = await loadReport(store, tmpApi, logger);
            await store.clearTempApi(tmpApi);
            logger.info(`Finished API API Conformance Scan`);
            if (parsedReport === undefined) {
                reportView.showGeneralError({ message: `Failed to load Scan report` });
                return;
            }
            // save report to a temporary directory
            const tempDir = (0, fs_1.createTempDirectory)("scan-report");
            const reportFilename = (0, path_1.join)(tempDir, "report.json");
            await (0, promises_1.writeFile)(reportFilename, JSON.stringify(parsedReport));
            reportView.setTemporaryReportDirectory(tempDir);
            await reportView.showScanReport(reportFilename);
        }
    }
    catch (e) {
        await reportView.showGeneralError({ message: "Failed to execute scan: " + e.message });
    }
}
async function waitForReport(store, apiId, maxDelay) {
    let currentDelay = 0;
    while (currentDelay < maxDelay) {
        const reports = await store.listScanReports(apiId);
        if (reports.length > 0) {
            return reports[0].report.taskId;
        }
        console.log("Waiting for report to become available");
        await delay(1000);
        currentDelay = currentDelay + 1000;
    }
    console.log("Failed to read report");
    return undefined;
}
async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function replaceEnvOld(value, env) {
    const ENV_VAR_REGEX = /{{([\w\-$]+)}}/;
    const SECRETS_PREFIX = "secrets.";
    return value.replace(ENV_VAR_REGEX, (match, name) => {
        if (name.startsWith(SECRETS_PREFIX)) {
            const key = name.substring(SECRETS_PREFIX.length, name.length);
            return env.secrets.hasOwnProperty(key) ? env.secrets[key] : match;
        }
        return env.default.hasOwnProperty(name) ? env.default[name] : match;
    });
}
function getBundleVersions(bundle) {
    const versions = {
        [bundle.document.uri.toString()]: bundle.document.version,
    };
    bundle.documents.forEach((document) => {
        versions[document.uri.toString()] = document.version;
    });
    return versions;
}
async function loadReport(store, tmpApi, logger) {
    const reportId = await waitForReport(store, tmpApi.apiId, 300000);
    if (reportId !== undefined) {
        const report = await store.readScanReportNew(reportId);
        const parsedReport = JSON.parse(Buffer.from(report, "base64").toString("utf-8"));
        return parsedReport;
    }
}
async function createScanconfToken(store, oas, scanconf, logger) {
    const tmpApi = await store.createTempApi(oas);
    logger.info(`Created temp API "${tmpApi.apiId}", waiting for Security Audit`);
    const audit = await store.getAuditReport(tmpApi.apiId);
    if (audit?.data.openapiState !== "valid") {
        await store.clearTempApi(tmpApi);
        throw new Error("API has failed Security Audit");
    }
    logger.info(`Security Audit check is successful`);
    await store.createScanConfigNew(tmpApi.apiId, "updated", scanconf);
    const configs = await store.getScanConfigs(tmpApi.apiId);
    const c = await store.readScanConfig(configs[0].configuration.id);
    const token = c.token;
    return { token, tmpApi };
}
//# sourceMappingURL=view.js.map