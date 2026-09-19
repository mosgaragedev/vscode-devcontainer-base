"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const commands_1 = require("./commands");
const Fenix_1 = require("./core/Fenix");
function activate(context) {
    Fenix_1.default.init(context);
    const commands = Object.assign({ 'fenix.open': () => Fenix_1.default.get().show() }, commands_1.default);
    for (const command in commands) {
        context.subscriptions.push(vscode.commands.registerCommand(command, commands[command]));
    }
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map