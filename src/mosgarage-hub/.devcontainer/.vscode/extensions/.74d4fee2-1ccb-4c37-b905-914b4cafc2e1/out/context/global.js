"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setContext = void 0;
const vscode_1 = require("vscode");
const setContext = (key, value) => {
    vscode_1.commands.executeCommand('setContext', key, value);
};
exports.setContext = setContext;
//# sourceMappingURL=global.js.map