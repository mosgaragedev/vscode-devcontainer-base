"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utils_1 = require("./utils");
const vmTreeitem_1 = require("./vmTreeitem");
class VirtualMachinesProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh(item) {
        this._onDidChangeTreeData.fire(item);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return utils_1.getAllVms()
            .then((vms) => vms.map(vm => new vmTreeitem_1.VirtualMachineTreeItem(vm)))
            .catch((err) => {
            vscode.window.showErrorMessage(err);
            return [];
        });
    }
}
exports.VirtualMachinesProvider = VirtualMachinesProvider;
//# sourceMappingURL=vmsProvider.js.map