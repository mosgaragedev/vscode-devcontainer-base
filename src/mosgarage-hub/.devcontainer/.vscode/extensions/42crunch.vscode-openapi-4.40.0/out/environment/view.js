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
exports.EnvironmentWebView = void 0;
const vscode = __importStar(require("vscode"));
const web_view_1 = require("../webapps/web-view");
class EnvironmentWebView extends web_view_1.WebView {
    constructor(extensionPath, envStore) {
        super(extensionPath, "environment", "Environment", vscode.ViewColumn.Two);
        this.envStore = envStore;
        this.hostHandlers = {
            saveEnv: async (env) => {
                this.envStore.save(env);
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
    }
    async onStart() {
        await this.sendColorTheme(vscode.window.activeColorTheme);
        await this.sendRequest({ command: "loadEnv", payload: await this.envStore.all() });
    }
    async showEnvironment() {
        await this.show();
    }
}
exports.EnvironmentWebView = EnvironmentWebView;
//# sourceMappingURL=view.js.map