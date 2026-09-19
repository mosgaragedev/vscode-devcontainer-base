"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const FenixConfig_1 = require("../core/FenixConfig");
const EnvironmentTreeItem_1 = require("./EnvironmentTreeItem");
class EnvironmentProvider {
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
        const env = FenixConfig_1.default.get().getEnv();
        const ret = [];
        for (let v in env) {
            ret.push(new EnvironmentTreeItem_1.default(v, env[v]));
        }
        return ret.sort((a, b) => a.varID < b.varID ? -1 : 1);
    }
}
exports.default = EnvironmentProvider;
//# sourceMappingURL=EnvironmentProvider.js.map