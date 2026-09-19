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
exports.ConfigWebView = void 0;
const vscode = __importStar(require("vscode"));
const undici_1 = require("undici");
const web_view_1 = require("../../web-view");
const scandManagerApi = __importStar(require("../../../platform/api-scand-manager"));
const config_1 = require("../../../util/config");
const cli_ast_1 = require("../../../platform/cli-ast");
const utils_gen_1 = require("./utils-gen");
const cli_ast_update_1 = require("../../../platform/cli-ast-update");
const http_handler_1 = require("../../http-handler");
class ConfigWebView extends web_view_1.WebView {
    constructor(extensionPath, configuration, secrets, platform, logger) {
        super(extensionPath, "config", "Settings", vscode.ViewColumn.One);
        this.configuration = configuration;
        this.secrets = secrets;
        this.platform = platform;
        this.logger = logger;
        this.hostHandlers = {
            saveConfig: async (config) => {
                await (0, config_1.saveConfig)(config, this.configuration, this.secrets);
                this.config = await (0, config_1.loadConfig)(this.configuration, this.secrets);
                return {
                    command: "loadConfig",
                    payload: this.config,
                };
            },
            testOverlordConnection: async () => {
                const services = this.config?.platformServices.source === "auto"
                    ? this.config?.platformServices.auto
                    : this.config?.platformServices.manual;
                if (services === undefined || services === "") {
                    return {
                        command: "showOverlordConnectionTest",
                        payload: { success: false, message: "Services host is not configured" },
                    };
                }
                const result = await http2Ping(`https://${services}`, this.logger);
                return {
                    command: "showOverlordConnectionTest",
                    payload: result,
                };
            },
            testPlatformConnection: async () => {
                if (this.config === undefined) {
                    return {
                        command: "showPlatformConnectionTest",
                        payload: { success: false, message: "no credentials" },
                    };
                }
                const credentials = {
                    platformUrl: this.config.platformUrl,
                    apiToken: this.config.platformApiToken,
                    services: "",
                };
                const result = await this.platform.testConnection(credentials, this.logger);
                return { command: "showPlatformConnectionTest", payload: result };
            },
            testScandManagerConnection: async () => {
                const scandManager = this.config?.scandManager;
                if (scandManager === undefined || scandManager.url === "") {
                    return {
                        command: "showScandManagerConnectionTest",
                        payload: { success: false, message: "no scand manager confguration" },
                    };
                }
                const result = await scandManagerApi.testConnection(scandManager, this.logger);
                return {
                    command: "showScandManagerConnectionTest",
                    payload: result,
                };
            },
            testCli: async () => {
                const result = await (0, cli_ast_1.testCli)(this.config.cliDirectoryOverride);
                // if the binary was found, check for updates
                // otherwise the download button will be shown in the web UI
                if (result.success) {
                    (0, cli_ast_1.checkForCliUpdate)(this.config.repository, this.config.cliDirectoryOverride);
                }
                return {
                    command: "showCliTest",
                    payload: result,
                };
            },
            downloadCli: () => downloadCliHandler(this.config.repository, this.config.cliDirectoryOverride),
            openLink: async (url) => {
                // @ts-ignore
                // workaround for vscode https://github.com/microsoft/vscode/issues/85930
                vscode.env.openExternal(url);
            },
            sendHttpRequest: ({ id, request, config }) => (0, http_handler_1.executeHttpRequest)(id, request, config),
        };
        vscode.window.onDidChangeActiveColorTheme((e) => {
            if (this.isActive()) {
                this.sendColorTheme(e);
            }
        });
    }
    async onStart() {
        await this.sendColorTheme(vscode.window.activeColorTheme);
        this.config = await (0, config_1.loadConfig)(this.configuration, this.secrets);
        if (this.platform.isConnected()) {
            try {
                // this could throw if the token has become invalid since the start
                const convention = await this.platform.getCollectionNamingConvention();
                if (convention.pattern !== "") {
                    this.config.platformCollectionNamingConvention = convention;
                }
            }
            catch (ex) {
                // can't get naming convention if the token is invalid
            }
        }
        await this.sendRequest({
            command: "loadConfig",
            payload: this.config,
        });
    }
    async showConfig() {
        await this.show();
    }
}
exports.ConfigWebView = ConfigWebView;
async function* downloadCliHandler(repository, cliDirectoryOverride) {
    try {
        if (repository === undefined || repository === "") {
            throw new Error("Repository URL is not set");
        }
        const manifest = await (0, cli_ast_update_1.getCliUpdate)(repository, "0.0.0");
        if (manifest === undefined) {
            throw new Error("Failed to download 42Crunch API Security Testing Binary, manifest not found");
        }
        const location = yield* (0, utils_gen_1.transformValues)((0, cli_ast_1.downloadCli)(manifest, cliDirectoryOverride), (progress) => ({
            command: "showCliDownload",
            payload: { completed: false, progress },
        }));
        yield {
            command: "showCliDownload",
            payload: {
                completed: true,
                success: true,
                location,
            },
        };
    }
    catch (ex) {
        yield {
            command: "showCliDownload",
            payload: {
                completed: true,
                success: false,
                error: `Failed to download: ${ex}`,
            },
        };
    }
}
async function http2Ping(url, logger) {
    const timeout = 5000;
    let hasTimedOut = false;
    logger.info(`Starting connection test to ${url} with timeout of ${timeout}ms`);
    const controller = new AbortController();
    const timer = setTimeout(() => {
        hasTimedOut = true;
        logger.error(`Connection test timed out after ${timeout}ms`);
        controller.abort();
    }, timeout);
    try {
        const agent = new undici_1.Agent({ allowH2: true });
        const response = await fetch(url, {
            dispatcher: agent,
            method: "GET",
            signal: controller.signal,
        });
        logger.info(`Received response from ${url}, status code: ${response.status}`);
        logger.debug(`Response headers: ${JSON.stringify(response.headers)}`);
        if (response.status === 415) {
            logger.info("Connection test succeeded");
            return { success: true };
        }
        else {
            logger.error(`Connection test failed with unexpected status code: ${response.status}`);
            return { success: false, message: `Unexpected response status: ${response.status}` };
        }
    }
    catch (error) {
        logger.error(`Failed to connect to ${url}: ${error.message}`);
        clearTimeout(timer);
        if (error.name === "AbortError" && hasTimedOut) {
            return {
                success: false,
                message: `Timed out waiting to connect after ${timeout}ms`,
            };
        }
        else {
            return {
                success: false,
                message: `Failed to connect to ${url}: ${formatError(error)}`,
            };
        }
    }
}
function formatError(error, depth = 0) {
    if (depth > 5 || !error)
        return "Unknown error";
    if (typeof error === "string")
        return error;
    let message = error.message || error.name || String(error);
    // Handle aggregate errors
    if (error.errors?.length > 0) {
        const nested = error.errors.map((e) => formatError(e, depth + 1)).join("; ");
        message = message ? `${message}: ${nested}` : nested;
    }
    // Handle error cause
    if (error.cause) {
        const cause = formatError(error.cause, depth + 1);
        if (cause)
            message += ` (caused by: ${cause})`;
    }
    return message || "Unknown error";
}
//# sourceMappingURL=view.js.map