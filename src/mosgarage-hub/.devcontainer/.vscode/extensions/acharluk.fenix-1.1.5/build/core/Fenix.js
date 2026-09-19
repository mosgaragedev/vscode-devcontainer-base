"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const FenixConfig_1 = require("./FenixConfig");
const FenixParser_1 = require("./FenixParser");
const FenixViewContainer_1 = require("./FenixViewContainer");
const RepoHandler_1 = require("./RepoHandler");
const FenixWebview_1 = require("./FenixWebview");
class Fenix {
    constructor(extensionContext) {
        FenixConfig_1.default.init();
        FenixParser_1.default.init();
        this._webview = new FenixWebview_1.default(extensionContext);
        this._repoHandler = new RepoHandler_1.default();
        this._view = new FenixViewContainer_1.default(extensionContext);
        this._extensionContext = extensionContext;
    }
    static init(extensionContext) {
        if (!this.__instance) {
            this.__instance = new Fenix(extensionContext);
        }
    }
    static get() {
        return this.__instance;
    }
    getRepoHandler() {
        return this._repoHandler;
    }
    getViewContainer() {
        return this._view;
    }
    getExtensionContext() {
        return this._extensionContext;
    }
    show(forceRefresh) {
        this._repoHandler.getTemplates(forceRefresh)
            .then(templates => {
            FenixParser_1.default.get().clear();
            FenixParser_1.default.get().push('templates', templates);
            FenixParser_1.default.get().pushEnv();
            this._webview.show();
        });
    }
    refreshWebView() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const templates = yield this._repoHandler.getTemplates(true);
            const repos = FenixConfig_1.default.get().getRepos();
            (_a = this._webview._webviewPanel) === null || _a === void 0 ? void 0 : _a.webview.postMessage({
                command: 'load',
                templates: templates,
                repositories: repos,
            });
        });
    }
    handleWebviewEvent(event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            FenixParser_1.default.get().pushEnv();
            switch (event.command) {
                case 'create': {
                    const rootPath = vscode.workspace.workspaceFolders
                        ? vscode.workspace.workspaceFolders[0].uri.fsPath
                        : '';
                    if (!rootPath) {
                        vscode.window.showErrorMessage('Please open a folder before creating a project!');
                    }
                    else {
                        if (event.vars) {
                            for (let v in event.vars) {
                                FenixParser_1.default.get().push(v, event.vars[v]);
                            }
                        }
                        this._repoHandler.runTemplate(event.id, rootPath);
                        (_a = this._webview._webviewPanel) === null || _a === void 0 ? void 0 : _a.dispose();
                    }
                    break;
                }
                case 'ready':
                    this.refreshWebView();
                    break;
                default:
                    vscode.window.showErrorMessage(`Fenix error: Error handling event '${event.command}'`);
            }
        });
    }
}
exports.default = Fenix;
//# sourceMappingURL=Fenix.js.map