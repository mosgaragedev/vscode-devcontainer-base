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
const path = require("path");
const tagNode_1 = require("./tagNode");
const vscode_1 = require("vscode");
const rootNode_1 = require("./rootNode");
class RepositoryNode extends rootNode_1.RootNode {
    constructor(label, collapsibleState, dockerAPIV2Helper, onDidChangeTreeData, parent = undefined, iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'Repository_16x.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Repository_16x.svg')
    }) {
        super(label, collapsibleState, onDidChangeTreeData, parent);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.dockerAPIV2Helper = dockerAPIV2Helper;
        this.iconPath = iconPath;
        this._chldrenCount = 0;
        this.contextValue = 'repositoryNode';
    }
    get chldrenCount() {
        return this._chldrenCount;
    }
    getChildren(element) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let chldrns = new Array();
            let resp = yield this.dockerAPIV2Helper.getTags(this.label);
            if (resp) {
                resp.tags.forEach(tag => {
                    chldrns.push(new tagNode_1.TagNode(tag, tag, vscode_1.TreeItemCollapsibleState.Collapsed, this.label, this.dockerAPIV2Helper, this.onDidChangeTreeData, this));
                });
            }
            chldrns.sort((a, b) => {
                if (a.tag === 'latest') {
                    return -1;
                }
                if (b.tag === 'latest') {
                    return 1;
                }
                if (!isNaN(+a.tag) && !isNaN(+b.tag)) {
                    if (+a.tag < +b.tag) {
                        return 1;
                    }
                    if (+a.tag > +b.tag) {
                        return -1;
                    }
                }
                else {
                    if (a.tag < b.tag) {
                        return 1;
                    }
                    if (a.tag > b.tag) {
                        return -1;
                    }
                }
                return 0;
            });
            this._chldrenCount = chldrns.length;
            resolve(chldrns);
        }));
    }
}
exports.RepositoryNode = RepositoryNode;
//# sourceMappingURL=repositoryNode.js.map