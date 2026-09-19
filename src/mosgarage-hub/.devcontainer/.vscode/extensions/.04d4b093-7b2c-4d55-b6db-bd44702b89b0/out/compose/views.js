"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposeNode = exports.MessageNode = void 0;
const vscode_1 = require("vscode");
const enums_1 = require("../enums");
const exceptions_1 = require("../executors/exceptions");
const views_1 = require("../explorers/views");
class MessageNode extends views_1.ExplorerNode {
    constructor(context, message, iconId = null, iconColorId = null, tooltip = null) {
        super(context);
        this.context = context;
        this.message = message;
        this.iconId = iconId;
        this.iconColorId = iconColorId;
        this.tooltip = tooltip;
    }
    getChildren() {
        return [];
    }
    getTreeItem() {
        const item = new vscode_1.TreeItem(this.message, vscode_1.TreeItemCollapsibleState.None);
        item.contextValue = enums_1.ResourceType.Message;
        if (this.iconId !== undefined)
            if (this.iconColorId !== undefined)
                item.iconPath = new vscode_1.ThemeIcon(this.iconId, new vscode_1.ThemeColor(this.iconColorId));
            else
                item.iconPath = new vscode_1.ThemeIcon(this.iconId);
        if (this.tooltip !== undefined)
            item.tooltip = this.tooltip;
        return item;
    }
    handleError(err) {
        return [];
    }
}
exports.MessageNode = MessageNode;
class ComposeNode extends views_1.ExplorerNode {
    handleError(err) {
        let message = 'unexpected error';
        if (err instanceof exceptions_1.DockerExecutorError) {
            message = 'Failed to execute docker command';
        }
        else if (err instanceof exceptions_1.ComposeFileNotFound) {
            message = 'No docker compose file(s)';
        }
        else if (err instanceof exceptions_1.ComposeCommandNotFound) {
            message = 'Command docker compose not found';
        }
        else if (err instanceof exceptions_1.ComposeExecutorError) {
            message = 'Failed to execute docker compose command';
        }
        else {
            vscode_1.window.showErrorMessage("Docker-Compose Extension Error: " + err.message);
        }
        return [new MessageNode(this.context, message, 'error', 'problemsErrorIcon.foreground', err.message)];
    }
}
exports.ComposeNode = ComposeNode;
//# sourceMappingURL=views.js.map