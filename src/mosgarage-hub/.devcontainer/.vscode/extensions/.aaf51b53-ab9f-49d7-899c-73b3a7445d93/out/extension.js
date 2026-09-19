"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode_1 = require("vscode");
const client_1 = require("./client");
const commands_1 = require("./features/commands");
let client;
function activate(context) {
    client = (0, client_1.createClient)(context);
    client.start();
    vscode_1.commands.registerCommand("gitignore-ultimate.create-gitignore", commands_1.createGitignoreFile);
    vscode_1.commands.registerCommand("gitignore-ultimate.add-to-gitignore", commands_1.addFileToGitignore);
    console.log("GitIgnore Ultimate is now active.");
}
exports.activate = activate;
function deactivate() {
    return (0, client_1.stopClient)(client);
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map