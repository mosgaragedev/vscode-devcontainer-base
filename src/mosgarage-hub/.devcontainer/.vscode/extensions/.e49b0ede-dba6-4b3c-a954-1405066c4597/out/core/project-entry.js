"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class ProjectEntry {
    constructor(input) {
        this.id = input.id;
        this.name = input.name;
        this.path = input.path;
        this.icon = input.icon ?? this.getIcon();
        this.accent = input.accent ?? '#dc143c';
        return;
    }
    ;
    getIcon() {
        if (this.path.match(/@/))
            return 'codicon-remote-explorer';
        return 'codicon-folder';
    }
    ;
    getUriObject() {
        // local filepaths can just be their path.
        // ssh tho, vscode-remote://ssh-remote+USER@HOST/PATH
        if (this.path.match(/:\/\//))
            return vscode.Uri.parse(this.path, true);
        return vscode.Uri.file(this.path);
    }
    ;
    update(input) {
        if (typeof input.id !== 'undefined')
            this.id = input.id;
        if (typeof input.name !== 'undefined')
            this.name = input.name;
        if (typeof input.path !== 'undefined')
            this.path = input.path;
        if (typeof input.accent !== 'undefined')
            this.accent = input.accent;
        if (typeof input.icon !== 'undefined')
            this.icon = input.icon;
        return this;
    }
    ;
}
;
exports.default = ProjectEntry;
//# sourceMappingURL=project-entry.js.map