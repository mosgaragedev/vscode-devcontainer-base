"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("./util");
const noteUtil_1 = require("./noteUtil");
let lineDecorator;
let gutterDecorator;
exports.initDecorator = () => __awaiter(this, void 0, void 0, function* () {
    if (lineDecorator) {
        lineDecorator.dispose();
    }
    if (gutterDecorator) {
        gutterDecorator.dispose();
    }
    const lineProp = {};
    const gutterProp = {};
    // set line color
    const line = vscode.workspace
        .getConfiguration()
        .get("linenote.lineColor");
    if (line && line.trim().length) {
        lineProp.backgroundColor = line.trim();
    }
    // set ruler color
    const ruler = vscode.workspace
        .getConfiguration()
        .get("linenote.rulerColor");
    if (ruler && ruler.trim().length) {
        lineProp.overviewRulerLane = vscode.OverviewRulerLane.Right;
        lineProp.overviewRulerColor = ruler.trim();
    }
    gutterProp.gutterIconPath = "/Users/tkrkt/workspace/linenote/images/icon.png";
    lineDecorator = vscode.window.createTextEditorDecorationType(lineProp);
    gutterDecorator = vscode.window.createTextEditorDecorationType(gutterProp);
});
exports.decorate = () => __awaiter(this, void 0, void 0, function* () {
    if (!vscode.window.activeTextEditor) {
        return;
    }
    const editor = vscode.window.activeTextEditor;
    const fsPath = editor.document.uri.fsPath;
    // do not decorate the note itself
    if (yield noteUtil_1.isNotePath(fsPath)) {
        return;
    }
    // load notes and create decoration options
    const notes = yield noteUtil_1.getCorrespondingNotes(fsPath);
    const [lineProps, gutterProps] = util_1.splitArr(yield util_1.filterResolved(notes.map((note) => __awaiter(this, void 0, void 0, function* () {
        const markdown = new vscode.MarkdownString(yield note.readAsMarkdown());
        markdown.isTrusted = true;
        return [
            {
                range: new vscode.Range(
                // subtract 1 because api's line number starts with 0, not 1
                editor.document.lineAt(note.from - 1).range.start, editor.document.lineAt(note.to - 1).range.end),
                hoverMessage: markdown
            },
            {
                range: new vscode.Range(editor.document.lineAt(note.from - 1).range.start, editor.document.lineAt(note.from - 1).range.start),
                hoverMessage: markdown
            }
        ];
    }))));
    // init decorator for first use
    if (!lineDecorator || !gutterDecorator) {
        yield exports.initDecorator();
    }
    // recheck editor (because I used 'await'!)
    if (vscode.window.activeTextEditor !== editor) {
        return;
    }
    editor.setDecorations(lineDecorator, lineProps);
    editor.setDecorations(gutterDecorator, gutterProps);
});
//# sourceMappingURL=decorator.1.js.map