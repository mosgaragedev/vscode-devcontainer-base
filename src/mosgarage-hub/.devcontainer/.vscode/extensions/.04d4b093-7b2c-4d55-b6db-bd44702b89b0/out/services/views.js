"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceNode = void 0;
const vscode_1 = require("vscode");
const enums_1 = require("../enums");
const views_1 = require("../containers/views");
const views_2 = require("../compose/views");
class ServiceNode extends views_2.ComposeNode {
    // iconPath = {
    // 	light: path.join(__filename, '..', '..', '..', 'resources', 'light'),
    // 	dark: path.join(__filename, '..', '..', '..', 'resources', 'dark')
    // };
    constructor(context, service) {
        super(context);
        this.service = service;
    }
    async getChildren() {
        this.resetChildren();
        const containers = await this.service.getContainers(true);
        const context = this.context;
        this.children = containers
            .map((container) => new views_1.ContainerNode(context, container));
        return this.children;
    }
    async getTreeItem() {
        const item = new vscode_1.TreeItem(this.service.name, vscode_1.TreeItemCollapsibleState.Expanded);
        // item.iconPath = this.iconPath;
        item.contextValue = enums_1.ResourceType.Service;
        return item;
    }
}
exports.ServiceNode = ServiceNode;
//# sourceMappingURL=views.js.map