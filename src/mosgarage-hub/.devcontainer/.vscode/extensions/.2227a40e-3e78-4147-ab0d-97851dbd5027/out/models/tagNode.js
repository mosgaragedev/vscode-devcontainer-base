"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const layerNode_1 = require("./layerNode");
const utility_1 = require("../utils/utility");
const rootNode_1 = require("./rootNode");
class TagNode extends rootNode_1.RootNode {
    constructor(label, tag, collapsibleState, repository, dockerAPIV2Helper, onDidChangeTreeData, parent = undefined, iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'Image_16x.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Image_16x.svg')
    }) {
        super(label, collapsibleState, onDidChangeTreeData, parent);
        this.label = label;
        this.tag = tag;
        this.collapsibleState = collapsibleState;
        this.repository = repository;
        this.dockerAPIV2Helper = dockerAPIV2Helper;
        this.iconPath = iconPath;
        this.contextValue = 'tagNode';
        this.tooltip = "Expand to view total size of this image.";
    }
    getChildren(element) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let chldrns = new Array();
            let resp = yield this.dockerAPIV2Helper.getManifestV2(this.repository, this.tag);
            if (resp) {
                let totalSize = 0;
                resp.layers.forEach(layer => {
                    chldrns.push(new layerNode_1.LayerNode(vscode.TreeItemCollapsibleState.None, layer));
                    totalSize += layer.size;
                });
                this.tooltip = 'Image size: ' + utility_1.Utility.formatBytes(totalSize);
                if (this.collapsibleState !== vscode.TreeItemCollapsibleState.Expanded) {
                    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
                    this.onDidChangeTreeData.fire(this);
                }
            }
            resolve(chldrns);
        }));
    }
    getImageName() {
        let imageName = `${this.dockerAPIV2Helper.baseUrl.hostname}/${this.repository}:${this.tag}`;
        return imageName;
    }
    deleteFromRepository() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.dockerAPIV2Helper.deleteManifestV2(this.repository, this.tag);
            return res;
        });
    }
}
exports.TagNode = TagNode;
//# sourceMappingURL=tagNode.js.map