"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Template {
    constructor() {
        this.id = '';
        this.displayName = '';
        this.description = '';
        this.language = '';
        this.category = [];
        this.directories = [];
        this.files = {
            create: [],
            download: [],
            open: [],
        };
    }
}
exports.default = Template;
//# sourceMappingURL=Template.js.map