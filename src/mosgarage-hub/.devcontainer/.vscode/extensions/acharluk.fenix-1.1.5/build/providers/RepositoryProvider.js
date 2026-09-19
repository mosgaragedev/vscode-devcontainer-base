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
const Fenix_1 = require("../core/Fenix");
const RepositoryTreeItem_1 = require("./RepositoryTreeItem");
class RepositoryProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (element && element.type === 'repo') {
                const temps = (yield Fenix_1.default.get().getRepoHandler().getTemplates()).filter(t => t.parent === element.repoName);
                const items = temps.map(r => new RepositoryTreeItem_1.default(r.displayName, 'template', undefined, r.id));
                return items.sort((a, b) => a.label < b.label ? -1 : 1);
            }
            else if (element && element.type === 'template') {
                return [];
            }
            else {
                yield Fenix_1.default.get().getRepoHandler().refreshTemplates();
                const repos = Fenix_1.default.get().getRepoHandler()._repositories.map(r => new RepositoryTreeItem_1.default(`${r.repoName} [${r.author}]`, 'repo', r.repoUrl));
                return repos.sort((a, b) => a.label < b.label ? -1 : 1);
            }
        });
    }
}
exports.default = RepositoryProvider;
//# sourceMappingURL=RepositoryProvider.js.map