"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEPERATOR = exports.globalState = void 0;
const logger_1 = require("./logger");
class GlobalState {
    constructor() {
        this.KEY = 'compareFolders.paths';
        this.VERSION_KEY = 'compareFolders.version';
        this.clear = () => {
            var _a;
            (_a = this.globalState) === null || _a === void 0 ? void 0 : _a.update(this.KEY, []);
        };
    }
    init(context) {
        this.globalState = context.globalState;
        this.globalState.update(this.VERSION_KEY, context.extension.packageJSON.version);
    }
    get extensionVersion() {
        var _a;
        return (_a = this.globalState) === null || _a === void 0 ? void 0 : _a.get(this.VERSION_KEY);
    }
    updatePaths(path1, path2) {
        try {
            if (!this.globalState) {
                throw new Error(`globalState hasn't been initilized`);
            }
            const newPath = `${path1}${exports.SEPERATOR}${path2}`;
            const currentPaths = this.getPaths();
            const newPaths = [newPath, ...currentPaths.filter(path => path !== newPath)];
            this.globalState.update(this.KEY, newPaths);
        }
        catch (error) {
            (0, logger_1.log)(error);
        }
    }
    getPaths() {
        if (!this.globalState) {
            throw new Error(`globalState hasn't been initilized`);
        }
        return this.globalState.get(this.KEY, []);
    }
}
exports.globalState = new GlobalState();
exports.SEPERATOR = '↔';
//# sourceMappingURL=globalState.js.map