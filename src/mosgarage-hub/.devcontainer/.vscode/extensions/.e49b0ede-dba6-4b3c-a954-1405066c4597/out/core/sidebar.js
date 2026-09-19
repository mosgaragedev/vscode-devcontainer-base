"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Sidebar {
    constructor(api) {
        this.id = "dashyeah-dashboard-sidebar";
        this.api = api;
        this.api.ext.subscriptions
            .push(vscode.window.registerWebviewViewProvider(this.id, this));
        return;
    }
    resolveWebviewView(view, ctx, token) {
        this.view = view;
        this.ctx = ctx;
        this.token = token;
        (this.view)
            .onDidChangeVisibility(this.open.bind(this));
        this.view.webview.html = `
			TODO: Sidebar Mode
		`;
        this.open();
        return;
    }
    ;
    onChange() {
        this.api.open();
        return;
    }
    ;
    open() {
        if (typeof this.view === 'undefined')
            return;
        if (this.api.conf.tabMode) {
            vscode.commands.executeCommand("workbench.view.explorer");
            this.api.open();
        }
        // else, just let it open in the sidebar.
        return;
    }
}
;
exports.default = Sidebar;
//# sourceMappingURL=sidebar.js.map