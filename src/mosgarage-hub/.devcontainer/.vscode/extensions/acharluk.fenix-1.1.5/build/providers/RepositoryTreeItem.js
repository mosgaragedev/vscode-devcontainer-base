"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class RepositoryTreeItem extends vscode.TreeItem {
    constructor(label, type, repoName, id) {
        super(label, type === 'repo'
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.type = type;
        this.repoName = repoName;
        this.id = id;
    }
    get contextValue() {
        return `fenix-${this.type}`;
    }
    ;
}
exports.default = RepositoryTreeItem;
//# sourceMappingURL=RepositoryTreeItem.js.map