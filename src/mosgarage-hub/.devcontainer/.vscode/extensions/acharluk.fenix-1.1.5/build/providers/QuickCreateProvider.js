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
const FenixConfig_1 = require("../core/FenixConfig");
const QuickCreateTreeItem_1 = require("./QuickCreateTreeItem");
class QuickCreateProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            const templates = yield FenixConfig_1.default.get().getPinned();
            const ret = [];
            for (let v of templates) {
                ret.push(new QuickCreateTreeItem_1.default(v));
            }
            return ret.sort((a, b) => a.template.displayName < b.template.displayName ? -1 : 1);
        });
    }
}
exports.default = QuickCreateProvider;
//# sourceMappingURL=QuickCreateProvider.js.map