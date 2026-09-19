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
exports.TryItWebView = void 0;
const vscode = __importStar(require("vscode"));
const web_view_1 = require("../webapps/web-view");
const http_handler_1 = require("./http-handler");
const create_schema_handler_1 = require("./create-schema-handler");
const extract_1 = require("../util/extract");
const config_1 = require("../util/config");
class TryItWebView extends web_view_1.WebView {
    constructor(extensionPath, cache, envStore, prefs, configuration, secrets) {
        super(extensionPath, "tryit", "Try It", vscode.ViewColumn.Two);
        this.cache = cache;
        this.envStore = envStore;
        this.prefs = prefs;
        this.configuration = configuration;
        this.secrets = secrets;
        this.hostHandlers = {
            sendHttpRequest: http_handler_1.executeHttpRequest,
            createSchema: async (response) => {
                if (this.target) {
                    (0, create_schema_handler_1.executeCreateSchemaRequest)(this.target.document, this.cache, response);
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
            showEnvWindow: async () => {
                vscode.commands.executeCommand("openapi.showEnvironment");
            },
            saveConfig: async (config) => {
                await (0, config_1.saveConfig)(config, this.configuration, this.secrets);
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
    getTarget() {
        return this.target;
    }
    async onStart() {
        await this.sendColorTheme(vscode.window.activeColorTheme);
        if (this.target && this.bundle) {
            await this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
            const prefs = this.prefs[this.target.document.uri.toString()];
            if (prefs) {
                await this.sendRequest({ command: "loadPrefs", payload: prefs });
            }
            await this.sendLoadConfig();
            const oas = (0, extract_1.extractSingleOperation)(this.target.method, this.target.path, this.bundle.value);
            await this.sendRequest({
                command: "tryOperation",
                payload: {
                    oas,
                    ...this.target,
                },
            });
        }
    }
    async onDispose() {
        this.target = undefined;
        await super.onDispose();
    }
    async showTryIt(bundle, target) {
        this.target = target;
        this.bundle = bundle;
        await this.show();
    }
    async updateTryIt(bundle, versions) {
        if (!this.target) {
            return;
        }
        this.target = { ...this.target, versions };
        const oas = (0, extract_1.extractSingleOperation)(this.target.method, this.target.path, bundle.value);
        return this.sendRequest({
            command: "tryOperation",
            payload: {
                oas,
                ...this.target,
            },
        });
    }
    async sendLoadConfig() {
        const config = await (0, config_1.loadConfig)(this.configuration, this.secrets);
        this.sendRequest({
            command: "loadConfig",
            payload: config,
        });
    }
}
exports.TryItWebView = TryItWebView;
//# sourceMappingURL=view.js.map