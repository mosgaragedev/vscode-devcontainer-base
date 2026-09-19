"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFileToGitignore = exports.createGitignoreFile = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const vscode_1 = require("vscode");
async function createGitignoreFile(uri) {
    const path = (0, path_1.join)(uri.path, ".gitignore");
    if ((0, fs_1.existsSync)(path)) {
        vscode_1.window.showInformationMessage("A .gitignore file already exists.");
        return;
    }
    await (0, promises_1.writeFile)(path, "");
    await showTextDocument(path);
}
exports.createGitignoreFile = createGitignoreFile;
async function addFileToGitignore(uri) {
    const root = vscode_1.workspace.getWorkspaceFolder(uri);
    if (!root)
        return;
    const content = "\n" + (0, path_1.relative)(root.uri.fsPath, uri.fsPath);
    const path = vscode_1.Uri.file((0, path_1.join)(root.uri.fsPath, ".gitignore")).fsPath;
    await (0, promises_1.appendFile)(path, content);
    await showTextDocument(path);
}
exports.addFileToGitignore = addFileToGitignore;
async function showTextDocument(path) {
    const textDocument = await vscode_1.workspace.openTextDocument(path);
    await vscode_1.window.showTextDocument(textDocument);
}
//# sourceMappingURL=commands.js.map