"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utils_1 = require("./utils");
const vmsProvider_1 = require("./vmsProvider");
function activate(context) {
    const vmProvider = new vmsProvider_1.VirtualMachinesProvider();
    vscode.window.registerTreeDataProvider("vb-machines", vmProvider);
    context.subscriptions.push(vscode.commands.registerCommand('virtualbox-extension.runVM', (vmTreeItem) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (vmTreeItem) {
            const { vm } = vmTreeItem;
            const running = yield utils_1.isRunning(vm.id);
            if (!running) {
                try {
                    yield utils_1.startWithGui(vm.id);
                    vscode.window.showInformationMessage(`Virtual machine "${vm.name}" has been run successfully`);
                }
                catch (ex) {
                    vscode.window.showErrorMessage(`Cannot run virtual machine "${vm.name}": ${(_a = ex === null || ex === void 0 ? void 0 : ex.message) !== null && _a !== void 0 ? _a : "Unknown error"}`);
                }
            }
            vmProvider.refresh();
        }
    })), vscode.commands.registerCommand('virtualbox-extension.runHeadlessVM', (vmTreeItem) => __awaiter(this, void 0, void 0, function* () {
        var _b;
        if (vmTreeItem) {
            const { vm } = vmTreeItem;
            const running = yield utils_1.isRunning(vm.id);
            if (!running) {
                try {
                    yield utils_1.startWithoutGui(vm.id);
                    vscode.window.showInformationMessage(`Virtual machine "${vm.name}" (Headless) has been run successfully`);
                }
                catch (ex) {
                    vscode.window.showErrorMessage(`Cannot run virtual machine "${vm.name}" (Headless): ${(_b = ex === null || ex === void 0 ? void 0 : ex.message) !== null && _b !== void 0 ? _b : "Unknown error"}`);
                }
            }
            vmProvider.refresh();
        }
    })), vscode.commands.registerCommand("virtualbox-extension.saveStateVM", (vmTreeItem) => __awaiter(this, void 0, void 0, function* () {
        var _c;
        if (vmTreeItem) {
            const { vm } = vmTreeItem;
            const running = yield utils_1.isRunning(vm.id);
            if (running) {
                try {
                    yield utils_1.saveState(vm.id);
                    vscode.window.showInformationMessage(`Virtual machine "${vm.name}" has been stopped successfully`);
                }
                catch (ex) {
                    vscode.window.showErrorMessage(`Cannot stop virtual machine "${vm.name}": ${(_c = ex === null || ex === void 0 ? void 0 : ex.message) !== null && _c !== void 0 ? _c : "Unknown error"}`);
                }
            }
            vmProvider.refresh();
        }
    })), vscode.commands.registerCommand("virtualbox-extension.poweroffVm", (vmTreeItem) => __awaiter(this, void 0, void 0, function* () {
        var _d;
        if (vmTreeItem) {
            const { vm } = vmTreeItem;
            const running = yield utils_1.isRunning(vm.id);
            if (running) {
                try {
                    yield utils_1.powerOff(vm.id);
                    vscode.window.showInformationMessage(`Virtual machine "${vm.name}" has been stopped successfully`);
                }
                catch (ex) {
                    vscode.window.showErrorMessage(`Cannot stop virtual machine "${vm.name}": ${(_d = ex === null || ex === void 0 ? void 0 : ex.message) !== null && _d !== void 0 ? _d : "Unknown error"}`);
                }
            }
            vmProvider.refresh();
        }
    })), vscode.commands.registerCommand('virtualbox-extension.refreshVMs', () => {
        vmProvider.refresh();
    }), vscode.commands.registerCommand('virtualbox-extension.stopAllVms', () => {
        utils_1.stopAllVms().then(() => {
            vmProvider.refresh();
        });
    }), vscode.commands.registerCommand('virtualbox-extension.poweOffAllVms', () => {
        utils_1.poweOffAllVms().then(() => {
            vmProvider.refresh();
        });
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map