'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const note_builder_1 = require("./note-builder");
function activate(context) {
    let noteBuilder = null;
    context.subscriptions.push(vscode.commands.registerCommand('extension.sendPageToOneNote', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("You must have a document open to send to OneNote.");
            return;
        }
        noteBuilder = new note_builder_1.default();
        noteBuilder.addTitle('Sent from Visual Studio Code: ' + editor.document.fileName.replace(/^.*[\\\/]/, ''));
        if (editor.document.languageId === 'markdown') {
            noteBuilder.addMarkDownContent(editor.document.getText());
        }
        else {
            noteBuilder.addCodeContent(editor.document.languageId, editor.document.getText());
        }
        noteBuilder.applyStyle(vscode.workspace.getConfiguration('stone.theme'));
        noteBuilder.create();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('extension.sendSelectionToOneNote', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("You must have a document open to send to OneNote.");
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (selectedText.length === 0) {
            vscode.window.showErrorMessage("You must have text selected to send to OneNote.");
            return;
        }
        noteBuilder = new note_builder_1.default();
        noteBuilder.addTitle('Sent from Visual Studio Code: Part of ' + editor.document.fileName.replace(/^.*[\\\/]/, ''));
        if (editor.document.languageId === 'markdown') {
            noteBuilder.addMarkDownContent(selectedText);
        }
        else {
            noteBuilder.addCodeContent(editor.document.languageId, selectedText);
        }
        noteBuilder.applyStyle(vscode.workspace.getConfiguration('stone.theme'));
        noteBuilder.create();
    }));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map