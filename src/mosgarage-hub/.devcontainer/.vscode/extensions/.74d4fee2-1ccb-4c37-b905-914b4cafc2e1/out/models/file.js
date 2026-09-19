"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const vscode_1 = require("vscode");
const path_1 = require("path");
const logger_1 = require("../services/logger");
class File extends vscode_1.TreeItem {
    constructor(label, type, collapsibleState, command, children, resourceUri, description, tooltip) {
        var _a, _b, _c;
        super(label, collapsibleState);
        this.label = label;
        this.type = type;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.children = children;
        this.resourceUri = resourceUri;
        this.description = description;
        this.tooltip = tooltip;
        this.iconPath = this.hasIcon ? {
            light: vscode_1.Uri.file((0, path_1.join)(__filename, '..', '..', '..', 'resources', 'light', `${this.type}.svg`)),
            dark: vscode_1.Uri.file((0, path_1.join)(__filename, '..', '..', '..', 'resources', 'dark', `${this.type}.svg`)),
        } : undefined;
        this.contextValue = this.type;
        try {
            (_a = this.tooltip) !== null && _a !== void 0 ? _a : (this.tooltip = ((_b = this.resourceUri) === null || _b === void 0 ? void 0 : _b.fsPath) || this.label);
            this.resourceUri = this.resourceUri || (this.hasIcon ?
                undefined :
                vscode_1.Uri.file(((_c = this.command) === null || _c === void 0 ? void 0 : _c.arguments[0][0]) || ''));
        }
        catch (error) {
            (0, logger_1.log)(`can't set resourceUri: ${error}`);
        }
    }
    get hasIcon() {
        return ['open', 'empty', 'root'].includes(this.type);
    }
}
exports.File = File;
//# sourceMappingURL=file.js.map