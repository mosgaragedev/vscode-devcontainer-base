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
const fs = require("fs-extra");
const path = require("path");
const vscode = require("vscode");
const chokidar = require("chokidar");
const util_1 = require("./util");
const note_1 = require("./note");
exports.isNotePath = (notePath) => __awaiter(this, void 0, void 0, function* () {
    const [, noteRoot] = yield util_1.getRootFolders(notePath);
    return notePath.startsWith(yield noteRoot);
});
// it is called only by getAllNotes().
// get all notes in $PROJECT_ROOT/.vscode/linenote
const getAllNotesInNoteRoot = (dir) => __awaiter(this, void 0, void 0, function* () {
    let files;
    try {
        files = yield fs.readdir(dir);
    }
    catch (e) {
        // if linenote dir does not exist
        return [];
    }
    const notes = [];
    yield Promise.all(files.map((f) => __awaiter(this, void 0, void 0, function* () {
        const p = path.join(dir, f);
        const stat = yield fs.stat(p);
        if (stat.isDirectory()) {
            // recursive
            notes.push(...(yield getAllNotesInNoteRoot(p)));
        }
        else if (stat.isFile()) {
            try {
                notes.push(yield note_1.Note.fromNotePath(p));
            }
            catch (e) {
                // ignore files except notes (but what?)
            }
        }
    })));
    return notes;
});
// get all notes in all workspaces
const getAllNotes = () => __awaiter(this, void 0, void 0, function* () {
    const folders = vscode.workspace.workspaceFolders;
    if (folders) {
        return (yield Promise.all(folders.map((f) => __awaiter(this, void 0, void 0, function* () {
            const noteRoot = util_1.fromProjectRootToNoteRoot(f.uri.fsPath);
            return yield getAllNotesInNoteRoot(noteRoot);
        })))).reduce((acc, arr) => acc.concat(arr), []); // flat
    }
    else {
        return [];
    }
});
exports.removeNotCorrespondingNotes = () => __awaiter(this, void 0, void 0, function* () {
    yield Promise.all((yield getAllNotes()).map((note) => __awaiter(this, void 0, void 0, function* () {
        if (!(yield note.fsExists())) {
            yield note.remove();
        }
    })));
});
exports.getCorrespondingNotes = (fsPath) => __awaiter(this, void 0, void 0, function* () {
    const tmpNote = yield note_1.Note.fromFsPath(fsPath);
    const dir = path.dirname(tmpNote.notePath);
    let files;
    try {
        files = yield fs.readdir(dir);
    }
    catch (e) {
        // if linenote dir does not exist
        return [];
    }
    const notes = yield util_1.filterResolved(files.map(f => path.join(dir, f)).map(f => note_1.Note.fromNotePath(f)));
    return notes.filter(p => p.fsPath === fsPath);
});
exports.watchCorrespondingNotes = (fsPath, onChange) => __awaiter(this, void 0, void 0, function* () {
    const tmpNote = yield note_1.Note.fromFsPath(fsPath);
    const watcher = chokidar.watch(path.dirname(tmpNote.notePath), {
        persistent: false,
        ignoreInitial: true
    });
    watcher
        .on("add", (notePath) => __awaiter(this, void 0, void 0, function* () {
        const stat = yield fs.stat(notePath);
        if (stat.isFile()) {
            const note = yield note_1.Note.fromNotePath(notePath);
            if (note.fsPath === fsPath) {
                onChange();
            }
        }
    }))
        .on("unlink", (notePath) => __awaiter(this, void 0, void 0, function* () {
        // we cannnot use fs.stat because the note no longer exists
        try {
            const note = yield note_1.Note.fromNotePath(notePath);
            if (note.fsPath === fsPath) {
                onChange();
            }
        }
        catch (e) {
            // ignore
        }
    }));
    return () => {
        watcher.close();
    };
});
//# sourceMappingURL=noteUtil.js.map