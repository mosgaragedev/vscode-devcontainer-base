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
const util_1 = require("./util");
class Note {
    constructor(props) {
        // e.g. $PROJECT_ROOT/path/to/file.js
        this.fsPath = props.fsPath;
        this.from = props.from;
        this.to = props.to;
        // e.g. $PROJECT_ROOT/.vscode/linenote/path/to/file.js#L5-L10.md
        this.notePath = props.notePath;
    }
    static fromFsPath(fsPath, from = 0, to = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const [projectRoot, noteRoot] = yield util_1.getRootFolders(fsPath);
            const relativePath = path.relative(projectRoot, fsPath);
            if (relativePath.startsWith("..")) {
                throw new Error("invalid file path");
            }
            const noteFile = path.resolve(noteRoot, relativePath);
            const postfix = from < to ? `L${from}-L${to}` : `L${from}`;
            return new Note({
                fsPath,
                from,
                to,
                notePath: `${noteFile}#${postfix}.md`
            });
        });
    }
    static fromNotePath(notePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const [projectRoot, noteRoot] = yield util_1.getRootFolders(notePath);
            const postfixes = notePath.match(Note.postfixMatcher);
            if (notePath.startsWith(noteRoot) && postfixes) {
                const [postfix, from, to] = postfixes;
                const relativePath = path.relative(noteRoot, notePath.slice(0, -postfix.length) // trim postfix: foo.js#L42.md => foo.js
                );
                return new Note({
                    fsPath: path.resolve(projectRoot, relativePath),
                    from: +from,
                    to: to ? +to : +from,
                    notePath
                });
            }
            else {
                throw new Error(`invalid note path: ${notePath}`);
            }
        });
    }
    fsExists() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs.stat(this.fsPath);
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    noteExists() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs.stat(this.notePath);
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    isOverlapped(from, to) {
        return this.from <= to && from <= this.to;
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.commands.executeCommand("vscode.open", vscode.Uri.file(this.notePath), {
                viewColumn: vscode.ViewColumn.Beside,
                preview: false
            });
        });
    }
    write(body) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fs.outputFile(this.notePath, body);
        });
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = yield fs.readFile(this.notePath);
            return buffer.toString();
        });
    }
    readAsMarkdown() {
        return __awaiter(this, void 0, void 0, function* () {
            const [projectRoot] = yield util_1.getRootFolders(this.fsPath);
            // true if current position is on markdown link like: [issue #123](http://...)
            let isInLink = false;
            // read body with replacing link
            const body = (yield this.read()).replace(Note.lineLinkMatcher, (match, file, from, to) => {
                // ignore link if current position is on markdown link
                if (match === "[") {
                    isInLink = true;
                    return match;
                }
                else if (match === "]") {
                    isInLink = false;
                    return match;
                }
                else if (isInLink) {
                    return match;
                }
                if (!from) {
                    return match;
                }
                if (!to) {
                    to = from;
                }
                let fsPath;
                let preLinkText;
                let linkText;
                if (file) {
                    if (file.startsWith("/") &&
                        fs.existsSync(path.join(projectRoot, file))) {
                        fsPath = path.join(projectRoot, file);
                        preLinkText = "";
                        linkText = match;
                    }
                    else if (fs.existsSync(path.resolve(path.dirname(this.fsPath), file))) {
                        fsPath = path.resolve(path.dirname(this.fsPath), file);
                        preLinkText = "";
                        linkText = match;
                    }
                    else {
                        // if text exists but the file does not,
                        // "file" string regared as just a string.
                        // i.g. "see->#L123" => "see->[#L123]($command)"
                        fsPath = this.fsPath;
                        preLinkText = file;
                        linkText = match.slice(file.length);
                    }
                }
                else {
                    fsPath = this.fsPath;
                    preLinkText = "";
                    linkText = match;
                }
                return `${preLinkText}[${linkText}](${vscode.Uri.parse(`command:linenote.revealLine?${encodeURIComponent(JSON.stringify({
                    fsPath,
                    from: +from,
                    to: +to
                }))}`)})`;
            });
            // create footer
            const edit = `[Edit](${vscode.Uri.parse(`command:linenote.openNote?${encodeURIComponent(JSON.stringify(this.notePath))}`)})`;
            const remove = `[Remove](${vscode.Uri.parse(`command:linenote.removeNote?${encodeURIComponent(JSON.stringify(this.notePath))}`)})`;
            return `${body}\n\n*${path.basename(this.notePath)}* ${edit} ${remove}`;
        });
    }
    // remove empty dir recursively
    removeDir(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            const [, noteRoot] = yield util_1.getRootFolders(dir);
            if (dir.startsWith(noteRoot)) {
                const files = yield fs.readdir(dir);
                if (!files.length) {
                    yield fs.rmdir(dir);
                    yield this.removeDir(path.resolve(dir, ".."));
                }
            }
        });
    }
    remove() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.unlink(this.notePath);
            yield this.removeDir(path.dirname(this.notePath));
        });
    }
}
// extract line number from notePath
// e.g. #L123.md , #L23-L25.md
// [match, from(, to)]
Note.postfixMatcher = /#L(\d+)(?:-L(\d+))?\.md$/;
// extract file path and line number from note body
// e.g. ../foo.js#L123 , #L23-25
// "[" or "]" or [match, file, from]
Note.lineLinkMatcher = /\[|\]|(?:([^\s#]*)#L?(\d+)(?:-L?(\d+))?)/g;
exports.Note = Note;
//# sourceMappingURL=note.js.map