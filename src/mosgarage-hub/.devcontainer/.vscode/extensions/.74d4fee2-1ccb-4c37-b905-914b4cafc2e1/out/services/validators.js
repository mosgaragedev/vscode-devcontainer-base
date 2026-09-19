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
exports.foldersNotExist = exports.showUnaccessibleWarning = exports.validatePermissions = void 0;
const fs_1 = require("fs");
const vscode_1 = require("vscode");
const ui_1 = require("../utils/ui");
const fs_2 = require("./fs");
const NOT_ACCESSIBLE = 'is not accessible';
function validatePermissions(path1, path2) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield validatePath(path1)) {
            validatePath(path2);
        }
    });
}
exports.validatePermissions = validatePermissions;
function showUnaccessibleWarning(path) {
    return (0, ui_1.showInfoMessageWithTimeout)(`${path} ${NOT_ACCESSIBLE}`, 4000);
}
exports.showUnaccessibleWarning = showUnaccessibleWarning;
function validatePath(path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield hasPermissionDenied(path)) {
            showUnaccessibleWarning(path);
            return false;
        }
        return true;
    });
}
function hasPermissionDenied(entryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.promises.access(entryPath, fs_1.constants.R_OK);
            return false;
        }
        catch (_a) {
            return true;
        }
    });
}
function foldersNotExist({ fsPath: uri1 }, { fsPath: uri2 }) {
    return __awaiter(this, void 0, void 0, function* () {
        const existsAsync = (yield Promise.all([vscode_1.Uri.file(uri1), vscode_1.Uri.file(uri2)]
            .map(fs_2.resourceExists)));
        const notExist = existsAsync
            .some(exists => !exists);
        return notExist;
    });
}
exports.foldersNotExist = foldersNotExist;
//# sourceMappingURL=validators.js.map