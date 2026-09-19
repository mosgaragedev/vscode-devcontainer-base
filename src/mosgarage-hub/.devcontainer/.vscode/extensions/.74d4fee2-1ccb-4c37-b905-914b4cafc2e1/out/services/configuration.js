"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = void 0;
const vscode_1 = require("vscode");
function get() {
    return vscode_1.workspace.getConfiguration('compareFolders');
}
function getConfigItem(key) {
    const config = get();
    return config.get(key);
}
function getConfiguration(...args) {
    const config = get();
    if (args.length === 1) {
        return getConfigItem(args[0]);
    }
    const result = {};
    args.forEach((arg) => {
        result[arg] = config.get(arg);
    });
    return result;
}
exports.getConfiguration = getConfiguration;
//# sourceMappingURL=configuration.js.map