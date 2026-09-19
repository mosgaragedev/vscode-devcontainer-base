"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class QuickCreateTreeItem extends vscode.TreeItem {
    constructor(template) {
        super(template.displayName, vscode.TreeItemCollapsibleState.None);
        this.template = template;
    }
    get description() {
        return this.template.repoName || this.template.id;
    }
    get command() {
        return {
            command: 'fenix.template.run',
            title: 'Run this template',
        };
    }
    get contextValue() {
        return 'fenix-quick';
    }
}
exports.default = QuickCreateTreeItem;
//# sourceMappingURL=QuickCreateTreeItem.js.map