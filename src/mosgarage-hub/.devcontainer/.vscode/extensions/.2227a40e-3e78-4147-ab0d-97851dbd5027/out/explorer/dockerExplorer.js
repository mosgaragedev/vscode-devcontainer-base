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
const registryNode_1 = require("../models/registryNode");
const url_1 = require("url");
const globals_1 = require("../globals");
const utility_1 = require("../utils/utility");
class PrivateDockerExplorerProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this._onDidChangeTreeData.fire();
        });
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let chldrns = new Array();
                let keytar = utility_1.Utility.getCoreNodeModule('keytar');
                let nodesData = this.context.globalState.get(globals_1.Globals.GLOBAL_STATE_REGS_KEY, []);
                for (let i = 0; i < nodesData.length; i++) {
                    const key = nodesData[i];
                    let url = new url_1.URL(key);
                    let user = yield keytar.getPassword(globals_1.Globals.KEYTAR_SECRETS_KEY, `${url}.${globals_1.Globals.KEYTAR_SECRETS_ACCOUNT_USER_POSTFIX_KEY}`);
                    let password = yield keytar.getPassword(globals_1.Globals.KEYTAR_SECRETS_KEY, `${url}.${globals_1.Globals.KEYTAR_SECRETS_ACCOUNT_PASSWORD_POSTFIX_KEY}`);
                    chldrns.push(new registryNode_1.RegistryNode(url.hostname, url.toString(), vscode.TreeItemCollapsibleState.Collapsed, url.toString(), user || '', password || '', this._onDidChangeTreeData));
                }
                resolve(chldrns);
            }));
        }
        else {
            return element.getChildren();
        }
    }
}
exports.PrivateDockerExplorerProvider = PrivateDockerExplorerProvider;
//# sourceMappingURL=dockerExplorer.js.map