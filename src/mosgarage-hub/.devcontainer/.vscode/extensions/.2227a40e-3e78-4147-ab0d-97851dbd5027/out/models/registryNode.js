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
const repositoryNode_1 = require("./repositoryNode");
const vscode_1 = require("vscode");
const dockerUtils_1 = require("../utils/dockerUtils");
const url_1 = require("url");
const rootNode_1 = require("./rootNode");
class RegistryNode extends rootNode_1.RootNode {
    constructor(label, key, collapsibleState, url, user, password, onDidChangeTreeData, parent = undefined, iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'Registry_16x.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'Registry_16x.svg')
    }) {
        super(label, collapsibleState, onDidChangeTreeData, parent);
        this.label = label;
        this.key = key;
        this.collapsibleState = collapsibleState;
        this.url = url;
        this.user = user;
        this.password = password;
        this.iconPath = iconPath;
        this.contextValue = 'registryNode';
        this.dockerApiV2Helper = new dockerUtils_1.DockerAPIV2Helper(new url_1.URL(this.url), this.user, this.password);
    }
    getChildren(element) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let chldrns = new Array();
            let resp = yield this.dockerApiV2Helper.getCatalogs();
            resp.forEach(element => {
                chldrns.push(new repositoryNode_1.RepositoryNode(element, vscode_1.TreeItemCollapsibleState.Collapsed, this.dockerApiV2Helper, this.onDidChangeTreeData, this));
            });
            resolve(chldrns);
        }));
    }
}
exports.RegistryNode = RegistryNode;
//# sourceMappingURL=registryNode.js.map