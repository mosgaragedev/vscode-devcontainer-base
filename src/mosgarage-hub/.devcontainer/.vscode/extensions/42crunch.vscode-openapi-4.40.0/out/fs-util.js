"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.basename = basename;
exports.relative = relative;
exports.dirname = dirname;
exports.dirnameUri = dirnameUri;
const node_path_1 = __importDefault(require("node:path"));
function basename(uri) {
    return node_path_1.default.posix.basename(uri.path);
}
function relative(root, uri) {
    return node_path_1.default.posix.relative(root.path, uri.path);
}
function dirname(uri) {
    if (uri.path.length === 0 || uri.path === "/") {
        return "/";
    }
    return node_path_1.default.posix.dirname(uri.path);
}
function dirnameUri(uri) {
    if (uri.path.length === 0 || uri.path === "/") {
        return uri.with({ path: "/" });
    }
    return uri.with({ path: node_path_1.default.posix.dirname(uri.path) });
}
//# sourceMappingURL=fs-util.js.map