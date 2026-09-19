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
const FenixConfig_1 = require("../core/FenixConfig");
const Fenix_1 = require("../core/Fenix");
exports.default = {
    'fenix.repo.delete': (e) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: `Do you want to delete '${e.label}'?`,
        });
        if (response === 'Yes' && e.repoName) {
            yield FenixConfig_1.default.get().removeRepo(e.repoName);
            Fenix_1.default.get().refreshWebView();
        }
    }),
    'fenix.repo.add': () => __awaiter(void 0, void 0, void 0, function* () {
        const repoURL = yield vscode.window.showInputBox({
            placeHolder: 'Enter the repository URL',
        });
        if (repoURL) {
            yield FenixConfig_1.default.get().addRepo(repoURL);
            Fenix_1.default.get().refreshWebView();
        }
    }),
};
//# sourceMappingURL=RepositoryCommands.js.map