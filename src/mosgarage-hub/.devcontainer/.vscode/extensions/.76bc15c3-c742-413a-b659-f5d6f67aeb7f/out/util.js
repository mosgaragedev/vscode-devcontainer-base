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
const path = require("path");
const vscode = require("vscode");
const rejected = Symbol("rejected");
// convert from $PROJECT_ROOT to $PROJECT_ROOT/.vscode/linenote
exports.fromProjectRootToNoteRoot = (projectRoot) => {
    return path.join(projectRoot, ".vscode", "linenote");
};
// get [projectRoot, noteRoot(=projectRot/.vscode/linenote)] from file path.
exports.getRootFolders = (fsPath) => __awaiter(this, void 0, void 0, function* () {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
    if (workspaceFolder) {
        const projectRoot = workspaceFolder.uri.fsPath;
        return [projectRoot, exports.fromProjectRootToNoteRoot(projectRoot)];
    }
    else {
        throw new Error("workspace not found");
    }
});
// convert from Promise<T>[] to Promise<T[]> by filtering resolved promises
exports.filterResolved = (promises) => __awaiter(this, void 0, void 0, function* () {
    const results = promises.map((p) => __awaiter(this, void 0, void 0, function* () {
        try {
            return yield p;
        }
        catch (e) {
            return rejected;
        }
    }));
    return (yield Promise.all(results)).filter((r) => r !== rejected);
});
// convert from "array of tuple" to "tuple of array"
exports.splitArr = (arr) => {
    const sList = [];
    const tList = [];
    arr.forEach(([s, t]) => {
        sList.push(s);
        tList.push(t);
    });
    return [sList, tList];
};
//# sourceMappingURL=util.js.map