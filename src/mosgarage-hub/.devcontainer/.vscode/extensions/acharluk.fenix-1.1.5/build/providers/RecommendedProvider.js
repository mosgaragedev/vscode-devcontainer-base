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
const node_fetch_1 = require("node-fetch");
const vscode = require("vscode");
const RecommendedTreeItem_1 = require("./RecommendedTreeItem");
class RecommendedProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.recommendedList = [];
        this.loadRecommended();
    }
    loadRecommended() {
        return __awaiter(this, void 0, void 0, function* () {
            yield node_fetch_1.default('https://raw.githubusercontent.com/FenixTemplates/FenixTemplates/master/recommended.json')
                .then((raw) => raw.json())
                .then((json) => {
                Promise.all(json.map((r) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const raw2 = yield node_fetch_1.default(r);
                        const json = yield raw2.json();
                        this.recommendedList.push(new RecommendedTreeItem_1.default(json.repoName, json.author, r));
                    }
                    catch (e) {
                        vscode.window.showWarningMessage(`Could not load information for recommended repo: ${r}`);
                    }
                })))
                    .then(() => {
                    this.refresh();
                });
            })
                .catch(e => {
                vscode.window.showWarningMessage(`Could not load recommended list`);
            });
        });
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return this.recommendedList;
    }
}
exports.default = RecommendedProvider;
//# sourceMappingURL=RecommendedProvider.js.map