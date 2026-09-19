"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathContext = void 0;
const vscode_1 = require("vscode");
const globalState_1 = require("../services/globalState");
class PathContext {
    get mainPath() {
        var _a;
        if (!this._mainPath) {
            return (_a = vscode_1.workspace.rootPath) !== null && _a !== void 0 ? _a : '';
        }
        return this._mainPath;
    }
    set mainPath(path) {
        this._mainPath = path;
    }
    get comparedPath() {
        if (!this._comparedPath) {
            throw new Error('compared path is not set');
        }
        return this._comparedPath;
    }
    set comparedPath(path) {
        this._comparedPath = path;
    }
    setPaths(path1, path2) {
        this.mainPath = path1;
        this.comparedPath = path2;
        globalState_1.globalState.updatePaths(path1, path2);
    }
    getPaths() {
        return [this.mainPath, this.comparedPath];
    }
    swap() {
        const cachedMainPath = this._mainPath;
        this._mainPath = this._comparedPath;
        this._comparedPath = cachedMainPath;
    }
}
exports.pathContext = new PathContext();
//# sourceMappingURL=path.js.map