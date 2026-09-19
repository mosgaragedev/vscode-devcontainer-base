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
exports.deleteCMD = void 0;
const vscode = __importStar(require("vscode"));
const gitTagsResolver_1 = require("../services/gitTagsResolver");
function deleteCMD(provider, refreshTagsView) {
    return vscode.commands.registerCommand('extension.deleteGitTag', function (tag) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const picked = yield vscode.window.showQuickPick(['Yes', 'No'], {
                    placeHolder: 'Would you like to delete this tag from remote repository as well?'
                });
                const rootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                if (picked === 'Yes') {
                    yield gitTagsResolver_1.syncDelete(tag, rootFolder);
                    yield gitTagsResolver_1.deleteTag(tag, rootFolder);
                }
                else {
                    yield gitTagsResolver_1.deleteTag(tag, rootFolder);
                }
                refreshTagsView();
                vscode.window.setStatusBarMessage(`Remote tag ${tag} deleted`, 3000);
            }
            catch (err) {
                refreshTagsView();
                vscode.window.showErrorMessage(`Delete remote Tag failed, \n ${err}`);
            }
        });
    });
}
exports.deleteCMD = deleteCMD;
//# sourceMappingURL=deleteTag.js.map