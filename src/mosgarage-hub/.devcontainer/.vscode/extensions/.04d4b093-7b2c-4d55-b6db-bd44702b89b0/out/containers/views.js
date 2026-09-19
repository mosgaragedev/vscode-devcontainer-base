"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerNode = void 0;
const vscode_1 = require("vscode");
const enums_1 = require("../enums");
const enums_2 = require("../containers/enums");
const views_1 = require("../compose/views");
class ContainerNode extends views_1.ComposeNode {
    // iconPath = {
    // 	light: path.join(__filename, '..', '..', '..', 'resources', 'light'),
    // 	dark: path.join(__filename, '..', '..', '..', 'resources', 'dark')
    // };
    constructor(context, container) {
        super(context);
        this.container = container;
    }
    async getChildren() {
        return [];
    }
    async getTreeItem() {
        const item = new vscode_1.TreeItem(this.container.name, vscode_1.TreeItemCollapsibleState.None);
        item.tooltip = new vscode_1.MarkdownString(`### ${this.container.name}`);
        item.tooltip.supportHtml = true;
        item.tooltip.isTrusted = true;
        // custom iconPath
        // var iconPath = this.context.asAbsolutePath('resources/service-exit.png');
        // if (this.container.state == ContainerState.Up) {
        //     item.contextValue = ResourceType.RunningContainer;
        //     var iconPath = this.context.asAbsolutePath('resources/service-up-unhealthy.png');
        //     if (this.container.healthy)
        //         var iconPath = this.context.asAbsolutePath('resources/service-up-healthy.png');
        // }
        // item.iconPath = {
        //     dark: iconPath,
        //     light: iconPath
        // };
        let iconId;
        let iconColorId;
        let tooltipColor;
        if (this.container.state == enums_2.ContainerState.Up) {
            item.contextValue = enums_1.ResourceType.RunningContainer;
            if (this.container.healthy) {
                iconId = "vm-running";
                iconColorId = "debugIcon.startForeground";
                tooltipColor = "#99ff99";
            }
            else {
                iconId = "vm-active";
                iconColorId = "problemsWarningIcon.foreground";
                tooltipColor = "#ffc600";
            }
        }
        else {
            item.contextValue = enums_1.ResourceType.ExitedContainer;
            iconId = "vm";
            iconColorId = "problemsErrorIcon.foreground";
            tooltipColor = "#ff9999";
        }
        const iconColor = new vscode_1.ThemeColor(iconColorId);
        item.iconPath = new vscode_1.ThemeIcon(iconId, iconColor);
        item.tooltip.appendMarkdown(`\n<span style="color:${tooltipColor};">${this.container.status}</span>`);
        return item;
    }
}
exports.ContainerNode = ContainerNode;
//# sourceMappingURL=views.js.map