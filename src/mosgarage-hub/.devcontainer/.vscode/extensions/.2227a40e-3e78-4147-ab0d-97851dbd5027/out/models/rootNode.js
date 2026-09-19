"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class RootNode extends vscode.TreeItem {
    constructor(label, collapsibleState, onDidChangeTreeData, parent = undefined) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.onDidChangeTreeData = onDidChangeTreeData;
        this.parent = parent;
    }
    refresh() {
        this.onDidChangeTreeData.fire(this);
    }
}
exports.RootNode = RootNode;
//# sourceMappingURL=rootNode.js.map