"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/* IMPORT */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const utils_1 = require("./utils");
const vscode = require("vscode");
const vscode_1 = require("vscode");
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "open-git-remote" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('open-git-remote.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from open-git-remote!');
    });
    const mrBar = vscode.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 99);
    mrBar.command = 'openInGitHub.openPrOrMr';
    mrBar.text = '$(git-pull-request)合并请求';
    mrBar.tooltip = '打开仓库MR';
    mrBar.show();
    const statusBar = vscode.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 100);
    statusBar.command = 'openInGitHub.openProject';
    statusBar.text = '$(github)';
    statusBar.tooltip = '打开远程仓库';
    statusBar.show();
    context.subscriptions.push(disposable);
    return utils_1.default.initCommands(context);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map