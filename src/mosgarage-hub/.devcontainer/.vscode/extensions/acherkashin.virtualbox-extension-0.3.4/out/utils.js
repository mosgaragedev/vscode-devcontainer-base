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
const util_1 = require("util");
const virtualbox = require("virtualbox");
exports.isRunning = util_1.promisify(virtualbox.isRunning);
exports.saveState = util_1.promisify(virtualbox.savestate);
exports.powerOff = util_1.promisify(virtualbox.poweroff);
function getAllVms() {
    return new Promise((resolve, reject) => {
        virtualbox.list((list, error) => __awaiter(this, void 0, void 0, function* () {
            if (error) {
                reject(error);
            }
            else {
                const vmsPromise = Object.keys(list).map((vmId) => __awaiter(this, void 0, void 0, function* () {
                    return ({
                        id: vmId,
                        name: list[vmId].name,
                        running: list[vmId].running,
                    });
                }));
                const vms = yield Promise.all(vmsPromise);
                resolve(vms);
            }
        }));
    });
}
exports.getAllVms = getAllVms;
function startWithGui(vmId) {
    return new Promise((resolve, reject) => {
        virtualbox.start(vmId, true, (error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
exports.startWithGui = startWithGui;
function startWithoutGui(vmId) {
    return new Promise((resolve, reject) => {
        virtualbox.start(vmId, false, (error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
exports.startWithoutGui = startWithoutGui;
function stopAllVms() {
    return __awaiter(this, void 0, void 0, function* () {
        const vms = yield getAllVms();
        const runningVmIds = vms.filter((vm) => vm.running).map((vm) => vm.id);
        const promises = runningVmIds.map(id => exports.saveState(id));
        return yield Promise.all(promises);
    });
}
exports.stopAllVms = stopAllVms;
function poweOffAllVms() {
    return __awaiter(this, void 0, void 0, function* () {
        const vms = yield getAllVms();
        const runningVmIds = vms.filter((vm) => vm.running).map((vm) => vm.id);
        const promises = runningVmIds.map(id => exports.powerOff(id));
        return yield Promise.all(promises);
    });
}
exports.poweOffAllVms = poweOffAllVms;
//# sourceMappingURL=utils.js.map