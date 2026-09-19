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
exports.WebView = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const theme_1 = require("@xliic/common/theme");
class WebView {
    constructor(extensionPath, viewId, viewTitle, column, icon) {
        this.extensionPath = extensionPath;
        this.viewId = viewId;
        this.viewTitle = viewTitle;
        this.column = column;
        this.icon = icon;
    }
    isActive() {
        return this.panel !== undefined;
    }
    async sendRequest(request) {
        if (this.panel) {
            await this.panel.webview.postMessage(request);
        }
        else {
            throw new Error(`Can't send message to ${this.viewId}, webview not initialized`);
        }
    }
    async sendColorTheme(theme) {
        const kindMap = {
            [vscode.ColorThemeKind.Light]: "light",
            [vscode.ColorThemeKind.Dark]: "dark",
            [vscode.ColorThemeKind.HighContrast]: "highContrast",
            [vscode.ColorThemeKind.HighContrastLight]: "highContrastLight",
        };
        this.sendRequest({ command: "changeTheme", payload: { kind: kindMap[theme.kind] } });
    }
    async handleResponse(response) {
        const handler = this.hostHandlers[response.command];
        if (handler) {
            const result = handler(response.payload);
            if (result instanceof Promise) {
                const request = await result;
                if (request !== undefined) {
                    this.sendRequest(request);
                }
            }
            else {
                for await (const request of result) {
                    this.sendRequest(request);
                }
            }
        }
        else {
            throw new Error(`Unable to find response handler for command: ${response.command} in ${this.viewId} webview`);
        }
    }
    async show() {
        return new Promise(async (resolve, reject) => {
            if (this.panel) {
                this.panel.reveal();
                await this.onStart();
                resolve();
                return;
            }
            // create the panel
            const panel = this.createPanel();
            panel.onDidDispose(() => {
                this.session = undefined;
                this.onDispose();
            });
            panel.webview.onDidReceiveMessage(async (message) => {
                if (this.session === undefined && message.command === "started" && message.payload) {
                    this.panel = panel;
                    this.session = message.payload;
                    await this.onStart();
                    resolve();
                }
                else {
                    this.handleResponse(message);
                }
            });
        });
    }
    dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
    }
    async onDispose() {
        this.panel = undefined;
    }
    createPanel() {
        const panel = vscode.window.createWebviewPanel(this.viewId, this.viewTitle, {
            viewColumn: this.column,
            preserveFocus: true,
        }, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        if (this.icon !== undefined) {
            panel.iconPath = {
                light: vscode.Uri.file(path.join(this.extensionPath, "resources", "icons", `${this.icon}.svg`)),
                dark: vscode.Uri.file(path.join(this.extensionPath, "resources", "icons", `${this.icon}-dark.svg`)),
            };
        }
        if (process.env["XLIIC_WEB_VIEW_DEV_MODE"] === "true") {
            panel.webview.html = this.getDevHtml(panel);
        }
        else {
            panel.webview.html = this.getProdHtml(panel);
        }
        return panel;
    }
    getDevHtml(panel) {
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"  content="default-src 'none';  img-src https: data: http://localhost:3000/; script-src http://localhost:3000/ 'unsafe-inline'; style-src http://localhost:3000/ 'unsafe-inline'; connect-src http: https: ws:">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <base href="http://localhost:3000/">
      <script type="module">
        import RefreshRuntime from "/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      </script>
      <script type="module" src="/@vite/client"></script>
      <style>
        ${customCssProperties()}
      </style>
    </head>
    <body>
    <div id="root"></div>
    <script type="module" src="/src/app/${this.viewId}/index.tsx"></script>
    <script>
      window.addEventListener("DOMContentLoaded", (event) => {
        const vscode = acquireVsCodeApi();
        const result = window.renderWebView({
          postMessage: (message) => {
            console.log('sending message', message);
            vscode.postMessage(message);
          }
        });
        if (!result?.skipAutoStart) {
          vscode.postMessage({command: "started", payload: crypto.randomUUID()});
        }
      });
    </script>
    </body>
    </html>`;
    }
    getProdHtml(panel) {
        const cspSource = panel.webview.cspSource;
        const script = panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, "webview", "generated", "web", `${this.viewId}.js`)));
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"  content="default-src 'none';  img-src ${cspSource} https: data:; script-src ${cspSource} 'unsafe-inline'; style-src ${cspSource}  'unsafe-inline'; connect-src http: https:">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style type="text/css">
        ${customCssProperties()}
      </style>
    </head>
    <body>
    <div id="root"></div>  
    <script type="module" src="${script}"></script>
    <script>
      window.addEventListener("DOMContentLoaded", (event) => {
        const vscode = acquireVsCodeApi();
        const result = window.renderWebView(vscode);
        if (!result?.skipAutoStart) {
          vscode.postMessage({command: "started", payload: crypto.randomUUID()});
        }
      });
    </script>
    </body>
    </html>`;
    }
}
exports.WebView = WebView;
function customCssProperties() {
    const props = theme_1.ThemeColorNames.map((name) => createColorProperty(name)).join("\n");
    return `:root { ${props} }`;
}
function createColorProperty(name) {
    if (vscodeColorMap[name] !== undefined) {
        const xliicVarName = theme_1.ThemeColorVariables[name];
        const vscodeVarName = vscodeColorMap[name];
        return `${xliicVarName}: var(${vscodeVarName});`;
    }
    return "";
}
const vscodeColorMap = {
    foreground: "--vscode-foreground",
    background: "--vscode-editor-background",
    disabledForeground: "--vscode-disabledForeground",
    border: "--vscode-editorGroup-border",
    focusBorder: "--vscode-focusBorder",
    buttonBorder: "--vscode-button-border",
    buttonBackground: "--vscode-button-background",
    buttonForeground: "--vscode-button-foreground",
    buttonHoverBackground: "--vscode-button-hoverBackground",
    buttonSecondaryBackground: "--vscode-button-secondaryBackground",
    buttonSecondaryForeground: "--vscode-button-secondaryForeground",
    buttonSecondaryHoverBackground: "--vscode-button-secondaryHoverBackground",
    inputBackground: "--vscode-input-background",
    inputForeground: "--vscode-input-foreground",
    inputBorder: "--vscode-input-border",
    inputPlaceholderForeground: "--vscode-input-placeholderForeground",
    tabBorder: "--vscode-tab-border",
    tabActiveBackground: "--vscode-tab-activeBackground",
    tabActiveForeground: "--vscode-tab-activeForeground",
    tabInactiveBackground: "--vscode-tab-inactiveBackground",
    tabInactiveForeground: "--vscode-tab-inactiveForeground",
    dropdownBackground: "--vscode-dropdown-background",
    dropdownBorder: "--vscode-dropdown-border",
    dropdownForeground: "--vscode-dropdown-foreground",
    checkboxBackground: "--vscode-checkbox-background",
    checkboxBorder: "--vscode-checkbox-border",
    checkboxForeground: "--vscode-checkbox-foreground",
    errorForeground: "--vscode-errorForeground",
    errorBackground: "--vscode-inputValidation-errorBackground",
    errorBorder: "--vscode-inputValidation-errorBorder",
    listActiveSelectionBackground: "--vscode-list-activeSelectionBackground",
    listActiveSelectionForeground: "--vscode-list-activeSelectionForeground",
    listHoverBackground: "--vscode-list-hoverBackground",
    contrastActiveBorder: "--vscode-contrastActiveBorder",
    linkForeground: "--vscode-textLink-foreground",
    linkActiveForeground: "--vscode-textLink-activeForeground",
    computedOne: undefined,
    computedTwo: undefined,
    badgeForeground: "--vscode-badge-foreground",
    badgeBackground: "--vscode-badge-background",
    notificationsForeground: "--vscode-notifications-foreground",
    notificationsBackground: "--vscode-notifications-background",
    notificationsBorder: "--vscode-notifications-border",
    fontSize: "--vscode-font-size",
};
//# sourceMappingURL=web-view.js.map