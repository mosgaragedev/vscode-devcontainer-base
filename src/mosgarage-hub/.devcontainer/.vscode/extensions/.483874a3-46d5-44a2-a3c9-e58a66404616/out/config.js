"use strict";
/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/* CONFIG */
const Config = {
    get(extension = 'openInGitHub') {
        return vscode.workspace.getConfiguration().get(extension);
    }
};
/* EXPORT */
exports.default = Config;
//# sourceMappingURL=config.js.map