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
exports.createCMD = void 0;
const vscode = __importStar(require("vscode"));
const gitTagsResolver_1 = require("../services/gitTagsResolver");
function createCMD(provider, refreshTagsView) {
    return vscode.commands.registerCommand('extension.gitcreatetag', function () {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tag = yield vscode.window.showInputBox({
                    placeHolder: 'Type a tag...'
                });
                if (!tag || !tag.trim()) {
                    return;
                }
                const message = yield vscode.window.showInputBox({
                    placeHolder: 'Type a message...'
                });
                if (message) {
                    yield gitTagsResolver_1.createWithMessage(tag, message, vscode.workspace.rootPath);
                }
                else {
                    yield gitTagsResolver_1.create(tag, vscode.workspace.rootPath);
                }
                refreshTagsView();
                const picked = yield vscode.window.showQuickPick(['Yes', 'No'], {
                    placeHolder: 'Would you like to sync this tag to remote repository?'
                });
                if (picked !== 'Yes') {
                    return;
                }
                yield gitTagsResolver_1.syncCreate(vscode.workspace.rootPath);
                vscode.window.setStatusBarMessage('Tag synchronised', 3000);
            }
            catch (err) {
                vscode.window.showErrorMessage(err);
            }
        });
    });
}
exports.createCMD = createCMD;
//# sourceMappingURL=createTag.js.map