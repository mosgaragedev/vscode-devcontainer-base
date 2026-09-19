"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const project_entry_1 = require("./project-entry");
class ProjectFolder {
    constructor(input) {
        this.id = input.id;
        this.name = input.name;
        this.icon = input.icon ?? this.getIcon();
        this.accent = input.accent ?? 'var(--DashboardProjectAccent)';
        this.open = input.open ?? false;
        this.projects = (Array.isArray(input.projects) ?
            input.projects.map(((v) => new project_entry_1.default(v))) :
            []);
        return;
    }
    ;
    getIcon() {
        return 'codicon-folder';
    }
    ;
    update(input) {
        if (typeof input.id !== 'undefined')
            this.id = input.id;
        if (typeof input.name !== 'undefined')
            this.name = input.name;
        if (typeof input.accent !== 'undefined')
            this.accent = input.accent;
        if (typeof input.icon !== 'undefined')
            this.icon = input.icon;
        if (typeof input.open !== 'undefined')
            this.open = input.open;
        return this;
    }
    ;
}
;
exports.default = ProjectFolder;
//# sourceMappingURL=project-folder.js.map