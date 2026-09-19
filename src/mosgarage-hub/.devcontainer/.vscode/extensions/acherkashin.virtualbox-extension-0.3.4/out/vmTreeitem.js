"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class VirtualMachineTreeItem extends vscode.TreeItem {
    constructor(vm) {
        super(vm.name);
        this.vm = vm;
        this.id = vm.id;
        this.iconPath = new vscode.ThemeIcon(vm.running ? "vm-running" : "vm");
        this.contextValue = vm.running ? "vmRunning" : "vmStopped";
    }
}
exports.VirtualMachineTreeItem = VirtualMachineTreeItem;
//# sourceMappingURL=vmTreeitem.js.map