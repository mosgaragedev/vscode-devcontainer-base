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
exports.listCMD = void 0;
const vscode = __importStar(require("vscode"));
let panel;
function listCMD(context, provider, refreshTagsView) {
    return vscode.commands.registerCommand('extension.gittags', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // The code you place here will be executed every time your command is executed
            if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders.length) {
                return vscode.window.showWarningMessage(`Git Tags cannot be actived since no code repo opened`);
            }
            if (vscode.workspace.workspaceFolders.length !== 1) {
                return vscode.window.showWarningMessage(`Git Tags cannot be actived in multiple workspace mode`);
            }
            refreshTagsView();
            try {
                if (!panel) {
                    createWebPanel(context, provider);
                }
                else if (!panel.visible) {
                    panel.reveal();
                }
                provider.panel = panel;
                provider.refreshView();
            }
            catch (err) {
                vscode.window.showErrorMessage(err);
            }
        });
    });
}
exports.listCMD = listCMD;
function createWebPanel(context, provider) {
    panel = vscode.window.createWebviewPanel('gittags', 'git tags', vscode.ViewColumn.One, {
        enableScripts: true
    });
    panel.onDidDispose(() => {
        // When the panel is closed, cancel any future updates to the webview content
        panel = null;
        provider.panel = panel;
    }, null, context.subscriptions);
    panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'deleteTag':
                vscode.commands.executeCommand('extension.deleteGitTag', message.text);
                return;
        }
    }, undefined, context.subscriptions);
}
//# sourceMappingURL=listTags.js.map