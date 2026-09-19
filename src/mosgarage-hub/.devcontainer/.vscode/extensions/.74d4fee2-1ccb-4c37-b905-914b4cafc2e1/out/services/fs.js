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
exports.resourceExists = exports.readFileSync = exports.pathExistsSync = void 0;
const vscode_1 = require("vscode");
const fs_extra_1 = require("fs-extra");
const pathExistsSync = (path) => {
    return (0, fs_extra_1.pathExistsSync)(path);
};
exports.pathExistsSync = pathExistsSync;
const readFileSync = (path, encoding) => {
    return (0, fs_extra_1.readFileSync)(path, encoding);
};
exports.readFileSync = readFileSync;
function resourceExists(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield vscode_1.workspace.fs.stat(uri);
            return true;
        }
        catch (error) {
            return false;
        }
    });
}
exports.resourceExists = resourceExists;
//# sourceMappingURL=fs.js.map