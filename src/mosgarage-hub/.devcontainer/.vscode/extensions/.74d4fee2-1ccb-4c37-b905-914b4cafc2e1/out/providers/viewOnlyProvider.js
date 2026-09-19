"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewOnlyProvider = void 0;
const vscode_1 = require("vscode");
const file_1 = require("../models/file");
const treeBuilder_1 = require("../services/treeBuilder");
class ViewOnlyProvider {
    constructor(showPath = true) {
        this.showPath = showPath;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.diffs = [];
        this.rootPath = '';
    }
    update(diffs, rootPath) {
        this.diffs = diffs;
        this.rootPath = rootPath;
        this._onDidChangeTreeData.fire(null);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element && element.children) {
            return element.children;
        }
        const { treeItems } = (0, treeBuilder_1.build)(this.diffs, this.rootPath);
        let children = [];
        if (this.rootPath && this.showPath) {
            children = [
                new file_1.File(this.rootPath, 'root', vscode_1.TreeItemCollapsibleState.Expanded, undefined, treeItems)
            ];
        }
        else {
            children = treeItems;
        }
        return children;
    }
}
exports.ViewOnlyProvider = ViewOnlyProvider;
//# sourceMappingURL=viewOnlyProvider.js.map