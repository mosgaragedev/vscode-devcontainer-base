"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.addFileToGitIgnore = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const util_1 = require("util");
const readFile = util_1.promisify(fs.readFile);
const writeFile = util_1.promisify(fs.writeFile);
const IGNORE_FILES = {
    '.gitignore (shared)': '.gitignore',
    '.git/info/exclude (private)': path.join(".git", "info", "exclude")
};
function getRoot(pathname) {
    var _a, _b;
    return (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a.find((f) => pathname.startsWith(f.uri.path))) === null || _b === void 0 ? void 0 : _b.uri.fsPath;
}
function getPatterns(root, pathname) {
    pathname = pathname.substr(root.length + 1, pathname.length);
    const basename = path.basename(pathname);
    const ext = path.extname(pathname);
    let isdir = false;
    try {
        isdir = fs.lstatSync(pathname).isDirectory();
    }
    catch (_a) { }
    if (!pathname.startsWith("/")) {
        pathname = "/" + pathname;
    }
    if (ext && !isdir) {
        let dirname = path.dirname(pathname);
        if (dirname === "." || dirname === "/") {
            dirname = "";
        }
        return [basename, `*${ext}`, pathname, `${dirname}/*${ext}`];
    }
    else {
        return [basename, pathname];
    }
}
function showIgnoreFile(ignorePath, line = -1) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = yield vscode.window.showTextDocument(vscode.Uri.file(ignorePath));
        if (editor && line >= -1) {
            const range = editor.document.lineAt(line > -1 ? line : editor.document.lineCount - 1).range;
            editor.revealRange(range);
            if (line >= 0) {
                editor.selection = new vscode.Selection(range.start, range.end);
            }
        }
    });
}
function addPathToIgnore(root, pattern, file = ".gitignore") {
    return __awaiter(this, void 0, void 0, function* () {
        const ignorePath = path.join(root, file);
        try {
            const ignoreContent = (yield readFile(ignorePath)).toString().split(/(?:\r\n|\r|\n)/g);
            const line = ignoreContent.indexOf(pattern);
            if (line !== -1) {
                yield showIgnoreFile(ignorePath, line);
                return;
            }
            if (ignoreContent[ignoreContent.length - 1] !== "") {
                pattern = "\n" + pattern;
            }
        }
        catch (_a) { }
        yield writeFile(ignorePath, pattern + "\n", { flag: "a" });
        yield showIgnoreFile(ignorePath);
    });
}
function addFileToGitIgnore(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const root = getRoot(uri.path);
        if (!root) {
            return;
        }
        const patterns = getPatterns(root, uri.path);
        const pattern = yield vscode.window.showQuickPick(patterns, {
            placeHolder: "Select pattern to add...",
        });
        if (!pattern) {
            return;
        }
        const selected_file = yield vscode.window.showQuickPick(Object.keys(IGNORE_FILES), {
            placeHolder: `Select file to add '${pattern}' to...`,
        });
        if (!selected_file) {
            return;
        }
        yield addPathToIgnore(root, pattern, IGNORE_FILES[selected_file]);
    });
}
exports.addFileToGitIgnore = addFileToGitIgnore;
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("addToGitignore.addFileToGitIgnore", addFileToGitIgnore));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map