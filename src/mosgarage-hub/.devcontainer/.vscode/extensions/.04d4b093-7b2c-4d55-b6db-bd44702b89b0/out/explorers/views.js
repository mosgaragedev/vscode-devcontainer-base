"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerNode = void 0;
const vscode_1 = require("vscode");
class ExplorerNode extends vscode_1.Disposable {
    constructor(context) {
        super(() => this.dispose());
        this.context = context;
    }
    dispose() {
        if (this.disposable !== undefined) {
            this.disposable.dispose();
            this.disposable = undefined;
        }
        this.resetChildren();
    }
    getCommand() {
        return undefined;
    }
    resetChildren() {
        if (this.children !== undefined) {
            this.children.forEach(c => c.dispose());
            this.children = undefined;
        }
    }
}
exports.ExplorerNode = ExplorerNode;
//# sourceMappingURL=views.js.map