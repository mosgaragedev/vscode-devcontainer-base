"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const utility_1 = require("../utils/utility");
class LayerNode extends vscode.TreeItem {
    constructor(collapsibleState, layerItem, iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'Layer_16x.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Layer_16x.svg')
    }) {
        super('', collapsibleState);
        this.collapsibleState = collapsibleState;
        this.layerItem = layerItem;
        this.iconPath = iconPath;
        this.contextValue = 'layerNode';
        if (this.layerItem) {
            this.label = this.layerItem.digest;
            this.tooltip = 'Layer size: ' + utility_1.Utility.formatBytes(this.layerItem.size);
        }
    }
}
exports.LayerNode = LayerNode;
//# sourceMappingURL=layerNode.js.map