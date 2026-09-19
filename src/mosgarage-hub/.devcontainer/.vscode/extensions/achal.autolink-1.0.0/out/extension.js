"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// const fs = require("fs");
const fs = require("fs");
let ignorePaths = new Set();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var _a;
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension autolink is now active!');
    let username = require("os").userInfo().username;
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    // vscode.
    (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a.forEach(element => {
        // console.log(element);
        let path = element.uri.path;
        if (ignorePaths.has(path)) {
            return;
        }
        // ideally path should be /nfs/<node>/<user>/...
        let splits = path.split("/");
        // so ideally splits should be ["", "nfs", "<node>", "<user>" ... ]
        // detect if we are on an nfs
        if (splits[1] !== "nfs") {
            return;
        }
        // assert(username === splits[3])
        // ignore if a subfolder is not added
        if (splits.length < 5) {
            return;
        }
        let targetPrefix = "/nfs/" + splits[2] + "/" + splits[3];
        let localPrefix = "/home/" + username;
        let relativePath = "";
        for (let index = 4; index < splits.length; index++) {
            relativePath += "/" + splits[index];
            if (fs.existsSync(localPrefix + relativePath)) {
                continue;
            }
            else {
                break;
            }
        }
        if (fs.existsSync(localPrefix + relativePath)) {
            // console.log(path, "Already exists in local home");
            ignorePaths.add(path);
            return;
        }
        // symlink path
        let symlinkPath = localPrefix + relativePath;
        // symlink target dir is
        let targetDir = targetPrefix + relativePath;
        // this is the local path that is not there in the current working directory
        // this local path links the biggest possible directory
        vscode.window.showInformationMessage("The directory: " + path + " does not seem to be present in\
		in your local working directory, do you want to symlink it?", ...["Yes", "No"]).then((value) => {
            // console.log(value);
            if (value === "Yes") {
                fs.symlink(targetDir, symlinkPath, "dir", (err) => { if (err) {
                    vscode.window.showInformationMessage(err.toString());
                } });
            }
            ignorePaths.add(path);
        });
        // fs.symlink(path, "/home/" + username + "/", "dir", () => {console.log("created");} );
        // check if the folder exists in /home/
        // let cluster = splits[]
        // for(let i = 0; i<)
    });
    // let disposable = vscode.commands.registerCommand('autolink.refresh', () => {
    // 	// The code you place here will be executed every time your command is executed
    // 	// Display a message box to the user
    // 	vscode.window.showInformationMessage('Hello World from autolink!');
    // });
    // context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map