"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class EnvironmentTreeItem extends vscode.TreeItem {
    constructor(varID, varValue) {
        super(varID, vscode.TreeItemCollapsibleState.None);
        this.varID = varID;
        this.varValue = varValue;
    }
    get tooltip() {
        return `${this.varID}: ${this.varValue}`;
    }
    get description() {
        return this.varValue;
    }
    get command() {
        return {
            command: 'fenix.env.edit',
            title: 'Edit this variable',
        };
    }
    get contextValue() {
        return 'fenix-env';
    }
}
exports.default = EnvironmentTreeItem;
//# sourceMappingURL=EnvironmentTreeItem.js.map