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
const debounce = require("lodash.debounce");
const decorator_1 = require("./decorator");
const note_1 = require("./note");
const noteUtil_1 = require("./noteUtil");
exports.activate = (context) => {
    const decorator = new decorator_1.Decorator(context);
    let disposed = false;
    const decorateDebounce = debounce(() => {
        if (disposed) {
            return;
        }
        decorator.decorate();
    }, 500);
    decorateDebounce();
    // watch note files
    let unwatch;
    const watch = () => __awaiter(this, void 0, void 0, function* () {
        if (unwatch) {
            unwatch();
            unwatch = void 0;
        }
        if (disposed) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const fsPath = editor.document.uri.fsPath;
            if (!(yield noteUtil_1.isNotePath(fsPath))) {
                unwatch = yield noteUtil_1.watchCorrespondingNotes(fsPath, decorateDebounce);
            }
        }
    });
    watch();
    // watch notes that are not corresponding files
    const automaticallyDelete = () => __awaiter(this, void 0, void 0, function* () {
        if (disposed) {
            return;
        }
        const enable = vscode.workspace
            .getConfiguration()
            .get("linenote.automaticallyDelete");
        if (enable) {
            const interval = vscode.workspace
                .getConfiguration()
                .get("linenote.automaticallyDeleteInterval");
            if (typeof interval === "number" && interval >= 0) {
                const start = +new Date();
                yield noteUtil_1.removeNotCorrespondingNotes();
                const duration = +new Date() - start;
                setTimeout(automaticallyDelete, Math.max(0, interval - duration));
            }
        }
    });
    automaticallyDelete();
    // get [from, to] from editor.selection
    const getSelectionLineRange = (editor) => {
        return [
            // add 1 because editor's line number starts with 1, not 0
            editor.selection.start.line + 1,
            editor.selection.end.line + 1 // to
        ];
    };
    context.subscriptions.push(new vscode.Disposable(() => (disposed = true)), vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            watch();
            decorateDebounce();
        }
    }), vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor &&
            event.document === vscode.window.activeTextEditor.document) {
            decorateDebounce();
        }
    }), vscode.workspace.onDidCloseTextDocument((event) => __awaiter(this, void 0, void 0, function* () {
        // remove note if it is empty
        const fsPath = event.uri.fsPath;
        if (yield noteUtil_1.isNotePath(fsPath)) {
            const notePath = fsPath;
            const note = yield note_1.Note.fromNotePath(notePath);
            const body = yield note.read();
            if (!body.trim().length) {
                yield note.remove();
            }
        }
    })), vscode.workspace.onDidChangeConfiguration((event) => __awaiter(this, void 0, void 0, function* () {
        if (event.affectsConfiguration("linenote.lineColor") ||
            event.affectsConfiguration("linenote.rulerColor")) {
            decorator.reload();
            decorator.decorate();
        }
        // we do not need to check linenote.automaticallyDelete
        // because it is checked by 'automaticallyDelete()' every time.
    })), vscode.commands.registerCommand("linenote.addNote", () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const fsPath = editor.document.uri.fsPath;
            // do not create notes of notes
            if (yield noteUtil_1.isNotePath(fsPath)) {
                return;
            }
            const [from, to] = getSelectionLineRange(editor);
            const note = yield note_1.Note.fromFsPath(fsPath, from, to);
            // create empty note if it does not exist
            if (!(yield note.noteExists())) {
                yield note.write("");
            }
            yield note.open();
        }
    })), vscode.commands.registerCommand("linenote.openNote", (notePath) => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (notePath) {
            // open specified note (when invoked from the hover text)
            const note = yield note_1.Note.fromNotePath(notePath);
            yield note.open();
        }
        else if (editor) {
            // open all notes at current cursor (when invoked from the command palette)
            const fsPath = editor.document.uri.fsPath;
            if (yield noteUtil_1.isNotePath(fsPath)) {
                return;
            }
            const notes = yield noteUtil_1.getCorrespondingNotes(fsPath);
            const [from, to] = getSelectionLineRange(editor);
            yield Promise.all(notes
                .filter(note => note.isOverlapped(from, to))
                .map((note) => __awaiter(this, void 0, void 0, function* () { return yield note.open(); })));
        }
    })), vscode.commands.registerCommand("linenote.removeNote", (notePath) => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (notePath) {
            // remove specified note (when invoked from the hover text)
            const note = yield note_1.Note.fromNotePath(notePath);
            yield note.remove();
            decorateDebounce();
        }
        else if (editor) {
            // remove one note at current cursor (when invoked from the command palette)
            const fsPath = editor.document.uri.fsPath;
            if (yield noteUtil_1.isNotePath(fsPath)) {
                return;
            }
            const notes = yield noteUtil_1.getCorrespondingNotes(fsPath);
            const [from, to] = getSelectionLineRange(editor);
            const note = notes.find(note => note.isOverlapped(from, to));
            if (note) {
                yield note.remove();
                decorateDebounce();
            }
        }
    })), vscode.commands.registerCommand("linenote.revealLine", ({ fsPath, from, to }) => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const doc = yield vscode.workspace.openTextDocument(vscode.Uri.file(fsPath));
            const selection = new vscode.Range(
            // subtract 1 because api's line number starts with 0, not 1
            doc.lineAt(from - 1).range.start, doc.lineAt(to - 1).range.end);
            yield vscode.window.showTextDocument(doc, {
                selection
            });
        }
    })));
};
//# sourceMappingURL=extension.js.map