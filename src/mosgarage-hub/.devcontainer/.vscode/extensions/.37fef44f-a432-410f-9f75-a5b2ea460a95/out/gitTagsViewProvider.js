"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.GitTagsViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const gitTagsResolver_1 = require("./services/gitTagsResolver");
const template_1 = require("./template");
class GitTagsViewProvider {
    constructor() {
        gitTagsResolver_1.refreshFromRemote(vscode.workspace.workspaceFolders[0].uri.fsPath);
    }
    // public provideTextDocumentContent(uri: vscode.Uri): string {
    //     if (!this._tags) {
    //         return '';
    //     }
    //     return html(this._tags);
    // }
    set panel(panel) {
        this._panel = panel;
    }
    // get onDidChange(): vscode.Event<vscode.Uri> {
    //     return this._onDidChange.event;
    // }
    // public async updateTags() {
    //     const cwd = vscode.workspace.rootPath;
    //     this._tags = await tags(cwd);
    //     this._onDidChange.fire(GITTAGSURI);
    // }
    getInitHtml(webview) {
        return __awaiter(this, void 0, void 0, function* () {
            const cwd = vscode.workspace.rootPath;
            yield gitTagsResolver_1.refreshFromRemote(vscode.workspace.workspaceFolders[0].uri.fsPath);
            const tagList = yield gitTagsResolver_1.tags(cwd);
            return template_1.html(tagList, webview);
        });
    }
    refreshView() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._panel) {
                return;
            }
            const html = yield this.getInitHtml(this._panel.webview);
            this._panel.webview.html = html;
        });
    }
}
exports.GitTagsViewProvider = GitTagsViewProvider;
//# sourceMappingURL=gitTagsViewProvider.js.map