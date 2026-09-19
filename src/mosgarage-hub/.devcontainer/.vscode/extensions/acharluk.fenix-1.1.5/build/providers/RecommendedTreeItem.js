"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class RecommendedTreeItem extends vscode.TreeItem {
    constructor(name, author, url) {
        super(name, vscode.TreeItemCollapsibleState.None);
        this.name = name;
        this.author = author;
        this.url = url;
    }
    get description() {
        return this.author;
    }
    get contextValue() {
        return 'fenix-recommended';
    }
}
exports.default = RecommendedTreeItem;
//# sourceMappingURL=RecommendedTreeItem.js.map